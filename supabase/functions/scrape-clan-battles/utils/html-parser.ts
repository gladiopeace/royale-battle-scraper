export const extractBattleId = (block: string): string | null => {
  console.log('Attempting to extract battle ID from block');
  const idMatch = block.match(/battle_(\d+\.\d+)/);
  if (!idMatch) {
    console.log('No battle ID found in block');
    return null;
  }
  console.log('Found battle ID:', idMatch[1]);
  return idMatch[1];
};

export const extractBattleType = (block: string): string => {
  console.log('Extracting battle type');
  const typeMatch = block.match(/game_mode_header.*?>([^<]+)</);
  const type = typeMatch ? typeMatch[1].trim() : 'Unknown';
  console.log('Battle type:', type);
  return type;
};

export const extractBattleTime = (block: string): string => {
  console.log('Extracting battle time');
  const timeMatch = block.match(/data-timestamp="(\d+\.\d+)"/);
  const timestamp = timeMatch 
    ? new Date(parseFloat(timeMatch[1]) * 1000).toISOString()
    : new Date().toISOString();
  console.log('Battle time:', timestamp);
  return timestamp;
};

export const extractPlayerData = (block: string) => {
  console.log('Extracting player data from block');
  console.log('Block length:', block.length);
  
  // More specific selectors for player names
  const namePattern = /<div class="player_name_header[^>]*>.*?<a[^>]*>([^<]+)<\/a>/g;
  const names = [...block.matchAll(namePattern)].map(match => match[1].trim());
  
  // More specific selectors for clan names
  const clanPattern = /<div class="battle_player_clan[^>]*>([^<]+)<\/div>/g;
  const clans = [...block.matchAll(clanPattern)].map(match => match[1].trim());
  
  // More specific crown pattern
  const crownMatch = block.match(/<div class="result_header[^>]*>.*?(\d+)\s*-\s*(\d+)/s);

  console.log('Extracted data:', {
    names,
    clans,
    crownMatch
  });

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
  const hasNext = html.includes('class="item next"') || html.includes('class="next page"');
  console.log('Has next page:', hasNext);
  return hasNext;
};

export const isValidBattlePage = (html: string): boolean => {
  // Check if the page contains the expected battle content
  const hasBattleContent = html.includes('ui attached segment') && 
                          html.includes('player_name_header');
  
  // Check for common ad/overlay indicators
  const hasOverlay = html.includes('gdpr-overlay') || 
                    html.includes('cookie-consent') ||
                    html.includes('advertisement');
                    
  console.log('Page validation:', {
    hasBattleContent,
    hasOverlay,
    htmlLength: html.length
  });
  
  return hasBattleContent && !hasOverlay;
};