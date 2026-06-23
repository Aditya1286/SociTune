import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useMusicStore } from "@/stores/useMusicStore"
import { useChatStore } from "@/stores/useChatStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { SignedIn } from "@clerk/clerk-react"
import { 
  Home, 
  Library, 
  MessageSquare, 
  LayoutGrid, 
  List, 
  Cpu, 
  MessageSquareHeart, 
  Gem, 
  History, 
  Heart, 
  Activity,
  Bell
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import PlaylistSkeleton from "../../components/skeletons/PlaylistSkeleton"

const LeftSidebar = () => {
    const { albums, fetchAlbums, isLoading } = useMusicStore();
    const { unreadMessages } = useChatStore();
    const { unreadCount: notifUnread } = useNotificationStore();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const location = useLocation();

    useEffect(() => {
        fetchAlbums();
    }, [fetchAlbums])

    const totalUnread = Array.from(unreadMessages.values()).reduce((sum, count) => sum + count, 0);

    const isLinkActive = (path: string) => location.pathname === path;

    const navItems = [
      { path: "/", label: "Home", icon: Home, hoverColorClass: "text-zinc-400 group-hover:text-white" },
      { path: "/chat", label: "Messages", icon: MessageSquare, hoverColorClass: "text-zinc-400 group-hover:text-white" },
      { path: "/notifications", label: "Notifications", icon: Bell, hoverColorClass: "text-zinc-400 group-hover:text-emerald-400" },
      { path: "/premium", label: "Premium", icon: Gem, hoverColorClass: "text-zinc-400 group-hover:text-emerald-400" },
      { path: "/founder", label: "Founders", icon: Cpu, hoverColorClass: "text-zinc-400 group-hover:text-white" },
      { path: "/time-travel", label: "Time Travel", icon: History, hoverColorClass: "text-zinc-400 group-hover:text-indigo-400" },
      { path: "/matches", label: "Match Engine", icon: Activity, hoverColorClass: "text-zinc-400 group-hover:text-cyan-400" },
    ];

  return (
    <div className="h-full flex flex-col font-sans select-none rounded-xl bg-[#09090b]/80 backdrop-blur-sm border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Navigation menu */}
      <div className="p-3 relative z-10">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isLinkActive(item.path);
            
            // Only render SignedIn links for non-Home pages
            if (item.path !== "/") {
              return (
                <SignedIn key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group relative pl-5",
                      active
                        ? "bg-white/10 text-white font-semibold shadow-inner border border-white/[0.03]"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                    )}
                  >
                    {/* Active vertical bar indicator with custom shadow glow */}
                    {active && (
                      <div className={cn(
                        "absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full transition-all duration-300",
                        item.path === "/premium" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                        item.path === "/time-travel" ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" :
                        item.path === "/matches" ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" :
                        item.path === "/notifications" ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" :
                        "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      )} />
                    )}

                    <item.icon 
                      strokeWidth={1.6}
                      className={cn(
                        "size-5 transition-all duration-300 group-hover:scale-105", 
                        active ? (
                          item.path === "/premium" ? "text-emerald-400" :
                          item.path === "/time-travel" ? "text-indigo-400" :
                          item.path === "/matches" ? "text-cyan-400" :
                          item.path === "/notifications" ? "text-purple-400" :
                          "text-white"
                        ) : item.hoverColorClass
                      )} 
                    />
                    <span className="hidden md:inline font-medium transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>

                    {item.path === "/chat" && totalUnread > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                        <span className="relative bg-emerald-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full md:w-auto md:h-auto md:px-2 md:py-0.5 shadow-sm shadow-emerald-500/50">
                          {totalUnread}
                        </span>
                      </div>
                    )}

                    {item.path === "/notifications" && notifUnread > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                        <span className="relative bg-emerald-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full md:w-auto md:h-auto md:px-2 md:py-0.5 shadow-sm shadow-emerald-500/50">
                          {notifUnread}
                        </span>
                      </div>
                    )}
                  </Link>
                </SignedIn>
              );
            }

            // Render Home link publicly
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group relative pl-5",
                  active
                    ? "bg-white/10 text-white font-semibold shadow-inner border border-white/[0.03]"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                )}
              >
                {/* Active vertical bar indicator */}
                {active && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                )}

                <item.icon 
                  strokeWidth={1.6}
                  className={cn(
                    "size-5 transition-all duration-300 group-hover:scale-105", 
                    active ? "text-white" : item.hoverColorClass
                  )} 
                />
                <span className="hidden md:inline font-medium transition-transform duration-300 group-hover:translate-x-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* Feedback button */}
          <SignedIn>
            <button
              onClick={() => document.dispatchEvent(new CustomEvent("open-feedback"))}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] pl-5"
              )}
            >
              <MessageSquareHeart strokeWidth={1.6} className="size-5 transition-all duration-300 group-hover:scale-105 text-zinc-400 group-hover:text-white" />
              <span className="hidden md:inline font-medium transition-transform duration-300 group-hover:translate-x-0.5">Feedback</span>
            </button>
          </SignedIn>
        </div>
      </div>

      {/* Subtle Separator */}
      <div className="mx-4 border-t border-white/[0.04] relative z-10" />

      {/* Library section */}
      <div className="flex-1 p-4 flex flex-col min-h-0 relative z-10">
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer group">
                <Library strokeWidth={1.6} className="size-5 mr-3 group-hover:scale-105 transition-transform" />
                <span className="hidden md:inline font-semibold text-xs uppercase tracking-wider text-zinc-400 group-hover:text-zinc-300">Your Library</span>
            </div>
            
            <button 
                onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                className="text-zinc-400 hover:text-white transition-colors p-2 hidden md:block rounded-full hover:bg-white/10"
                title={viewMode === 'list' ? "Switch to grid view" : "Switch to list view"}
            >
                {viewMode === 'list' ? <LayoutGrid strokeWidth={1.6} className="size-4" /> : <List strokeWidth={1.6} className="size-4" />}
            </button>
        </div>

        <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
              <div className={cn(
                  "pb-4",
                  viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 hidden md:grid" : "space-y-1.5",
                  viewMode === 'grid' && "md:grid-cols-2 xl:grid-cols-3"
              )}>
                {/* Liked Songs Fixed Item */}
                <Link
                    to="/liked-songs"
                    className={cn(
                        "group cursor-pointer transition-all duration-300 hover:bg-white/[0.04] rounded-lg relative overflow-hidden",
                        viewMode === 'list' ? "p-2 flex items-center gap-3" : "aspect-square block"
                    )}
                >
                    <div className={cn(
                        "relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20",
                        viewMode === 'list' ? "size-12 rounded-lg flex-shrink-0" : "w-full h-full rounded-lg"
                    )}>
                        <Heart strokeWidth={1.6} className="size-5 text-indigo-400 fill-indigo-400/20 group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
                    </div>
                    {viewMode === 'list' && (
                        <div className='flex-1 min-w-0 hidden md:block'>
                            <p className='font-semibold text-xs text-white/90 group-hover:text-white transition-colors'>Liked Songs</p>
                            <p className='text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors mt-0.5'>Playlist</p>
                        </div>
                    )}
                </Link>

                {
                    isLoading ? (
                        <PlaylistSkeleton />
                    ) : albums.map((album) => (
								<Link
									to={`/albums/${album._id}`}
									key={album._id}
									className={cn(
                                        "group cursor-pointer transition-all duration-300 hover:bg-white/[0.04] rounded-lg relative overflow-hidden",
                                        viewMode === 'list' ? "p-2 flex items-center gap-3" : "aspect-square block"
                                    )}
								>
                                    <div className={cn(
                                        "relative overflow-hidden border border-white/5",
                                        viewMode === 'list' ? "size-12 rounded-lg flex-shrink-0" : "w-full h-full rounded-lg"
                                    )}>
                                        <img
                                            src={album.imageUrl}
                                            alt={album.title}
                                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                                        />
                                        {viewMode === 'grid' && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="bg-emerald-500 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                                                    <LayoutGrid strokeWidth={1.6} className="size-5 text-black" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

									{viewMode === 'list' && (
                                        <div className='flex-1 min-w-0 hidden md:block'>
                                            <p className='font-semibold text-xs truncate text-white/90 group-hover:text-white transition-colors'>{album.title}</p>
                                            <p className='text-[10px] text-zinc-500 truncate group-hover:text-zinc-400 transition-colors mt-0.5'>Playlist • {album.artist}</p>
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