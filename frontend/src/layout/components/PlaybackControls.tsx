"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { 
  Laptop2, 
  ListMusic, 
  Mic2, 
  Pause, 
  Play, 
  Repeat, 
  Shuffle, 
  SkipBack, 
  SkipForward, 
  Volume1, 
  Volume2 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
  const { currentSong, isPlaying, togglePlay, playNext, playPrevious } = usePlayerStore();

  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentDevice, setCurrentDevice] = useState("SociTune Web Player");
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Device Detection
  useEffect(() => {
    const getAudioDevice = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        const defaultDevice = audioOutputs.find(d => d.deviceId === 'default') || audioOutputs[0];

        if (defaultDevice?.label) {
          setCurrentDevice(defaultDevice.label.length > 25 
            ? defaultDevice.label.slice(0, 22) + "..." 
            : defaultDevice.label);
        }
      } catch (error) {
        console.error("Error getting audio devices", error);
      }
    };

    getAudioDevice();
    navigator.mediaDevices?.addEventListener('devicechange', getAudioDevice);

    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', getAudioDevice);
    };
  }, []);

  // Audio Sync
  useEffect(() => {
    audioRef.current = document.querySelector("audio");
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => {
      usePlayerStore.setState({ isPlaying: false });
    });

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [currentSong]);

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  return (
    <footer className="h-20 sm:h-24 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-3 sm:px-6 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full max-w-screen-2xl mx-auto gap-2">
        
        {/* Song Info - Left */}
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-[1.2] lg:flex-1">
          {currentSong ? (
            <div className="flex items-center gap-3">
              <div className="relative group">
                <img
                  src={currentSong.imageUrl}
                  alt={currentSong.title}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg shadow-lg ring-1 ring-zinc-700 transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-[10px] text-white font-mono tracking-widest">NOW</div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-white text-sm sm:text-base truncate hover:underline cursor-pointer">
                  {currentSong.title}
                </p>
                <p className="text-zinc-400 text-xs sm:text-sm truncate hover:underline cursor-pointer">
                  {currentSong.artist}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm italic">No song playing</div>
          )}
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center flex-1 max-w-[420px] gap-1.5">
          {/* Main Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 text-zinc-400 hover:text-white transition-colors ${isShuffle ? 'text-violet-400' : ''}`}
                    onClick={() => setIsShuffle(!isShuffle)}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Shuffle</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={playPrevious}
              disabled={!currentSong}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="bg-white hover:bg-white/90 text-black rounded-full h-10 w-10 shadow-xl shadow-black/50 transition-all active:scale-95"
              onClick={togglePlay}
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={playNext}
              disabled={!currentSong}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-8 w-8 text-zinc-400 hover:text-white transition-colors ${repeatMode !== 'off' ? 'text-emerald-400' : ''}`}
                    onClick={() => {
                      if (repeatMode === 'off') setRepeatMode('all');
                      else if (repeatMode === 'all') setRepeatMode('one');
                      else setRepeatMode('off');
                    }}
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {repeatMode === 'off' ? 'Repeat' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Progress Bar */}
          <div className="hidden sm:flex items-center gap-2 w-full px-1">
            <span className="text-[10px] text-zinc-500 tabular-nums w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              className="flex-1 cursor-pointer"
              onValueChange={handleSeek}
            />
            
            <span className="text-[10px] text-zinc-500 tabular-nums w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Side - Extras & Volume */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <Mic2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lyrics</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <ListMusic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Queue</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Device */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-zinc-400 hover:text-white hidden md:flex"
                >
                  <Laptop2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">Connected to</p>
                <p className="text-emerald-400 flex items-center gap-1.5">
                  <Laptop2 className="h-3 w-3" /> {currentDevice}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Volume */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={() => {
                const newVol = volume === 0 ? 75 : 0;
                setVolume(newVol);
                if (audioRef.current) audioRef.current.volume = newVol / 100;
              }}
            >
              {volume === 0 ? <Volume1 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24 sm:w-28 cursor-pointer"
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};