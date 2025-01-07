import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Player } from "@/types/player";
import { PlayerSearch } from "./PlayerSearch";
import { BattleHistory } from "./BattleHistory";
import { PlayerStats } from "./PlayerStats";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const API_BASE_URL = "http://148.251.121.187:1880/clash";
const AUTH_TOKEN = "222222";

interface PlayersResponse {
  data: Player[];
}

const fetchPlayers = async (): Promise<Player[]> => {
  const response = await fetch(`${API_BASE_URL}/players`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch players');
  }
  const data: PlayersResponse = await response.json();
  return data.data;
};

const fetchBattles = async (player1Id: string, player2Id: string) => {
  const response = await fetch(`${API_BASE_URL}/battles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      player1: player1Id,
      player2: player2Id,
      type: "clanMate"
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch battles');
  }
  return response.json();
};

const PlayerComparison = () => {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { toast } = useToast();

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
    retry: 1,
    gcTime: 0,
    staleTime: 30000,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching players:", error);
        toast({
          title: "Error",
          description: "Failed to fetch players. Please try again later.",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        console.log("Successfully fetched players");
      }
    }
  });

  const { data: battles = [] } = useQuery({
    queryKey: ["battles", player1?.playerId, player2?.playerId],
    queryFn: () => {
      if (!player1?.playerId || !player2?.playerId) return [];
      return fetchBattles(player1.playerId, player2.playerId);
    },
    enabled: !!player1?.playerId && !!player2?.playerId && showStats,
    retry: 1,
    gcTime: 0,
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching battles:", error);
        toast({
          title: "Error",
          description: "Failed to fetch battles. Please try again later.",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        console.log("Successfully fetched battles");
      }
    }
  });

  const handlePlayerSelect = (player: Player, isPlayer1: boolean) => {
    if (isPlayer1) {
      setPlayer1(player);
    } else {
      setPlayer2(player);
    }
    setShowStats(false);
  };

  const handleCompare = () => {
    setShowStats(true);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PlayerSearch
          players={players}
          selectedPlayer={player1}
          onPlayerSelect={(player) => handlePlayerSelect(player, true)}
          label="Player 1"
        />
        <PlayerSearch
          players={players}
          selectedPlayer={player2}
          onPlayerSelect={(player) => handlePlayerSelect(player, false)}
          label="Player 2"
        />
      </div>

      {player1 && player2 && (
        <div className="flex justify-center">
          <Button 
            onClick={handleCompare}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 text-lg rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Compare Stats
          </Button>
        </div>
      )}

      {showStats && player1 && player2 && (
        <>
          <PlayerStats player1={player1} player2={player2} battles={battles} />
          <BattleHistory battles={battles} player1={player1} player2={player2} />
        </>
      )}
    </div>
  );
};

export default PlayerComparison;