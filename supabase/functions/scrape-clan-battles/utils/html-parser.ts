export const extractBattleId = (block: string): string | null => {
  const idMatch = block.match(/battle_(\d+\.\d+)/);
  return idMatch ? idMatch[1] : null;
};

export const extractBattleTime = (block: string): string => {
  const timeMatch = block.match(/data-timestamp="(\d+\.\d+)"/);
  return timeMatch 
    ? new Date(parseFloat(timeMatch[1]) * 1000).toISOString()
    : new Date().toISOString();
};

export const extractBattleType = (block: string): string => {
  const typeMatch = block.match(/game_mode_header.*?>([^<]+)</);
  return typeMatch ? typeMatch[1].trim() : 'Unknown';
};

export const extractPlayerData = (block: string) => {
  // More specific selectors for player data
  const namePattern = /<div class="player_name_header[^>]*>.*?<a[^>]*>([^<]+)<\/a>/gs;
  const names = [...block.matchAll(namePattern)].map(match => match[1].trim());
  
  const clanPattern = /<div class="battle_player_clan[^>]*>([^<]+)<\/div>/gs;
  const clans = [...block.matchAll(clanPattern)].map(match => match[1].trim());
  
  // More specific crown pattern
  const crownMatch = block.match(/<div class="result_header[^>]*>.*?(\d+)\s*-\s*(\d+)/s);

  return {
    player1Name: names[0] || null,
    player2Name: names[1] || null,
    player1Clan: clans[0] || null,
    player2Clan: clans[1] || null,
    player1Crowns: crownMatch ? parseInt(crownMatch[1]) : null,
    player2Crowns: crownMatch ? parseInt(crownMatch[2]) : null
  };
};

export const hasNextPage = (html: string): boolean => {
  return html.includes('class="item next"') || html.includes('class="next page"');
};

export const isValidBattlePage = (html: string): boolean => {
  // Check for essential battle page elements
  const hasBattleContent = html.includes('ui attached segment') && 
                          html.includes('player_name_header');
  
  // Check for common overlay indicators
  const hasOverlay = html.includes('gdpr-overlay') || 
                    html.includes('cookie-consent') ||
                    html.includes('advertisement');
                    
  // Check for error indicators
  const hasError = html.includes('error-message') ||
                  html.includes('page-not-found') ||
                  html.includes('maintenance');
  
  // Log validation results
  console.log('Page validation:', {
    hasBattleContent,
    hasOverlay,
    hasError,
    htmlLength: html.length,
    containsBattleKeywords: html.includes('battle') && html.includes('crowns'),
    containsPlayerInfo: html.includes('player_name_header')
  });
  
  return hasBattleContent && !hasOverlay && !hasError;
};