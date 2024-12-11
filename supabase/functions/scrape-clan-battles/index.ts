import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
};

const fetchWithProxy = async (url: string, page = 1) => {
  const apiKey = Deno.env.get('SCRAPEOPS_API_KEY');
  if (!apiKey) {
    throw new Error('SCRAPEOPS_API_KEY is not set');
  }

  const pageUrl = `${url}${page > 1 ? `?page=${page}` : ''}`;
  const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${apiKey}&url=${encodeURIComponent(pageUrl)}`;
  const response = await fetch(proxyUrl);
  return response.text();
};

const hasNextPage = (html: string): boolean => {
  // Check if there's a "Next" button/link in the pagination
  return html.includes('class="item next"') || html.includes('class="next page"');
};

const extractBattles = (html: string) => {
  const battles: any[] = [];
  const battleBlocks = html.split('class="ui attached segment');
  console.log(`Found ${battleBlocks.length - 1} potential battle blocks on current page`);
  
  battleBlocks.slice(1).forEach((block, index) => {
    try {
      const idMatch = block.match(/battle_(\d+\.\d+)/);
      const battleId = idMatch ? idMatch[1] : `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`Processing battle ID: ${battleId}`);

      const typeMatch = block.match(/game_mode_header.*?>([^<]+)</);
      const type = typeMatch ? typeMatch[1].trim() : 'Unknown';

      const timeMatch = block.match(/data-timestamp="(\d+\.\d+)"/);
      const battleTime = timeMatch 
        ? new Date(parseFloat(timeMatch[1]) * 1000).toISOString()
        : new Date().toISOString();

      const player1NameMatch = block.match(/player_name_header.*?>([^<]+)</);
      const player2NameMatch = block.match(/player_name_header.*?>([^<]+)<\/a>[^<]*<\/div>[^<]*<div[^>]*>[^<]*<a[^>]*>([^<]+)</);
      
      const crownMatches = block.match(/result_header.*?>.*?(\d+)\s*-\s*(\d+)/s);
      const clanMatches = block.match(/battle_player_clan.*?>([^<]+)</g);

      if (player1NameMatch && player2NameMatch && crownMatches) {
        const player1Name = player1NameMatch[1].trim();
        const player2Name = player2NameMatch[2].trim();
        const player1Clan = clanMatches ? clanMatches[0].match(/>([^<]+)</)[1].trim() : null;
        const player2Clan = clanMatches && clanMatches[1] ? clanMatches[1].match(/>([^<]+)</)[1].trim() : null;
        const player1Crowns = parseInt(crownMatches[1]);
        const player2Crowns = parseInt(crownMatches[2]);

        const isFriendly = block.includes('battle_icon_centered_v3__is_clan_friendly');

        const battle = {
          battle_id: battleId,
          battle_time: battleTime,
          type,
          player1_name,
          player2_name,
          player1_crowns,
          player2_crowns,
          is_friendly_battle: isFriendly,
          player1_clan,
          player2_clan
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

  console.log(`Successfully extracted ${battles.length} battles from current page`);
  return battles;
};

const saveBattlesToSupabase = async (battles: any[]) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Processing battles:', battles.length);

  for (const battle of battles) {
    try {
      const { player1_name, player2_name, player1_clan, player2_clan, ...battleData } = battle;

      // Upsert player 1
      const { data: player1 } = await supabase
        .from('players')
        .upsert({ 
          id: player1_name, 
          name: player1_name,
          clan_name: player1_clan
        })
        .select()
        .single();

      // Upsert player 2
      const { data: player2 } = await supabase
        .from('players')
        .upsert({ 
          id: player2_name, 
          name: player2_name,
          clan_name: player2_clan
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

const scrapeAllPages = async (baseUrl: string) => {
  let page = 1;
  let totalBattles = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Scraping page ${page}...`);
    const html = await fetchWithProxy(baseUrl, page);
    const battles = extractBattles(html);
    
    if (battles.length > 0) {
      await saveBattlesToSupabase(battles);
      totalBattles += battles.length;
    }

    hasMore = hasNextPage(html) && battles.length > 0;
    if (hasMore) {
      page++;
      // Add a small delay between pages to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return totalBattles;
};

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = 'https://royaleapi.com/clan/L8VLU0P8/battles';
    console.log('Starting battle scraping from:', url);

    const totalBattles = await scrapeAllPages(url);
    console.log('Completed scraping. Total battles processed:', totalBattles);

    return new Response(
      JSON.stringify({ success: true, battlesProcessed: totalBattles }),
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