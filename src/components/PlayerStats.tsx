import { Player, Battle } from "@/types/player";
import { Crown } from "lucide-react";

interface PlayerStatsDisplayProps {
  player: Player;
  stats: {
    wins: number;
    losses: number;
    ties: number;
    totalCrowns: number;
  };
  isWinner: boolean;
}

const PlayerStatsDisplay = ({ player, stats, isWinner }: PlayerStatsDisplayProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold flex items-center gap-2">
        {player.playerName}
        {isWinner && <Crown className="h-6 w-6 text-yellow-500 animate-bounce" />}
      </h3>
      <div className="space-y-2">
        <p>Wins: {stats.wins}</p>
        <p>Losses: {stats.losses}</p>
        <p>Ties: {stats.ties}</p>
        <p>Total Crowns: {stats.totalCrowns}</p>
      </div>
    </div>
  );
};

interface PlayerStatsProps {
  player1: Player;
  player2: Player;
  battles: Battle[];
}

export const PlayerStats = ({ player1, player2, battles }: PlayerStatsProps) => {
  const calculateStats = (playerId: string) => {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let totalCrowns = 0;

    battles.forEach((battle) => {
      const isPlayer1 = battle.player1_id === playerId;
      const playerCrowns = isPlayer1 ? battle.player1_crowns : battle.player2_crowns;
      const opponentCrowns = isPlayer1 ? battle.player2_crowns : battle.player1_crowns;

      totalCrowns += playerCrowns;

      if (playerCrowns > opponentCrowns) wins++;
      else if (playerCrowns < opponentCrowns) losses++;
      else ties++;
    });

    return { wins, losses, ties, totalCrowns };
  };

  const player1Stats = calculateStats(player1.playerId);
  const player2Stats = calculateStats(player2.playerId);
  const player1WinRate = player1Stats.wins > player2Stats.wins;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-card rounded-lg shadow-lg">
      <PlayerStatsDisplay 
        player={player1} 
        stats={player1Stats} 
        isWinner={player1WinRate} 
      />
      <PlayerStatsDisplay 
        player={player2} 
        stats={player2Stats} 
        isWinner={!player1WinRate} 
      />
    </div>
  );
};