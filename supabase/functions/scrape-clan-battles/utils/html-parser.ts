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
  // More specific selectors for player names
  const namePattern = /<div[^>]*class="[^"]*player_name_header[^"]*"[^>]*>(?:.*?<a[^>]*>([^<]+)<\/a>|([^<]+))<\/div>/gs;
  const names = [...block.matchAll(namePattern)]
    .map(match => (match[1] || match[2])?.trim())
    .filter(Boolean);
  
  const clanPattern = /<div[^>]*class="[^"]*battle_player_clan[^"]*"[^>]*>([^<]+)<\/div>/gs;
  const clans = [...block.matchAll(clanPattern)]
    .map(match => match[1].trim())
    .filter(Boolean);
  
  // More specific crown pattern
  const crownPattern = /<div[^>]*class="[^"]*result_header[^"]*"[^>]*>.*?(\d+)\s*-\s*(\d+)/s;
  const crownMatch = block.match(crownPattern);

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
  const indicators = [
    'class="item next"',
    'class="next page"',
    'class="pagination"',
    '>Next<',
    'data-page="next"'
  ];
  
  return indicators.some(indicator => html.includes(indicator));
};

export const isValidBattlePage = (html: string): boolean => {
  // Check for essential content indicators
  const contentIndicators = [
    'battle_',
    'player_name_header',
    'result_header',
    'ui attached segment'
  ];
  
  const hasContent = contentIndicators.every(indicator => html.includes(indicator));
                    
  // Check for blocking elements
  const blockingIndicators = [
    'gdpr-overlay',
    'cookie-consent',
    'ad-overlay',
    'loading-overlay'
  ];
                     
  const hasBlockers = blockingIndicators.some(blocker => html.includes(blocker));
  
  const contentLength = html.length;
  
  console.log('Page validation:', {
    hasContent,
    hasBlockers,
    contentLength,
    contentIndicatorsPresent: contentIndicators.filter(i => html.includes(i)),
    blockersPresent: blockingIndicators.filter(b => html.includes(b))
  });

  return hasContent && !hasBlockers && contentLength > 1000;
};