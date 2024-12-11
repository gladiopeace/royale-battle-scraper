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
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedPlayer ? selectedPlayer.name : `Select ${label}...`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onValueChange={onSearchChange}
            />
            <CommandEmpty>No player found.</CommandEmpty>
            <CommandGroup>
              {players?.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.name}
                  onSelect={() => {
                    onPlayerSelect(player);
                    setOpen(false);
                  }}
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