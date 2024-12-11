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
  // Updated selectors for better player data extraction
  const namePattern = /<div[^>]*class="[^"]*player_name_header[^"]*"[^>]*>.*?<a[^>]*>([^<]+)<\/a>/gs;
  const names = [...block.matchAll(namePattern)].map(match => match[1].trim());
  
  const clanPattern = /<div[^>]*class="[^"]*battle_player_clan[^"]*"[^>]*>([^<]+)<\/div>/gs;
  const clans = [...block.matchAll(clanPattern)].map(match => match[1].trim());
  
  // Updated crown pattern to be more specific
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
  // More specific checks for pagination
  const nextPageIndicators = [
    'class="item next"',
    'class="next page"',
    'class="pagination".*?Next',
    'class="[^"]*pagination[^"]*".*?\\bnext\\b'
  ];
  
  return nextPageIndicators.some(indicator => 
    new RegExp(indicator, 'i').test(html)
  );
};

export const isValidBattlePage = (html: string): boolean => {
  // Enhanced validation checks
  const requiredElements = {
    battleSegments: html.includes('ui attached segment'),
    playerNames: html.includes('player_name_header'),
    battleResults: html.includes('result_header'),
    battleContent: html.includes('battle_') && html.includes('crowns'),
  };
  
  // Check for blocking elements
  const blockingElements = {
    gdprOverlay: html.includes('gdpr-overlay'),
    cookieConsent: html.includes('cookie-consent'),
    adOverlay: html.includes('ad-overlay') || html.includes('advertisement'),
    maintenanceMode: html.includes('maintenance-mode'),
  };
  
  // Log detailed validation results
  console.log('Page validation results:', {
    requiredElements,
    blockingElements,
    htmlLength: html.length,
  });
  
  // Page is valid if it has required elements and no blocking elements
  const hasRequiredElements = Object.values(requiredElements).some(v => v);
  const hasBlockingElements = Object.values(blockingElements).some(v => v);
  
  return hasRequiredElements && !hasBlockingElements;
};