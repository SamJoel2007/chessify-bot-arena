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

    const { inviteCode, guestPlayerId, sessionToken } = await req.json();

    // Validate guest session
    const { data: guestPlayer, error: guestError } = await supabase
      .from('guest_players')
      .select('*')
      .eq('id', guestPlayerId)
      .eq('session_token', sessionToken)
      .single();

    if (guestError || !guestPlayer) {
      return new Response(
        JSON.stringify({ error: 'Invalid guest session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session expired
    if (new Date(guestPlayer.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Guest session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('game_invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invite expired
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invite has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if invite already used
    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Invite already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update invite status to 'joined'
    const { error: updateError } = await supabase
      .from('game_invites')
      .update({
        status: 'joined',
        guest_player_id: guestPlayerId,
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to join game' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Guest joined invite:', inviteCode);

    return new Response(
      JSON.stringify({
        success: true,
        inviteId: invite.id,
        hostUsername: invite.host_username,
        hostAvatar: invite.host_avatar,
        timeControl: invite.time_control,
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
