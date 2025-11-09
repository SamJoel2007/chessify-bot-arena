import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { displayName } = await req.json();

    // Generate unique session token
    const sessionToken = crypto.randomUUID();

    // Generate guest display name if not provided
    const guestDisplayName = displayName || `Guest_${Math.floor(Math.random() * 10000)}`;

    // Create guest player
    const { data: guestPlayer, error } = await supabase
      .from('guest_players')
      .insert({
        session_token: sessionToken,
        display_name: guestDisplayName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating guest player:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create guest session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Guest player created:', guestPlayer.id);

    return new Response(
      JSON.stringify({
        guestPlayerId: guestPlayer.id,
        sessionToken: guestPlayer.session_token,
        displayName: guestPlayer.display_name,
        expiresAt: guestPlayer.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
