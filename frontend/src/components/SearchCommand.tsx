import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentSong } = usePlayerStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    
    // Also listen for a custom event from the Topbar button
    const handleCustomOpen = () => setOpen(true);
    document.addEventListener("open-search", handleCustomOpen);
    
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-search", handleCustomOpen);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/songs/search?q=${query}`);
        setResults(res.data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelectSong = (song: Song) => {
    setCurrentSong(song);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput 
          placeholder="Search for songs or artists..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!isLoading && query && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
            </div>
          )}

          {results.length > 0 && (
            <CommandGroup heading="Songs">
              {results.map((song) => (
                <CommandItem
                  key={song._id}
                  value={song._id}
                  onSelect={() => onSelectSong(song)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img 
                    src={song.imageUrl} 
                    alt={song.title} 
                    className="w-10 h-10 object-cover rounded-md"
                  />
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate">{song.title}</span>
                    <span className="text-xs text-zinc-400 truncate">{song.artist}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
