import Topbar from "@/components/Topbar";
import { useEffect } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Shuffle } from "lucide-react";
import { toast } from "sonner";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getEditorPickTitle = () => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()} Vibe`;
};

const HomePage = () => {
  const { initializeQueue, playAlbum, toggleShuffle } = usePlayerStore();
  const { 
    fetchTrendingSongs,
    fetchFeaturedSongs,
    fetchMadeForYouSongs,
    isLoading,
    madeForYouSongs,
    featuredSongs,
    trendingSongs,
  } = useMusicStore();

  useEffect(() => {
    fetchTrendingSongs();
    fetchFeaturedSongs();
    fetchMadeForYouSongs();
  }, [fetchTrendingSongs, fetchFeaturedSongs, fetchMadeForYouSongs]);

  useEffect(() => {
    if (madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0) {
      const allSongs = [...madeForYouSongs, ...featuredSongs, ...trendingSongs];
      initializeQueue(allSongs);
    }
  }, [initializeQueue, madeForYouSongs, featuredSongs, trendingSongs]);

  const playHeroSection = () => {
    if (featuredSongs.length > 0) {
      playAlbum(featuredSongs, 0);
      toast.success(`Playing ${getEditorPickTitle()}!`);
    } else {
      toast.error("No featured tracks available right now.");
    }
  };

  const shuffleHeroSection = () => {
    if (featuredSongs.length > 0) {
      toggleShuffle();
      const randomIndex = Math.floor(Math.random() * featuredSongs.length);
      playAlbum(featuredSongs, randomIndex);
      toast.success(`Shuffling ${getEditorPickTitle()}!`);
    } else {
      toast.error("No featured tracks available right now.");
    }
  };

  return (
    <main className="rounded-xl overflow-hidden h-full bg-[#050807] relative w-full">
      {/* Background glowing effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-[#050807] to-[#050807] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col">
        <Topbar />
        
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="p-6 sm:p-8 max-w-[1200px] mx-auto pb-24">
            
            {/* Good Morning / Afternoon Greeting */}
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 capitalize tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-400">
              {getGreeting()}
            </h1>

            {/* Editor's Pick Premium Hero Section */}
            <div className="relative rounded-3xl bg-[#090e0d] border border-white/[0.03] p-8 sm:p-12 overflow-hidden shadow-2xl mb-10 group/hero">
              {/* Blur backdrop colors */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-pink-500/20 to-purple-600/20 blur-[80px] pointer-events-none group-hover/hero:scale-110 transition-transform duration-700" />
              <div className="absolute -bottom-10 left-10 w-[200px] h-[200px] bg-emerald-500/10 blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-6 backdrop-blur-md">
                  Editor's Pick
                </span>
                
                <h2 className="text-[clamp(36px,5vw,56px)] leading-[1.05] font-extrabold tracking-tight text-white mb-4">
                  {getEditorPickTitle()}
                </h2>
                
                <p className="text-zinc-400 text-sm sm:text-base font-light mb-8 leading-relaxed max-w-md">
                  Deep house rhythms meeting cinematic textures for late-night focus.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={playHeroSection}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95"
                  >
                    <Play size={14} fill="white" /> Play Now
                  </button>
                  
                  <button
                    onClick={shuffleHeroSection}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs tracking-wide transition-all hover:scale-105 active:scale-95"
                  >
                    <Shuffle size={14} /> Shuffle
                  </button>
                </div>
              </div>
            </div>

            {/* Music Library Sections - Stylized as Apple Music Grid */}
            <div className="space-y-10 mt-12">
              <SectionGrid title="Made For You" songs={madeForYouSongs} isLoading={isLoading} />
              <SectionGrid title="Trending Now" songs={trendingSongs} isLoading={isLoading} />
            </div>

          </div>
        </ScrollArea>
      </div>
    </main>
  );
};

export default HomePage;