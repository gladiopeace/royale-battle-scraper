import { Player } from "@/types/player";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface PlayerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  players: Player[];
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
  const [open, setOpen] = useState(false);

  // Ensure we always have an array to work with and filter it
  const filteredPlayers = (players || []).filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-secondary/50 border-muted hover:bg-secondary/80 transition-colors"
          >
            {selectedPlayer ? selectedPlayer.name : `Select ${label}...`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command className="border border-muted">
            <CommandInput 
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onValueChange={onSearchChange}
              className="border-muted"
            />
            <CommandEmpty className="text-muted-foreground">No player found.</CommandEmpty>
            <CommandGroup>
              {filteredPlayers.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.name}
                  onSelect={() => {
                    onPlayerSelect(player);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:bg-primary/20"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPlayer?.id === player.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {player.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};