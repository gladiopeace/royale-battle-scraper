import { processBattleBlock, saveBattlesToSupabase, Battle } from './utils/battle-processor.ts';
import { hasNextPage } from './utils/html-parser.ts';

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
  
  console.log(`Fetching page ${page} from ${pageUrl}`);
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
};

const extractBattles = (html: string): Battle[] => {
  const battles: Battle[] = [];
  const battleBlocks = html.split('class="ui attached segment');
  console.log(`Found ${battleBlocks.length - 1} potential battle blocks`);
  
  battleBlocks.slice(1).forEach((block, index) => {
    try {
      console.log(`Processing battle block ${index + 1} (length: ${block.length})`);
      const battle = processBattleBlock(block, index);
      if (battle) {
        battles.push(battle);
        console.log(`Successfully extracted battle ${battle.battle_id}`);
      } else {
        console.log(`Skipping battle ${index + 1} due to missing required data`);
      }
    } catch (error) {
      console.error(`Error processing battle block ${index + 1}:`, error);
    }
  });

  console.log(`Successfully extracted ${battles.length} battles`);
  return battles;
};

const scrapeAllPages = async (baseUrl: string) => {
  let page = 1;
  let totalBattles = 0;
  let hasMore = true;

  while (hasMore) {
    console.log(`Scraping page ${page}`);
    try {
      const html = await fetchWithProxy(baseUrl, page);
      console.log(`Received HTML response for page ${page} (length: ${html.length})`);
      
      const battles = extractBattles(html);
      console.log(`Extracted ${battles.length} battles from page ${page}`);
      
      if (battles.length > 0) {
        await saveBattlesToSupabase(battles);
        totalBattles += battles.length;
        console.log(`Saved ${battles.length} battles from page ${page}`);
      }

      hasMore = hasNextPage(html) && battles.length > 0;
      if (hasMore) {
        page++;
        console.log(`Moving to page ${page}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('No more pages to scrape');
      }
    } catch (error) {
      console.error(`Error scraping page ${page}:`, error);
      hasMore = false;
    }
  }

  return totalBattles;
};

Deno.serve(async (req) => {
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