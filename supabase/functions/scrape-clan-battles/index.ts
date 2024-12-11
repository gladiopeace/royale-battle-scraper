// Import required utilities
import { processBattleBlock, saveBattlesToSupabase, Battle } from './utils/battle-processor.ts';
import { hasNextPage, isValidBattlePage } from './utils/html-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const url = 'https://royaleapi.com/clan/L8VLU0P8/battles';
    console.log('Starting battle scraping from:', url);
    
    const apiKey = Deno.env.get('SCRAPEOPS_API_KEY');
    if (!apiKey) {
      throw new Error('SCRAPEOPS_API_KEY is not set');
    }

    // Initial page fetch with extended timeout
    console.log('Waiting for initial page load (3 minutes)...');
    await new Promise(resolve => setTimeout(resolve, 180000)); // 3 minutes wait

    const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=1&wait_for=.player_name_header,.result_header&wait_for_timeout=180000`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Received HTML response (length: ${html.length})`);

    if (!isValidBattlePage(html)) {
      throw new Error('Invalid page content received');
    }

    // Process battles from the page
    const battles = html.split('class="ui attached segment')
      .slice(1)
      .map((block, index) => {
        try {
          return processBattleBlock(block, index);
        } catch (error) {
          console.error(`Error processing battle block ${index}:`, error);
          return null;
        }
      })
      .filter((battle): battle is Battle => battle !== null);

    console.log(`Extracted ${battles.length} battles`);

    if (battles.length > 0) {
      await saveBattlesToSupabase(battles);
      console.log(`Successfully saved ${battles.length} battles`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        battlesProcessed: battles.length 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});