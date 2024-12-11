export interface Player {
  id: string;
  name: string;
  total_battles: number;
  total_crowns: number;
}

export interface Battle {
  battle_id: string;
  battle_time: string;
  type: string;
  player1_id: string;
  player2_id: string;
  player1_crowns: number;
  player2_crowns: number;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  ties: number;
  totalCrowns: number;
}