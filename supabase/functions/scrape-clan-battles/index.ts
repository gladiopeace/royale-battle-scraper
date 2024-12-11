import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
};

const fetchWithProxy = async (url: string) => {
  const apiKey = Deno.env.get('SCRAPEOPS_API_KEY');
  if (!apiKey) {
    throw new Error('SCRAPEOPS_API_KEY is not set');
  }

  const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  return response.text();
};

const extractBattles = (html: string) => {
  // Basic extraction using string manipulation since we can't use DOM parsing in Deno
  const battles: any[] = [];
  const battleBlocks = html.split('class="battles_row"');
  
  battleBlocks.slice(1).forEach((block) => {
    try {
      // Extract battle time
      const timeMatch = block.match(/datetime="([^"]+)"/);
      const battleTime = timeMatch ? timeMatch[1] : null;

      // Extract battle type
      const typeMatch = block.match(/battle_type.*?>([^<]+)</);
      const type = typeMatch ? typeMatch[1].trim() : 'Unknown';

      // Extract player names and crowns
      const playerMatches = block.match(/player_name.*?>([^<]+)</g);
      const crownMatches = block.match(/crowns.*?>(\d+)</g);

      if (playerMatches && playerMatches.length >= 2 && crownMatches && crownMatches.length >= 2) {
        const player1Name = playerMatches[0].match(/>([^<]+)</)[1];
        const player2Name = playerMatches[1].match(/>([^<]+)</)[1];
        const player1Crowns = parseInt(crownMatches[0].match(/(\d+)/)[1]);
        const player2Crowns = parseInt(crownMatches[1].match(/(\d+)/)[1]);

        // Extract battle ID (using timestamp as fallback)
        const idMatch = block.match(/battle_id="([^"]+)"/);
        const battleId = idMatch ? idMatch[1] : `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        battles.push({
          battle_id: battleId,
          battle_time: battleTime,
          type,
          player1_name: player1Name,
          player2_name: player2Name,
          player1_crowns,
          player2_crowns,
          is_friendly_battle: type.toLowerCase().includes('friendly')
        });
      }
    } catch (error) {
      console.error('Error parsing battle block:', error);
    }
  });

  return battles;
};

const saveBattlesToSupabase = async (battles: any[]) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Processing battles:', battles.length);

  for (const battle of battles) {
    try {
      // First ensure both players exist
      const { player1_name, player2_name, ...battleData } = battle;

      // Upsert player 1
      const { data: player1 } = await supabase
        .from('players')
        .upsert({ id: player1_name, name: player1_name })
        .select()
        .single();

      // Upsert player 2
      const { data: player2 } = await supabase
        .from('players')
        .upsert({ id: player2_name, name: player2_name })
        .select()
        .single();

      if (player1 && player2) {
        // Insert battle with player references
        const { error: battleError } = await supabase
          .from('battles')
          .upsert({
            ...battleData,
            player1_id: player1.id,
            player2_id: player2.id,
          });

        if (battleError) {
          console.error('Error inserting battle:', battleError);
        }
      }
    } catch (error) {
      console.error('Error processing battle:', error);
    }
  }

  // Update player statistics
  const { error: updateError } = await supabase.rpc('update_player_stats');
  if (updateError) {
    console.error('Error updating player stats:', updateError);
  }
};

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = 'https://royaleapi.com/clan/L8VLU0P8/battles';
    console.log('Fetching battles from:', url);

    const html = await fetchWithProxy(url);
    console.log('Successfully fetched HTML');

    const battles = extractBattles(html);
    console.log('Extracted battles:', battles.length);

    await saveBattlesToSupabase(battles);
    console.log('Successfully saved battles to Supabase');

    return new Response(
      JSON.stringify({ success: true, battlesProcessed: battles.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});