import { Battle, Player } from "@/types/player";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface BattleHistoryProps {
  battles: Battle[];
  player1: Player;
  player2: Player;
}

export const BattleHistory = ({ battles, player1, player2 }: BattleHistoryProps) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Battle History</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>{player1.name} Crowns</TableHead>
            <TableHead>{player2.name} Crowns</TableHead>
            <TableHead>Winner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {battles.map((battle) => {
            const isPlayer1First = battle.player1_id === player1.id;
            const player1Crowns = isPlayer1First ? battle.player1_crowns : battle.player2_crowns;
            const player2Crowns = isPlayer1First ? battle.player2_crowns : battle.player1_crowns;
            
            return (
              <TableRow key={battle.battle_id}>
                <TableCell>{new Date(battle.battle_time).toLocaleDateString()}</TableCell>
                <TableCell>{battle.type}</TableCell>
                <TableCell>{player1Crowns}</TableCell>
                <TableCell>{player2Crowns}</TableCell>
                <TableCell>
                  {player1Crowns > player2Crowns ? player1.name :
                   player2Crowns > player1Crowns ? player2.name :
                   "Tie"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};