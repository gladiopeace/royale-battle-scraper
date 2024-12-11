import { processBattleBlock, saveBattlesToSupabase, Battle } from './utils/battle-processor.ts';
import { hasNextPage, isValidBattlePage } from './utils/html-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
};

const fetchWithProxy = async (url: string, page = 1, retries = 3) => {
  const apiKey = Deno.env.get('SCRAPEOPS_API_KEY');
  if (!apiKey) {
    throw new Error('SCRAPEOPS_API_KEY is not set');
  }

  const pageUrl = `${url}${page > 1 ? `?page=${page}` : ''}`;
  const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${apiKey}&url=${encodeURIComponent(pageUrl)}&render_js=1&wait_for=.player_name_header,.result_header&wait_for_timeout=180000`;
  
  console.log(`Fetching page ${page} from ${pageUrl}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Waiting for page load and ad handling...`);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`Received HTML response (length: ${html.length})`);
      
      // Enhanced content validation logging
      const contentIndicators = {
        hasBattleSegments: html.includes('ui attached segment'),
        hasPlayerNames: html.includes('player_name_header'),
        hasResults: html.includes('result_header'),
        hasOverlay: html.includes('gdpr-overlay') || html.includes('cookie-consent'),
        hasPagination: html.includes('pagination'),
        hasNextButton: html.includes('next page') || html.includes('item next'),
        hasAds: html.includes('advertisement') || html.includes('ad-overlay'),
      };
      
      console.log('Content indicators:', contentIndicators);
      
      // Wait additional time if ads or overlays are detected
      if (contentIndicators.hasAds || contentIndicators.hasOverlay) {
        console.log('Detected ads or overlays, extending wait time...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      // Validate the page content
      if (!isValidBattlePage(html)) {
        console.log(`Invalid battle page content on attempt ${attempt}, retrying...`);
        if (attempt === retries) {
          throw new Error('Maximum retries reached for invalid page content');
        }
        await new Promise(resolve => setTimeout(resolve, 10000 * attempt));
        continue;
      }
      
      return html;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 10000 * attempt));
    }
  }
  
  throw new Error(`Failed to fetch page ${page} after ${retries} attempts`);
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
  let consecutiveEmptyPages = 0;
  const maxConsecutiveEmptyPages = 3;
  const maxPages = 10;

  while (hasMore && consecutiveEmptyPages < maxConsecutiveEmptyPages && page <= maxPages) {
    console.log(`Scraping page ${page}`);
    try {
      // Initial wait before fetching each page
      console.log('Waiting for page to fully load (3 minutes)...');
      await new Promise(resolve => setTimeout(resolve, 180000)); // 3 minutes wait
      
      const html = await fetchWithProxy(baseUrl, page);
      console.log(`Successfully fetched page ${page}`);
      
      const battles = extractBattles(html);
      console.log(`Extracted ${battles.length} battles from page ${page}`);
      
      if (battles.length > 0) {
        await saveBattlesToSupabase(battles);
        totalBattles += battles.length;
        consecutiveEmptyPages = 0;
        console.log(`Saved ${battles.length} battles from page ${page}`);
      } else {
        consecutiveEmptyPages++;
        console.log(`No battles found on page ${page}. Empty pages count: ${consecutiveEmptyPages}`);
      }

      const nextPageExists = hasNextPage(html);
      console.log('Next page check:', { nextPageExists, currentPage: page });
      
      hasMore = nextPageExists && 
                consecutiveEmptyPages < maxConsecutiveEmptyPages && 
                page < maxPages;
                
      if (hasMore) {
        page++;
        console.log(`Moving to page ${page}`);
        // Extended delay between pages
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else {
        console.log('Stopping pagination:', {
          hasNextPage: nextPageExists,
          consecutiveEmptyPages,
          currentPage: page,
          reachedMaxPages: page >= maxPages
        });
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