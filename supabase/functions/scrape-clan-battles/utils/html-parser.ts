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
  const player1NameMatch = block.match(/player_name_header.*?>([^<]+)</);
  const player2NameMatch = block.match(/player_name_header.*?>([^<]+)<\/a>[^<]*<\/div>[^<]*<div[^>]*>[^<]*<a[^>]*>([^<]+)</);
  const crownMatches = block.match(/result_header.*?>.*?(\d+)\s*-\s*(\d+)/s);
  const clanMatches = block.match(/battle_player_clan.*?>([^<]+)</g);

  return {
    player1Name: player1NameMatch ? player1NameMatch[1].trim() : null,
    player2Name: player2NameMatch ? player2NameMatch[2].trim() : null,
    player1Clan: clanMatches ? clanMatches[0].match(/>([^<]+)</)?.[1].trim() : null,
    player2Clan: clanMatches && clanMatches[1] ? clanMatches[1].match(/>([^<]+)</)?.[1].trim() : null,
    player1Crowns: crownMatches ? parseInt(crownMatches[1]) : null,
    player2Crowns: crownMatches ? parseInt(crownMatches[2]) : null
  };
};

export const hasNextPage = (html: string): boolean => {
  return html.includes('class="item next"') || html.includes('class="next page"');
};