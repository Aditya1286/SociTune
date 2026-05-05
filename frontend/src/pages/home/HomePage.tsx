import Topbar from "@/components/Topbar";
import { useEffect } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedSection from "./components/FeaturedSection";
import { ScrollArea } from "@/components/ui/scroll-area";
import SectionGrid from "./components/SectionGrid";
import { usePlayerStore } from "@/stores/usePlayerStore";
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const HomePage = () => {
  const { initializeQueue } = usePlayerStore()
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
  },[fetchTrendingSongs, fetchFeaturedSongs, fetchMadeForYouSongs]);
  useEffect(() =>{
    if(madeForYouSongs.length > 0 && featuredSongs.length > 0 && trendingSongs.length > 0){
      const allSongs = [...madeForYouSongs, ...featuredSongs, ...trendingSongs];
      initializeQueue(allSongs);
    }
  }, [initializeQueue,madeForYouSongs, featuredSongs, trendingSongs]);
  return (
    <main className="rounded-md overflow-hidden h-full bg-neutral-900 relative">
      {/* Background glowing effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-neutral-900 to-neutral-900 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        <Topbar/>
        <ScrollArea className='flex-1 h-[calc(100vh-180px)]'>
          <div className="p-6 sm:p-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-8 capitalize tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-400 drop-shadow-sm">
              {getGreeting()}
            </h1>
            <FeaturedSection />
          
            <div className="space-y-10 mt-10">
              <SectionGrid title="Made For You" songs={madeForYouSongs} isLoading={isLoading} />
              <SectionGrid title="Trending Now" songs={trendingSongs} isLoading={isLoading} />
            </div>
          </div>
        </ScrollArea>
      </div>
    </main>
  )
}

export default HomePage