export const extractBattleId = (block: string): string | null => {
  const idMatch = block.match(/battle_(\d+\.\d+)/);
  return idMatch ? idMatch[1] : null;
};

export const extractBattleType = (block: string): string => {
  const typeMatch = block.match(/game_mode_header.*?>([^<]+)</);
  return typeMatch ? typeMatch[1].trim() : 'Unknown';
};

export const extractBattleTime = (block: string): string => {
  const timeMatch = block.match(/data-timestamp="(\d+\.\d+)"/);
  return timeMatch 
    ? new Date(parseFloat(timeMatch[1]) * 1000).toISOString()
    : new Date().toISOString();
};

export const extractPlayerData = (block: string): { 
  player1Name: string | null;
  player2Name: string | null;
  player1Clan: string | null;
  player2Clan: string | null;
  player1Crowns: number | null;
  player2Crowns: number | null;
} => {
  // Extract player names using more specific selectors
  const playerMatches = block.match(/<div class="player_name_header[^>]*>.*?<a[^>]*>([^<]+)<\/a>/g);
  const player1Name = playerMatches?.[0]?.match(/>([^<]+)</)?.[1]?.trim() || null;
  const player2Name = playerMatches?.[1]?.match(/>([^<]+)</)?.[1]?.trim() || null;

  // Extract clan names
  const clanMatches = block.match(/<div class="battle_player_clan[^>]*>([^<]+)<\/div>/g);
  const player1Clan = clanMatches?.[0]?.match(/>([^<]+)</)?.[1]?.trim() || null;
  const player2Clan = clanMatches?.[1]?.match(/>([^<]+)</)?.[1]?.trim() || null;

  // Extract crowns using a more specific pattern
  const crownMatches = block.match(/<div class="result_header[^>]*>.*?(\d+)\s*-\s*(\d+)/s);
  const player1Crowns = crownMatches ? parseInt(crownMatches[1]) : null;
  const player2Crowns = crownMatches ? parseInt(crownMatches[2]) : null;

  console.log('Extracted player data:', {
    player1Name,
    player2Name,
    player1Clan,
    player2Clan,
    player1Crowns,
    player2Crowns
  });

  return {
    player1Name,
    player2Name,
    player1Clan,
    player2Clan,
    player1Crowns,
    player2Crowns
  };
};

export const hasNextPage = (html: string): boolean => {
  return html.includes('class="item next"') || html.includes('class="next page"');
};