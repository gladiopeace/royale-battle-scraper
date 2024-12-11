import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { extractBattleId, extractBattleTime, extractBattleType, extractPlayerData } from './html-parser.ts';

export interface Battle {
  battle_id: string;
  battle_time: string;
  type: string;
  player1_name: string;
  player2_name: string;
  player1_crowns: number;
  player2_crowns: number;
  is_friendly_battle: boolean;
  player1_clan: string | null;
  player2_clan: string | null;
}

export const processBattleBlock = (block: string, index: number): Battle | null => {
  console.log(`Processing battle block ${index + 1}`);

  const battleId = extractBattleId(block);
  if (!battleId) {
    console.log(`No battle ID found for block ${index + 1}`);
    return null;
  }

  const playerData = extractPlayerData(block);
  
  // Log detailed information about the extracted data
  console.log(`Battle ${battleId} extracted data:`, {
    battleId,
    playerData,
    blockLength: block.length,
    hasPlayerNames: Boolean(playerData.player1Name && playerData.player2Name),
    hasCrowns: Boolean(playerData.player1Crowns !== null && playerData.player2Crowns !== null)
  });

  // Validate all required fields
  if (!playerData.player1Name || !playerData.player2Name) {
    console.log(`Missing player names for battle ${battleId}`);
    return null;
  }

  if (playerData.player1Crowns === null || playerData.player2Crowns === null) {
    console.log(`Missing crown data for battle ${battleId}`);
    return null;
  }

  const battle: Battle = {
    battle_id: battleId,
    battle_time: extractBattleTime(block),
    type: extractBattleType(block),
    player1_name: playerData.player1Name,
    player2_name: playerData.player2Name,
    player1_crowns: playerData.player1Crowns,
    player2_crowns: playerData.player2Crowns,
    is_friendly_battle: block.includes('battle_icon_centered_v3__is_clan_friendly'),
    player1_clan: playerData.player1Clan,
    player2_clan: playerData.player2Clan
  };

  console.log(`Successfully processed battle ${battleId}:`, battle);
  return battle;
};

export const saveBattlesToSupabase = async (battles: Battle[]) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Processing ${battles.length} battles`);

  for (const battle of battles) {
    try {
      const { player1_name, player2_name, player1_clan, player2_clan, ...battleData } = battle;

      // Upsert player 1
      const { data: player1, error: player1Error } = await supabase
        .from('players')
        .upsert({ 
          id: player1_name, 
          name: player1_name,
          clan_name: player1_clan
        })
        .select()
        .single();

      if (player1Error) {
        console.error('Error upserting player 1:', player1Error);
        continue;
      }

      // Upsert player 2
      const { data: player2, error: player2Error } = await supabase
        .from('players')
        .upsert({ 
          id: player2_name, 
          name: player2_name,
          clan_name: player2_clan
        })
        .select()
        .single();

      if (player2Error) {
        console.error('Error upserting player 2:', player2Error);
        continue;
      }

      if (player1 && player2) {
        const { error: battleError } = await supabase
          .from('battles')
          .upsert({
            ...battleData,
            player1_id: player1.id,
            player2_id: player2.id,
          });

        if (battleError) {
          console.error('Error inserting battle:', battleError);
        } else {
          console.log(`Successfully saved battle ${battle.battle_id}`);
        }
      }
    } catch (error) {
      console.error('Error processing battle:', error);
    }
  }

  // Update player statistics
  const { error: updateError } = await supabase.rpc('update_player_stats');
  if (updateError) {
    console.error('Error updating player stats:', updateError);
  } else {
    console.log('Successfully updated player stats');
  }
};