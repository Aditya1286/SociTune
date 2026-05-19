import { useEffect, useRef, useState } from "react";
import { Clock, Mic2, Flame, Loader2, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import type { Song } from "@/types";

interface TimeTravelStats {
  topSong: Song | null;
  topArtist: string | null;
  totalMinutes: number;
  thisMonthMinutes: number;
  otherMonthMinutes: number;
}

export default function TimeTravelPage() {
  const [stats, setStats] = useState<TimeTravelStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/users/time-travel");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch time travel stats:", error);
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
      <div className="flex-1 h-full flex items-center justify-center bg-[#060a0a]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-[#060a0a] text-zinc-400">
        Failed to load stats.
      </div>
    );
  }

  return (
    <div ref={pageRef} className="bg-[#060a0a] text-[#f0faf7] min-h-[calc(100vh-80px)] overflow-y-auto relative font-['Space_Grotesk'] w-full rounded-xl border border-white/5 pb-20">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 pt-16">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6">
            <Clock size={16} /> Your Musical Journey
          </div>
          
          <h1 className="font-['Bebas_Neue'] text-[clamp(48px,8vw,96px)] leading-[0.9] tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-emerald-500">
            TIME TRAVEL
          </h1>
          <p className="text-[#9aada8] text-lg max-w-xl mx-auto font-light">
            A look back at the soundtrack of your life. See what's been on repeat and how your taste has evolved over time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Top Song Card */}
          <div className="col-span-1 md:col-span-2 bg-[#0d1211] border border-[#1e2422] rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-500/10 transition-colors duration-500" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Flame size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Top Track Overall</h2>
            </div>

            {stats.topSong ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-10">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 group-hover:-translate-y-2 transition-transform duration-500">
                  <img src={stats.topSong.imageUrl} alt={stats.topSong.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2 line-clamp-2">{stats.topSong.title}</h3>
                  <p className="text-xl text-emerald-400 font-medium">{stats.topSong.artist}</p>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-[#6b7c78] italic">No tracks played yet</div>
            )}
          </div>

          {/* Top Artist Card */}
          <div className="col-span-1 bg-gradient-to-br from-emerald-900/40 to-[#0d1211] border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
             <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 rounded-xl bg-white/10 text-white">
                <Mic2 size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Top Artist</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center h-[calc(100%-60px)] relative z-10">
              {stats.topArtist ? (
                <>
                  <div className="font-['Caveat'] text-2xl text-emerald-400 mb-1">Your favorite...</div>
                  <h3 className="text-3xl font-bold text-white leading-tight break-words">{stats.topArtist}</h3>
                </>
              ) : (
                 <div className="text-[#6b7c78] italic">No artist found</div>
              )}
            </div>
            <Sparkles className="absolute bottom-6 right-6 text-emerald-500/20 w-24 h-24 -rotate-12" />
          </div>

          {/* Time Stats Cards */}
          <div className="col-span-1 bg-[#0d1211] border border-[#1e2422] rounded-3xl p-6 hover:border-emerald-500/30 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">This Month</h2>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-['Bebas_Neue'] text-white tracking-wide">{stats.thisMonthMinutes.toLocaleString()}</span>
              <span className="text-[#6b7c78] font-medium uppercase tracking-wider text-sm">Minutes</span>
            </div>
          </div>

          <div className="col-span-1 bg-[#0d1211] border border-[#1e2422] rounded-3xl p-6 hover:border-emerald-500/30 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[600ms] fill-mode-both">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Clock size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Previous Months</h2>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-['Bebas_Neue'] text-white tracking-wide">{stats.otherMonthMinutes.toLocaleString()}</span>
              <span className="text-[#6b7c78] font-medium uppercase tracking-wider text-sm">Minutes</span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 rounded-3xl p-6 hover:border-emerald-500/40 transition-colors duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-[700ms] fill-mode-both">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 rounded-xl bg-white/10 text-white">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white/90">All-Time Total</h2>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-6xl font-['Bebas_Neue'] text-emerald-400 tracking-wide drop-shadow-md">{stats.totalMinutes.toLocaleString()}</span>
              <span className="text-white/70 font-medium uppercase tracking-wider text-sm">Minutes Listened</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
