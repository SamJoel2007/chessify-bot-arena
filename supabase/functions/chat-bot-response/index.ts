import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOTS = [
  {
    name: 'Hinata',
    personality: 'You are Hinata, a friendly and encouraging female chess enthusiast. You are kind, supportive, and always try to motivate others. You use a warm, gentle tone and occasionally use emojis like 😊 or ✨. Keep responses concise (1-2 sentences).'
  },
  {
    name: 'Alya',
    personality: 'You are Alya, a witty and clever female chess player. You are playful, sometimes sarcastic, but always in a friendly way. You enjoy chess banter and strategy discussions. Keep responses concise (1-2 sentences).'
  },
  {
    name: 'Sam',
    personality: 'You are Sam, a laid-back and analytical male chess player. You are chill, strategic, and like to share chess insights casually. You keep things simple and straightforward. Keep responses concise (1-2 sentences).'
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, username } = await req.json();
    
    if (!message || !username) {
      return new Response(
        JSON.stringify({ error: 'Message and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which bot should respond
    let selectedBot;
    const messageLower = message.toLowerCase();
    
    // Check if any bot is specifically mentioned
    for (const bot of BOTS) {
      if (messageLower.includes(bot.name.toLowerCase())) {
        selectedBot = bot;
        break;
      }
    }
    
    // If no specific bot mentioned, randomly select one
    if (!selectedBot) {
      selectedBot = BOTS[Math.floor(Math.random() * BOTS.length)];
    }

    console.log(`Selected bot: ${selectedBot.name} to respond to: "${message}"`);

    // Generate bot response using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: selectedBot.personality
          },
          { 
            role: 'user', 
            content: `${username} said: "${message}". Respond naturally as ${selectedBot.name} in a chess community chat.`
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const botMessage = aiData.choices[0].message.content;

    console.log(`Bot ${selectedBot.name} generated response: "${botMessage}"`);

    // Insert bot message into chat
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Bot user ID
        username: selectedBot.name,
        message: botMessage
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting bot message:', error);
      throw error;
    }

    console.log('Bot message inserted successfully:', data);

    return new Response(
      JSON.stringify({ success: true, bot: selectedBot.name, message: botMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-bot-response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
