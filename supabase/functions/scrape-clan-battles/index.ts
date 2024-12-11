import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
  const battles: any[] = [];
  // Look for battle segments using the class name
  const battleBlocks = html.split('class="ui attached segment');
  console.log(`Found ${battleBlocks.length - 1} potential battle blocks`);
  
  battleBlocks.slice(1).forEach((block, index) => {
    try {
      // Extract battle ID from the div id attribute
      const idMatch = block.match(/battle_(\d+\.\d+)/);
      const battleId = idMatch ? idMatch[1] : `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Processing battle ID: ${battleId}`);

      // Extract battle type (e.g., "Mirror Battle")
      const typeMatch = block.match(/game_mode_header.*?>([^<]+)</);
      const type = typeMatch ? typeMatch[1].trim() : 'Unknown';

      // Extract battle time from timestamp attribute
      const timeMatch = block.match(/data-timestamp="(\d+\.\d+)"/);
      const battleTime = timeMatch 
        ? new Date(parseFloat(timeMatch[1]) * 1000).toISOString()
        : new Date().toISOString();

      // Extract player names and clans using the specific class names
      const player1NameMatch = block.match(/player_name_header.*?>([^<]+)</);
      const player2NameMatch = block.match(/player_name_header.*?>([^<]+)<\/a>[^<]*<\/div>[^<]*<div[^>]*>[^<]*<a[^>]*>([^<]+)</);
      
      // Extract crowns from the result header
      const crownMatches = block.match(/result_header.*?>.*?(\d+)\s*-\s*(\d+)/s);

      if (player1NameMatch && player2NameMatch && crownMatches) {
        const player1Name = player1NameMatch[1].trim();
        const player2Name = player2NameMatch[1].trim();
        const player1Crowns = parseInt(crownMatches[1]);
        const player2Crowns = parseInt(crownMatches[2]);

        // Check if it's a friendly battle
        const isFriendly = block.includes('battle_icon_centered_v3__is_clan_friendly');

        const battle = {
          battle_id: battleId,
          battle_time: battleTime,
          type,
          player1_name: player1Name,
          player2_name: player2Name,
          player1_crowns,
          player2_crowns,
          is_friendly_battle: isFriendly
        };

        console.log(`Extracted battle:`, battle);
        battles.push(battle);
      } else {
        console.log(`Skipping battle ${index + 1} due to missing required data`);
      }
    } catch (error) {
      console.error('Error parsing battle block:', error);
    }
  });

  console.log(`Successfully extracted ${battles.length} battles`);
  return battles;
};

const saveBattlesToSupabase = async (battles: any[]) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Processing battles:', battles.length);

  for (const battle of battles) {
    try {
      const { player1_name, player2_name, ...battleData } = battle;

      // Upsert player 1
      const { data: player1 } = await supabase
        .from('players')
        .upsert({ 
          id: player1_name, 
          name: player1_name,
        })
        .select()
        .single();

      // Upsert player 2
      const { data: player2 } = await supabase
        .from('players')
        .upsert({ 
          id: player2_name, 
          name: player2_name,
        })
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