import { Player, PlayerStats } from "@/types/player";
import { Crown } from "lucide-react";

interface PlayerStatsDisplayProps {
  player: Player;
  stats: PlayerStats;
  isWinner: boolean;
}

export const PlayerStatsDisplay = ({ player, stats, isWinner }: PlayerStatsDisplayProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold flex items-center gap-2">
        {player.name}
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