import { Player } from "@/types/player";
import { Input } from "@/components/ui/input";

interface PlayerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  players: Player[] | undefined;
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player) => void;
  label: string;
}

export const PlayerSearch = ({
  searchTerm,
  onSearchChange,
  players,
  selectedPlayer,
  onPlayerSelect,
  label,
}: PlayerSearchProps) => {
  return (
    <div className="space-y-4">
      <Input
        placeholder={`Search ${label}...`}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {players?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((player) => (
          <div
            key={player.id}
            className={`p-2 cursor-pointer rounded ${
              selectedPlayer?.id === player.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
            onClick={() => onPlayerSelect(player)}
          >
            {player.name}
          </div>
        ))}
    </div>
  );
};