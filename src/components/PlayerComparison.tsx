import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/player";
import { PlayerSearch } from "./PlayerSearch";
import { BattleHistory } from "./BattleHistory";
import { PlayerStats } from "./PlayerStats";

const PlayerComparison = () => {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: battles = [] } = useQuery({
    queryKey: ["battles", player1?.id, player2?.id],
    queryFn: async () => {
      if (!player1?.id || !player2?.id) return [];

      const { data, error } = await supabase
        .from("battles")
        .select("*")
        .or(`and(player1_id.eq.${player1.id},player2_id.eq.${player2.id}),and(player1_id.eq.${player2.id},player2_id.eq.${player1.id})`)
        .order("battle_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!player1?.id && !!player2?.id,
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PlayerSearch
          players={players}
          selectedPlayer={player1}
          onPlayerSelect={setPlayer1}
          label="Player 1"
          searchTerm=""
          onSearchChange={() => {}}
        />
        <PlayerSearch
          players={players}
          selectedPlayer={player2}
          onPlayerSelect={setPlayer2}
          label="Player 2"
          searchTerm=""
          onSearchChange={() => {}}
        />
      </div>

      {player1 && player2 && (
        <>
          <PlayerStats player1={player1} player2={player2} battles={battles} />
          <BattleHistory battles={battles} player1={player1} player2={player2} />
        </>
      )}
    </div>
  );
};

export default PlayerComparison;