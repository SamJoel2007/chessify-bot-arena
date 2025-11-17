import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOTS = [
  {
    name: 'Hinata',
    responses: {
      greeting: ['Hey there! 😊 Ready for some chess?', 'Hi! Nice to see you here! ✨', 'Hello! Want to talk about chess strategies?'],
      help: ['I can help you with opening strategies! What would you like to know?', 'Need some chess tips? I\'m here to help! 😊'],
      chess: ['Chess is such a beautiful game! What\'s your favorite opening?', 'I love discussing chess tactics! ✨'],
      default: ['That\'s interesting! Tell me more 😊', 'I see! Keep practicing and you\'ll improve! ✨', 'Great point! What do you think about trying different strategies?']
    }
  },
  {
    name: 'Alya',
    responses: {
      greeting: ['Well, well, look who showed up! 😏', 'Hey! Ready to lose at chess? Just kidding! 😄', 'Yo! What\'s your chess rating?'],
      help: ['Let me guess, you need help with endgames? 😏', 'Stuck on a move? Happens to everyone!'],
      chess: ['Ah, a fellow chess nerd! My kind of person 😄', 'Chess talk? Now we\'re talking!'],
      default: ['Hmm, interesting take 🤔', 'Bold move! I like it 😏', 'Not bad, not bad at all!']
    }
  },
  {
    name: 'Sam',
    responses: {
      greeting: ['Hey, what\'s up?', 'Yo! How\'s your chess game going?', 'Hey there, chess player!'],
      help: ['Sure, what do you need help with?', 'I can share some tips if you want.'],
      chess: ['Chess is pretty cool. What do you usually play?', 'Nice, always good to see chess enthusiasts.'],
      default: ['Yeah, I feel you.', 'Makes sense.', 'That\'s a good point.']
    }
  }
];

function getBotResponse(botName: string, message: string): string {
  const bot = BOTS.find(b => b.name === botName);
  if (!bot) return "Hey there!";
  
  const lowerMsg = message.toLowerCase();
  
  // Check for greetings
  if (lowerMsg.match(/\b(hi|hello|hey|sup|yo|greetings)\b/)) {
    return bot.responses.greeting[Math.floor(Math.random() * bot.responses.greeting.length)];
  }
  
  // Check for help requests
  if (lowerMsg.match(/\b(help|advice|tip|guide|how)\b/)) {
    return bot.responses.help[Math.floor(Math.random() * bot.responses.help.length)];
  }
  
  // Check for chess-related keywords
  if (lowerMsg.match(/\b(chess|move|game|strategy|tactic|opening|endgame|checkmate|piece)\b/)) {
    return bot.responses.chess[Math.floor(Math.random() * bot.responses.chess.length)];
  }
  
  // Default response
  return bot.responses.default[Math.floor(Math.random() * bot.responses.default.length)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, username, activeUserCount } = await req.json();
    
    if (!message || !username) {
      return new Response(
        JSON.stringify({ error: 'Message and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only respond if there's only 1 user in the chat
    if (activeUserCount !== 1) {
      console.log(`Skipping bot response - ${activeUserCount} users active`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Multiple users present' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log(`Bot ${selectedBot.name} responding to: "${message}"`);

    // Generate bot response using keyword matching
    const botMessage = getBotResponse(selectedBot.name, message);

    // Insert bot message into chat (supabase client already initialized above)
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        username: selectedBot.name,
        message: botMessage
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting bot message:', error);
      throw error;
    }

    console.log(`Bot message inserted: "${botMessage}"`);

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
