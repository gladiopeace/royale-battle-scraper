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

    // Set up the proxy URL with specific wait-for selectors
    const proxyUrl = `https://proxy.scrapeops.io/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=1&wait_for=.player_name_header,.result_header`;
    
    // Function to check if page has loaded
    const checkPageLoad = async (maxAttempts = 36): Promise<string> => { // 36 attempts * 5 seconds = 3 minutes max
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`Attempt ${attempt + 1} of ${maxAttempts} to fetch page...`);
        
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          console.log(`Attempt ${attempt + 1}: Response not OK (${response.status})`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between attempts
          continue;
        }

        const html = await response.text();
        if (isValidBattlePage(html)) {
          console.log('Valid page content found!');
          return html;
        }

        console.log(`Attempt ${attempt + 1}: Page not yet valid, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      throw new Error('Failed to load valid page content after maximum attempts');
    };

    // Get the page content
    const html = await checkPageLoad();
    console.log(`Received valid HTML response (length: ${html.length})`);

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