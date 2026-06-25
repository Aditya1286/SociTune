import { useState } from "react";
import type { Song } from "@/types";
import { useNavigate } from "react-router-dom";
import SectionGridSkeleton from "@/components/skeletons/SectionGridSkeleton";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Pause } from "lucide-react";

type SectionGridProps = {
  title: string;        
  songs: Song[];
  isLoading: boolean;
};

const SectionGrid = ({ title, songs, isLoading }: SectionGridProps) => {
  const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const renderArtistLinks = (artistString: string) => {
    const names = artistString.split(",").map(n => n.trim());
    return (
      <>
        {names.map((name, i) => (
          <span key={name}>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/artists/${encodeURIComponent(name)}`);
              }}
              className="hover:underline hover:text-white cursor-pointer transition-colors"
            >
              {name}
            </span>
            {i < names.length - 1 && ", "}
          </span>
        ))}
      </>
    );
  };

  if (isLoading) return <SectionGridSkeleton />;

  const handlePlaySong = (song: Song) => {
    const isCurrent = currentSong?._id === song._id;
    if (isCurrent) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }
  };

  const displayedSongs = showAll ? songs : songs.slice(0, 4);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
        {songs.length > 4 && (
          <Button 
            variant="link" 
            className="text-sm text-zinc-400 hover:text-white font-medium"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show Less" : "Show All"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedSongs.map((song) => {
          const isCurrent = currentSong?._id === song._id;
          const isSongPlaying = isCurrent && isPlaying;

          return (
            <div
              key={song._id}
              onClick={() => handlePlaySong(song)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-white/5 shadow-md shadow-black/25">
                <img
                  src={song.imageUrl}
                  alt={song.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Play/Pause Button Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 hover:scale-105">
                    {isSongPlaying ? (
                      <Pause size={20} fill="black" className="text-black" />
                    ) : (
                      <Play size={20} fill="black" className="text-black ml-1" />
                    )}
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-white/90 group-hover:text-white truncate transition-colors text-sm sm:text-base">
                {song.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {renderArtistLinks(song.artist)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionGrid;