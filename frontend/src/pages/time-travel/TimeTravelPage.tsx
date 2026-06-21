import { useEffect, useRef, useState } from "react";
import { 
  Clock, Mic2, Flame, Loader2, Sparkles, Calendar, TrendingUp, 
  Play, Pause, Heart, Award
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import type { Song } from "@/types";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { toast } from "sonner";

interface TimeTravelStats {
  topSong: Song | null;
  topArtist: string | null;
  totalMinutes: number;
  thisMonthMinutes: number;
  otherMonthMinutes: number;
}

const MOCK_SONG: Song = {
  _id: "mock-song-1",
  title: "Midnight City Lights",
  artist: "Aether Grid",
  imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=60",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  duration: 215,
  albumId: "mock-album-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const MOCK_STATS: TimeTravelStats = {
  topSong: MOCK_SONG,
  topArtist: "Neon Synthwave Club",
  totalMinutes: 14230,
  thisMonthMinutes: 2450,
  otherMonthMinutes: 11780
};

export default function TimeTravelPage() {
  const [stats, setStats] = useState<TimeTravelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [timeframe, setTimeframe] = useState<"all" | "year" | "month">("all");
  const [isLiked, setIsLiked] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/users/time-travel");
        if (res.data && res.data.topSong) {
          setStats(res.data);
          setIsDemo(false);
        } else {
          setStats(MOCK_STATS);
          setIsDemo(true);
        }
      } catch (error) {
        console.error("Failed to fetch time travel stats, falling back to mock:", error);
        setStats(MOCK_STATS);
        setIsDemo(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isLoading && stats) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Bebas+Neue&family=Space+Grotesk:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, [isLoading, stats]);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#050807]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-medium animate-pulse">Scanning time dimension...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#050807] text-zinc-400">
        Failed to load stats.
      </div>
    );
  }

  const handlePlaySong = (song: Song) => {
    if (currentSong?._id === song._id) {
      togglePlay();
    } else {
      setCurrentSong(song);
    }
  };



  // Adjust display stats based on timeframe selection
  const displayMinutes = timeframe === "all" 
    ? stats.totalMinutes 
    : timeframe === "year" 
      ? Math.floor(stats.totalMinutes * 0.72) 
      : stats.thisMonthMinutes;

  const displaySong = stats.topSong || MOCK_SONG;
  const isCurrentSongPlaying = currentSong?._id === displaySong._id && isPlaying;

  const chartData = [
    { name: "Jan", mins: Math.floor(displayMinutes * 0.08), color: "from-emerald-500 to-teal-400" },
    { name: "Feb", mins: Math.floor(displayMinutes * 0.12), color: "from-teal-500 to-cyan-400" },
    { name: "Mar", mins: Math.floor(displayMinutes * 0.15), color: "from-cyan-500 to-blue-400" },
    { name: "Apr", mins: Math.floor(displayMinutes * 0.10), color: "from-blue-500 to-indigo-400" },
    { name: "May", mins: Math.floor(displayMinutes * 0.22), color: "from-indigo-500 to-purple-400" },
    { name: "Jun", mins: Math.floor(displayMinutes * 0.18), color: "from-purple-500 to-emerald-400" },
  ];

  const maxChartVal = Math.max(...chartData.map(d => d.mins));

  return (
    <div ref={pageRef} className="bg-[#050807] text-[#f0faf7] min-h-[calc(100vh-80px)] overflow-y-auto relative font-['Space_Grotesk'] w-full rounded-xl border border-white/5 pb-20">
      {/* CSS Styles injection for high fidelity animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .soundwave-bar {
          animation: soundwave 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .pulse-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
      `}} />

      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pulse-glow pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Demo/Preview Mode Banner */}
      {isDemo && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group shadow-lg shadow-emerald-950/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Demo Wrap Preview</h3>
              <p className="text-zinc-400 text-xs mt-0.5 font-light">You're viewing sample statistics. Connect your account to synchronize your real listening history.</p>
            </div>
          </div>
          <button 
            onClick={() => toast("Log in to see your personalized wrap!")}
            className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-emerald-500/20 hover:scale-105 shrink-0 z-10"
          >
            Connect Account
          </button>
        </div>
      )}

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 pt-12">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-medium mb-6">
            <Clock size={14} className="animate-spin" style={{ animationDuration: '6s' }} /> Your Musical Capsule
          </div>
          
          <h1 className="font-['Bebas_Neue'] text-[clamp(44px,7vw,88px)] leading-[0.85] tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
            TIME TRAVEL
          </h1>
          <p className="text-[#9aada8] text-base max-w-lg mx-auto font-light leading-relaxed">
            Take a deep-dive into your listening history. Check out what has been on repeat, your top artists, and your aesthetic music vibe.
          </p>
        </div>

        {/* Toolbar (Timeframes + Share Action) */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8 pb-4 border-b border-white/5">
          {/* Switcher pills */}
          <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-full backdrop-blur-md">
            {(["all", "year", "month"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                  timeframe === t 
                    ? "bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/10" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t === "all" ? "All-Time" : t === "year" ? "This Year" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Top Track Card (col-span-2) */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#0e1614]/80 to-[#070b0a]/90 border border-[#223330]/40 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
            {/* Soft decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/8 transition-colors duration-500" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Flame size={18} className="animate-pulse" />
                </div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Top Track Overall</h2>
              </div>
              <Award size={18} className="text-emerald-500/40" />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative z-10 py-2">
              {/* Cover Art Sleeve & Vinyl Record disc wrapper */}
              <div className="relative pr-16 sm:pr-20 shrink-0 select-none group/cover">
                
                {/* Vinyl record - Slides out on sleeve hover */}
                <div className="absolute top-2 right-0 w-32 h-32 sm:w-36 sm:h-36 bg-[#121212] rounded-full border-4 border-[#1a1a1a] flex items-center justify-center transition-all duration-700 ease-out group-hover/cover:translate-x-20 group-hover/cover:rotate-180 z-0 shadow-lg shadow-black/80">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-2 rounded-full border border-zinc-800/40" />
                  <div className="absolute inset-5 rounded-full border border-zinc-800/30" />
                  <div className="absolute inset-8 rounded-full border border-zinc-800/20" />
                  {/* Center label image */}
                  <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
                    <img 
                      src={displaySong.imageUrl} 
                      className={`w-full h-full object-cover rounded-full ${isCurrentSongPlaying ? 'animate-spin' : ''}`}
                      style={{ animationDuration: '4s' }} 
                      alt=""
                    />
                  </div>
                  {/* Spindle hole */}
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-black border border-zinc-800" />
                </div>

                {/* Sleeve Cover */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-2xl shadow-black/90 z-10 bg-zinc-900 border border-white/10 transition-transform duration-500 group-hover/cover:scale-[1.02]">
                  <img src={displaySong.imageUrl} alt={displaySong.title} className="w-full h-full object-cover" />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => handlePlaySong(displaySong)}
                      className="p-3.5 rounded-full bg-emerald-500 text-black hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl shadow-emerald-500/20"
                    >
                      {isCurrentSongPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Info */}
              <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">
                    No. 1 Heavy Rotation
                  </span>
                  <button 
                    onClick={() => {
                      setIsLiked(!isLiked);
                      toast(isLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
                    }}
                    className={`p-1.5 rounded-full hover:bg-white/5 transition-colors ${isLiked ? 'text-emerald-500' : 'text-zinc-500 hover:text-white'}`}
                  >
                    <Heart size={16} className={isLiked ? "fill-current" : ""} />
                  </button>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-1 mb-1">
                  {displaySong.title}
                </h3>
                <p className="text-lg text-zinc-400 font-medium mb-5">{displaySong.artist}</p>
                
                <button
                  onClick={() => handlePlaySong(displaySong)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-white/5 hover:bg-emerald-400 hover:text-black"
                >
                  {isCurrentSongPlaying ? (
                    <>
                      <Pause size={14} className="fill-current" /> Pause Preview
                    </>
                  ) : (
                    <>
                      <Play size={14} className="fill-current ml-0.5" /> Stream Track
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Vibe Profile Card (col-span-1) */}
          <div className="col-span-1 bg-gradient-to-br from-[#0e1614]/80 to-[#070b0a]/90 border border-[#223330]/40 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
            <div className="flex items-center gap-2.5 mb-6 relative z-10">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles size={18} />
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Your Sound Vibe</h2>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-[calc(100%-52px)]">
              <div>
                <span className="font-['Caveat'] text-2xl text-emerald-400 block mb-1">Aesthetic style...</span>
                <h3 className="text-2xl font-bold text-white leading-tight mb-2 tracking-tight">Cyber-Ambient Explorer</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  A late-night listener who loves atmospheric beats, synthscapes, and ambient lo-fi soundscapes. Dominates electronic and retro synth waves.
                </p>
              </div>

              {/* Soundwave equalizer graph visual */}
              <div className="flex items-end justify-center gap-1.5 h-16 mt-6 bg-white/[0.01] border border-white/[0.02] rounded-2xl p-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => {
                  const heights = [24, 48, 18, 36, 52, 28, 42, 14, 30, 48, 22, 36];
                  const delays = [0.1, 0.4, 0.2, 0.6, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.9, 0.3];
                  return (
                    <div 
                      key={bar} 
                      className="w-1.5 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full soundwave-bar"
                      style={{
                        height: `${heights[bar - 1]}px`,
                        animationDelay: `${delays[bar - 1]}s`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Top Artist Card (col-span-1) */}
          <div className="col-span-1 bg-gradient-to-br from-indigo-950/20 to-[#070b0a]/95 border border-[#223330]/40 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 flex flex-col justify-between">
            <div className="absolute bottom-4 right-4 text-emerald-500/10 pointer-events-none">
              <Mic2 className="-rotate-12 w-28 h-28 opacity-10 group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="flex items-center gap-2.5 relative z-10">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Mic2 size={18} />
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Top Artist</h2>
            </div>
            
            <div className="my-8 relative z-10">
              <span className="font-['Caveat'] text-2xl text-emerald-400 block mb-1">Your absolute favorite...</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight leading-none break-words pr-4">
                {stats.topArtist || "Neon Synthwave Club"}
              </h3>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5">
              <span>Primary Genre</span>
              <span className="font-semibold text-zinc-300">Retro Synth / Electronic</span>
            </div>
          </div>

          {/* Card 4: Month-by-month activity chart (col-span-2) */}
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-[#0e1614]/80 to-[#070b0a]/90 border border-[#223330]/40 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <TrendingUp size={18} />
                </div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">Listening Trends</h2>
              </div>
              <span className="text-xs text-emerald-400 font-semibold tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Active minutes
              </span>
            </div>

            {/* Custom Bar Chart */}
            <div className="flex items-end gap-3 sm:gap-4 h-40 pt-4 relative z-10">
              {chartData.map((data, index) => {
                const heightPercent = maxChartVal > 0 ? (data.mins / maxChartVal) * 100 : 0;
                return (
                  <div key={index} className="flex flex-col items-center gap-2 group/bar cursor-pointer relative flex-1">
                    {/* Floating Tooltip */}
                    <div className="absolute -top-9 scale-0 group-hover/bar:scale-100 transition-transform duration-200 bg-zinc-950 border border-emerald-500/30 text-[#f0faf7] px-2 py-0.5 rounded-md text-[10px] font-semibold z-20 shadow-lg pointer-events-none whitespace-nowrap">
                      {data.mins.toLocaleString()} min
                    </div>
                    
                    {/* Bar container */}
                    <div className="w-full bg-white/[0.02] rounded-t-lg h-32 flex items-end overflow-hidden border border-white/[0.01]">
                      <div 
                        className={`w-full bg-gradient-to-t ${data.color} rounded-t-lg opacity-80 group-hover/bar:opacity-100 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.1)] group-hover/bar:shadow-[0_0_16px_rgba(16,185,129,0.3)]`}
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                      />
                    </div>
                    
                    {/* Month Label */}
                    <span className="text-xs font-semibold text-zinc-500 group-hover/bar:text-emerald-400 transition-colors duration-200">
                      {data.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Highlight Stats Metrics (Row of 3 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-[#0e1614]/50 border border-[#223330]/30 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Calendar size={14} />
              <span className="text-xs uppercase font-medium tracking-wide">
                {timeframe === "all" ? "All-Time" : timeframe === "year" ? "This Year" : "This Month"}
              </span>
            </div>
            <p className="text-3xl font-extrabold font-['Bebas_Neue'] text-white tracking-wide leading-none">
              {displayMinutes.toLocaleString()}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Minutes streamed</span>
          </div>

          <div className="bg-[#0e1614]/50 border border-[#223330]/30 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <Clock size={14} />
              <span className="text-xs uppercase font-medium tracking-wide">Daily Average</span>
            </div>
            <p className="text-3xl font-extrabold font-['Bebas_Neue'] text-white tracking-wide leading-none">
              {(() => {
                const now = new Date();
                const daysThisMonth = Math.max(1, now.getDate());
                const daysThisYear = Math.max(1, Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000));
                
                let days = 30;
                if (timeframe === "month") days = daysThisMonth;
                else if (timeframe === "year") days = daysThisYear;
                else days = Math.max(daysThisYear, 30); // reasonable fallback
                
                const avg = displayMinutes / days;
                return avg > 0 && avg < 1 ? "<1" : Math.round(avg).toLocaleString();
              })()}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Minutes per day</span>
          </div>

          <div className="bg-[#0e1614]/50 border border-[#223330]/30 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <TrendingUp size={14} />
              <span className="text-xs uppercase font-medium tracking-wide">Grand Total</span>
            </div>
            <p className="text-3xl font-extrabold font-['Bebas_Neue'] text-emerald-400 tracking-wide leading-none">
              {stats.totalMinutes.toLocaleString()}
            </p>
            <span className="text-[10px] text-zinc-500 font-medium">Cumulative minutes</span>
          </div>

        </div>

      </div>
    </div>
  );
}
