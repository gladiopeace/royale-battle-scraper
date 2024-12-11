import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Crown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  total_battles: number;
  total_crowns: number;
}

interface Battle {
  battle_id: string;
  battle_time: string;
  type: string;
  player1_crowns: number;
  player2_crowns: number;
}

interface PlayerStats {
  wins: number;
  losses: number;
  ties: number;
  totalCrowns: number;
}

const PlayerComparison = () => {
  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [selectedPlayer1, setSelectedPlayer1] = useState<Player | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<Player | null>(null);

  // Query players for search
  const { data: players } = useQuery({
    queryKey: ["players", player1Search, player2Search],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .or(`name.ilike.%${player1Search}%,name.ilike.%${player2Search}%`)
        .order("name");
      return data as Player[];
    },
  });

  // Query battles between selected players
  const { data: battles } = useQuery({
    queryKey: ["battles", selectedPlayer1?.id, selectedPlayer2?.id],
    queryFn: async () => {
      if (!selectedPlayer1?.id || !selectedPlayer2?.id) return null;
      const { data } = await supabase
        .from("battles")
        .select("*")
        .or(`and(player1_id.eq.${selectedPlayer1.id},player2_id.eq.${selectedPlayer2.id}),and(player1_id.eq.${selectedPlayer2.id},player2_id.eq.${selectedPlayer1.id})`)
        .order("battle_time", { ascending: false });
      return data as Battle[];
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
        {/* Player 1 Selection */}
        <div className="space-y-4">
          <Input
            placeholder="Search Player 1..."
            value={player1Search}
            onChange={(e) => setPlayer1Search(e.target.value)}
          />
          {players?.filter(p => p.name.toLowerCase().includes(player1Search.toLowerCase()))
            .map((player) => (
              <div
                key={player.id}
                className={`p-2 cursor-pointer rounded ${
                  selectedPlayer1?.id === player.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedPlayer1(player)}
              >
                {player.name}
              </div>
            ))}
        </div>

        {/* Player 2 Selection */}
        <div className="space-y-4">
          <Input
            placeholder="Search Player 2..."
            value={player2Search}
            onChange={(e) => setPlayer2Search(e.target.value)}
          />
          {players?.filter(p => p.name.toLowerCase().includes(player2Search.toLowerCase()))
            .map((player) => (
              <div
                key={player.id}
                className={`p-2 cursor-pointer rounded ${
                  selectedPlayer2?.id === player.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedPlayer2(player)}
              >
                {player.name}
              </div>
            ))}
        </div>
      </div>

      {/* Stats Display */}
      {selectedPlayer1 && selectedPlayer2 && (
        <div className="grid grid-cols-2 gap-8">
          {/* Player 1 Stats */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {selectedPlayer1.name}
              {getWinner() === 1 && (
                <Crown className="h-6 w-6 text-yellow-500 animate-bounce" />
              )}
            </h3>
            {player1Stats && (
              <div className="space-y-2">
                <p>Wins: {player1Stats.wins}</p>
                <p>Losses: {player1Stats.losses}</p>
                <p>Ties: {player1Stats.ties}</p>
                <p>Total Crowns: {player1Stats.totalCrowns}</p>
              </div>
            )}
          </div>

          {/* Player 2 Stats */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {selectedPlayer2.name}
              {getWinner() === 2 && (
                <Crown className="h-6 w-6 text-yellow-500 animate-bounce" />
              )}
            </h3>
            {player2Stats && (
              <div className="space-y-2">
                <p>Wins: {player2Stats.wins}</p>
                <p>Losses: {player2Stats.losses}</p>
                <p>Ties: {player2Stats.ties}</p>
                <p>Total Crowns: {player2Stats.totalCrowns}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battle History */}
      {battles && battles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Battle History</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>{selectedPlayer1?.name} Crowns</TableHead>
                <TableHead>{selectedPlayer2?.name} Crowns</TableHead>
                <TableHead>Winner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {battles.map((battle) => {
                const isPlayer1First = battle.player1_id === selectedPlayer1?.id;
                const player1Crowns = isPlayer1First ? battle.player1_crowns : battle.player2_crowns;
                const player2Crowns = isPlayer1First ? battle.player2_crowns : battle.player1_crowns;
                
                return (
                  <TableRow key={battle.battle_id}>
                    <TableCell>{new Date(battle.battle_time).toLocaleDateString()}</TableCell>
                    <TableCell>{battle.type}</TableCell>
                    <TableCell>{player1Crowns}</TableCell>
                    <TableCell>{player2Crowns}</TableCell>
                    <TableCell>
                      {player1Crowns > player2Crowns ? selectedPlayer1?.name :
                       player2Crowns > player1Crowns ? selectedPlayer2?.name :
                       "Tie"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PlayerComparison;