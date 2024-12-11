import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player, Battle, PlayerStats } from "@/types/player";
import { PlayerSearch } from "./PlayerSearch";
import { PlayerStatsDisplay } from "./PlayerStats";
import { BattleHistory } from "./BattleHistory";

const PlayerComparison = () => {
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

  // Query players for search with proper error handling
  const { data: players = [] } = useQuery({
    queryKey: ["players", player1Search, player2Search],
    queryFn: async () => {
      if (!player1Search && !player2Search) return [];
      
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .or(`name.ilike.%${player1Search}%,name.ilike.%${player2Search}%`)
        .order("name");
      
      if (error) {
        console.error("Error fetching players:", error);
        return [];
      }
      return data || [];
    },
  });

  // Query battles between selected players with proper error handling
  const { data: battles = [] } = useQuery({
    queryKey: ["battles", selectedPlayer1?.id, selectedPlayer2?.id],
    queryFn: async () => {
      if (!selectedPlayer1?.id || !selectedPlayer2?.id) return [];
      const { data, error } = await supabase
        .from("battles")
        .select("*")
        .or(`and(player1_id.eq.${selectedPlayer1.id},player2_id.eq.${selectedPlayer2.id}),and(player1_id.eq.${selectedPlayer2.id},player2_id.eq.${selectedPlayer1.id})`)
        .order("battle_time", { ascending: false });
      
      if (error) {
        console.error("Error fetching battles:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedPlayer1?.id && !!selectedPlayer2?.id,
  });

  const calculatePlayerStats = (playerId: string): PlayerStats => {
    if (!battles) return { wins: 0, losses: 0, ties: 0, totalCrowns: 0 };
    
    return battles.reduce((stats, battle) => {
      const isPlayer1 = battle.player1_id === playerId;
      const playerCrowns = isPlayer1 ? battle.player1_crowns : battle.player2_crowns;
      const opponentCrowns = isPlayer1 ? battle.player2_crowns : battle.player1_crowns;
      
      return {
        wins: stats.wins + (playerCrowns > opponentCrowns ? 1 : 0),
        losses: stats.losses + (playerCrowns < opponentCrowns ? 1 : 0),
        ties: stats.ties + (playerCrowns === opponentCrowns ? 1 : 0),
        totalCrowns: stats.totalCrowns + playerCrowns,
      };
    }, { wins: 0, losses: 0, ties: 0, totalCrowns: 0 });
  };

  const player1Stats = selectedPlayer1 ? calculatePlayerStats(selectedPlayer1.id) : null;
  const player2Stats = selectedPlayer2 ? calculatePlayerStats(selectedPlayer2.id) : null;

  const getWinner = () => {
    if (!player1Stats || !player2Stats) return null;
    if (player1Stats.wins > player2Stats.wins) return 1;
    if (player2Stats.wins > player1Stats.wins) return 2;
    return 0; // tie
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid grid-cols-2 gap-8">
        <PlayerSearch
          searchTerm={player1Search}
          onSearchChange={setPlayer1Search}
          players={players}
          selectedPlayer={selectedPlayer1}
          onPlayerSelect={setSelectedPlayer1}
          label="Player 1"
        />
        <PlayerSearch
          searchTerm={player2Search}
          onSearchChange={setPlayer2Search}
          players={players}
          selectedPlayer={selectedPlayer2}
          onPlayerSelect={setSelectedPlayer2}
          label="Player 2"
        />
      </div>

      {selectedPlayer1 && selectedPlayer2 && (
        <>
          <div className="grid grid-cols-2 gap-8">
            {player1Stats && (
              <PlayerStatsDisplay
                player={selectedPlayer1}
                stats={player1Stats}
                isWinner={getWinner() === 1}
              />
            )}
            {player2Stats && (
              <PlayerStatsDisplay
                player={selectedPlayer2}
                stats={player2Stats}
                isWinner={getWinner() === 2}
              />
            )}
          </div>

          {battles && battles.length > 0 && (
            <BattleHistory
              battles={battles}
              player1={selectedPlayer1}
              player2={selectedPlayer2}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PlayerComparison;