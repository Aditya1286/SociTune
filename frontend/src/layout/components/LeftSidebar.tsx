import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useMusicStore } from "@/stores/useMusicStore"
import { useChatStore } from "@/stores/useChatStore"
import { SignedIn } from "@clerk/clerk-react"
import { HomeIcon, Library, MessageCircle, LayoutGrid, List, Award, MessageSquareHeart, Crown, Clock } from "lucide-react"
import { Link } from "react-router-dom"
import PlaylistSkeleton from "../../components/skeletons/PlaylistSkeleton"

const LeftSidebar = () => {
    //data fetching => zustand
    const {albums,fetchAlbums,isLoading} = useMusicStore();
    const { unreadMessages } = useChatStore();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        fetchAlbums();
    },[fetchAlbums])

    const totalUnread = Array.from(unreadMessages.values()).reduce((sum, count) => sum + count, 0);

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Navigation menu */}
      <div className="rounded-xl bg-zinc-900/80 backdrop-blur-sm p-4 border border-white/5">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(buttonVariants({
              variant: "ghost",
              className: "w-full justify-start text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            }))}
          >
            <HomeIcon className="mr-3 size-5" />
            <span className="hidden md:inline font-medium">Home</span>
          </Link>

          <SignedIn>
            <Link
              to={"/chat"}
              className={cn(buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-zinc-300 hover:text-white hover:bg-white/10 transition-colors relative"
              }))}
            >
              <MessageCircle className="mr-3 size-5" />
              <span className="hidden md:inline font-medium">Messages</span>
              {totalUnread > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full md:w-auto md:h-auto md:px-2 md:py-0.5 shadow-sm shadow-emerald-500/50">
                  {totalUnread}
                </span>
              )}
            </Link>

            <Link
              to={"/premium"}
              className={cn(buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              }))}
            >
              <Crown className="mr-3 size-5" />
              <span className="hidden md:inline font-medium">Premium</span>
            </Link>

            <Link
              to={"/founder"}
              className={cn(buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              }))}
            >
              <Award className="mr-3 size-5" />
              <span className="hidden md:inline font-medium">Founders</span>
            </Link>

            <Link
              to={"/time-travel"}
              className={cn(buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              }))}
            >
              <Clock className="mr-3 size-5" />
              <span className="hidden md:inline font-medium">Time Travel</span>
            </Link>

            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-feedback"))}
              className={cn(buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              }))}
            >
              <MessageSquareHeart className="mr-3 size-5" />
              <span className="hidden md:inline font-medium">Feedback</span>
            </button>

          </SignedIn>

        </div>
      </div>

      {/* Library section */}
      <div className="flex-1 rounded-xl bg-zinc-900/80 backdrop-blur-sm p-4 border border-white/5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-zinc-300 px-2 hover:text-white transition-colors cursor-pointer group">
                <Library className="size-5 mr-3 group-hover:scale-105 transition-transform" />
                <span className="hidden md:inline font-medium">Your Library</span>
            </div>
            
            <button 
                onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                className="text-zinc-400 hover:text-white transition-colors p-2 hidden md:block rounded-full hover:bg-white/10"
                title={viewMode === 'list' ? "Switch to grid view" : "Switch to list view"}
            >
                {viewMode === 'list' ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
        </div>

        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
              <div className={cn(
                  "pb-4",
                  viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 hidden md:grid" : "space-y-2",
                  viewMode === 'grid' && "md:grid-cols-2 xl:grid-cols-3"
              )}>
                {
                    isLoading ? (
                        <PlaylistSkeleton />
                    ) : albums.map((album) => (
								<Link
									to={`/albums/${album._id}`}
									key={album._id}
									className={cn(
                                        "group cursor-pointer transition-all duration-300 hover:bg-white/10 rounded-lg relative overflow-hidden",
                                        viewMode === 'list' ? "p-2 flex items-center gap-3" : "aspect-square block"
                                    )}
								>
                                    <div className={cn(
                                        "relative overflow-hidden",
                                        viewMode === 'list' ? "size-12 rounded-md flex-shrink-0" : "w-full h-full rounded-lg"
                                    )}>
                                        <img
                                            src={album.imageUrl}
                                            alt={album.title}
                                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                                        />
                                        {viewMode === 'grid' && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="bg-emerald-500 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                                                    <LayoutGrid className="size-5 text-black" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

									{viewMode === 'list' && (
                                        <div className='flex-1 min-w-0 hidden md:block'>
                                            <p className='font-medium truncate text-white/90 group-hover:text-white transition-colors'>{album.title}</p>
                                            <p className='text-sm text-zinc-400/80 truncate group-hover:text-zinc-300 transition-colors'>Playlist • {album.artist}</p>
                                        </div>
                                    )}
								</Link>
							)
                    )
                }
              </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default LeftSidebar