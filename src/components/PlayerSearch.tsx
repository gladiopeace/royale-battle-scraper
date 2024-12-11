import { Player } from "@/types/player";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlayerSearchProps {
  players: Player[];
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player) => void;
  label: string;
}

export const PlayerSearch = ({
  players = [],
  selectedPlayer,
  onPlayerSelect,
  label,
}: PlayerSearchProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Select
        value={selectedPlayer?.id || ""}
        onValueChange={(value) => {
          const player = players.find((p) => p.id === value);
          if (player) onPlayerSelect(player);
        }}
      >
        <SelectTrigger className="w-full bg-secondary/50 border-muted hover:bg-secondary/80 transition-colors">
          <SelectValue placeholder={`Select ${label}...`} />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem
              key={player.id}
              value={player.id}
              className="cursor-pointer hover:bg-primary/20"
            >
              <div className="flex items-center">
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {player.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};