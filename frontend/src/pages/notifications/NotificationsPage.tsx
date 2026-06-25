import { useState, useEffect } from "react";
import { 
  Bell, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  MessageSquare, 
  UserPlus, 
  Music, 
  Info, 
  Flame, 
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// --- Category Tabs ---
const TABS = [
  { id: "all", label: "All", countKey: null },
  { id: "social", label: "Social", countKey: "social" },
  { id: "messages", label: "Messages", countKey: "messages" },
  { id: "music", label: "Music", countKey: "music" },
  { id: "ai", label: "AI", countKey: "ai" },
  { id: "system", label: "System", countKey: "system" }
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { setCurrentSong } = usePlayerStore();
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState("all");

  const handleListenAlong = async (songId: string, notifId: string) => {
    try {
      await markAsRead(notifId);
      const response = await axiosInstance.get(`/songs/${songId}`);
      if (response.data) {
        setCurrentSong(response.data);
        toast.success(`Tuned in to "${response.data.title}"`);
      }
    } catch (err) {
      console.error("Failed to play song:", err);
      toast.error("Failed to tune in along");
    }
  };

  // Fetch notifications on load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);


  // Filter notifications by category tab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    if (activeTab === "music" && (notif.type as string) === "PLAYLIST_LIKE") return true;
    if (activeTab === "social" && (notif.type as string) === "PLAYLIST_LIKE") return true;
    return notif.type === activeTab;
  });

  // Calculate unread count per category
  const getTabUnreadCount = (tabId: string) => {
    if (tabId === "all") return notifications.filter((n) => !n.isRead).length;
    return notifications.filter((n) => {
      if (!n.isRead) {
        if (n.type === tabId) return true;
        if (tabId === "music" && (n.type as string) === "PLAYLIST_LIKE") return true;
        if (tabId === "social" && (n.type as string) === "PLAYLIST_LIKE") return true;
      }
      return false;
    }).length;
  };

  // Group notifications chronologically
  const groupNotifications = (list: Notification[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const thisWeek = today - 7 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      Earlier: []
    };

    list.forEach((notif) => {
      const time = new Date(notif.createdAt).getTime();
      if (time >= today) {
        groups["Today"].push(notif);
      } else if (time >= yesterday) {
        groups["Yesterday"].push(notif);
      } else if (time >= thisWeek) {
        groups["This Week"].push(notif);
      } else {
        groups["Earlier"].push(notif);
      }
    });

    // Remove empty categories
    return Object.keys(groups).reduce((acc: any, key) => {
      if (groups[key].length > 0) acc[key] = groups[key];
      return acc;
    }, {});
  };

  const groupedNotifications = groupNotifications(filteredNotifications);

  const handleConfettiTrigger = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#a855f7", "#ec4899", "#3b82f6", "#10b981"]
    });
  };

  // --- Render Functions for Premium Custom Cards ---

  // 1. Music Taste Compatibility Card
  const renderCompatibilityCard = (notif: Notification) => {
    const score = notif.metadata?.matchPercentage || 0;
    const artists = notif.metadata?.sharedArtists || [];
    
    return (
      <div className="relative p-5 rounded-2xl border border-white/[0.04] bg-[#121212] shadow-xl overflow-hidden group/card flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
              ♡ Music Match
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {!notif.isRead && (
              <button
                onClick={() => markAsRead(notif._id)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white transition-all"
                title="Mark as read"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(notif._id)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-red-400 transition-all"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-base leading-snug">{notif.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{notif.message}</p>
            
            {artists.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {artists.map((artist, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#1a1a1a] text-zinc-300 border border-white/5"
                  >
                    {artist}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SVG Compatibility Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center bg-[#1a1a1a] rounded-full border border-white/5">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-zinc-800"
                strokeWidth="2.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                className="stroke-cyan-400"
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - score / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-extrabold text-cyan-400">
              {score}%
            </span>
          </div>
        </div>

        {/* Bottom Button */}
        <button
          onClick={() => {
            handleConfettiTrigger();
            markAsRead(notif._id);
            navigate("/matches");
          }}
          className="w-full py-2.5 text-xs font-semibold rounded-xl bg-[#1c1c1e] hover:bg-[#2c2c2e] text-zinc-200 border border-white/[0.04] transition-all text-center"
        >
          View Match
        </button>
      </div>
    );
  };

  // 2. Listening Activity Card (Live Feed Notification)
  const renderListeningActivityCard = (notif: Notification) => {
    const meta = notif.metadata;
    if (!meta) return null;

    return (
      <div className="relative p-5 rounded-2xl border border-white/[0.04] bg-[#121212] shadow-xl overflow-hidden group/card flex flex-col gap-3">
        {/* Header row */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase">((•)) Live Activity</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Now</span>
            {!notif.isRead && (
              <button
                onClick={() => markAsRead(notif._id)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white transition-all"
                title="Mark as read"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(notif._id)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-red-400 transition-all"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex gap-3.5 items-center w-full min-w-0">
            {/* Cover Artwork */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5">
              <img 
                src={meta.songArtwork || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150"} 
                alt={meta.songTitle} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-sm truncate">{meta.songTitle}</h4>
              <p className="text-xs text-zinc-400 truncate">{meta.songArtist}</p>
              <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{notif.message}</p>
            </div>
          </div>

          <button
            onClick={() => meta.songId && handleListenAlong(meta.songId, notif._id)}
            className="w-full sm:w-auto px-6 py-2 text-xs font-semibold rounded-full bg-white hover:bg-zinc-200 text-black shadow-lg transition-all shrink-0 self-stretch sm:self-center"
          >
            Listen
          </button>
        </div>
      </div>
    );
  };

  // 3. Trending Spotlight Card
  const renderTrendingCard = (notif: Notification) => {
    const meta = notif.metadata;
    if (!meta) return null;

    return (
      <div className="relative p-5 rounded-2xl border border-white/[0.04] bg-[#121212] shadow-xl overflow-hidden group/card flex flex-col gap-3">
        {/* Header row */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Spotlight</span>
          </div>
          
          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <button
                onClick={() => markAsRead(notif._id)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white transition-all"
                title="Mark as read"
              >
                <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(notif._id)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-red-400 transition-all"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex gap-4 items-center w-full min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5">
              <img 
                src={meta.playlistCoverUrl || "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=150"} 
                alt="Playlist Cover" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 border border-white/10 text-[8px] font-black text-rose-400 uppercase tracking-widest">
                {meta.genreBadge}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-sm truncate">{notif.title}</h4>
              <p className="text-xs text-zinc-400 leading-normal mt-0.5">{notif.message}</p>
            </div>
          </div>

          <button
            onClick={() => {
              markAsRead(notif._id);
              if (meta.playlistId && !meta.playlistId.startsWith("mock_")) {
                navigate(`/albums/${meta.playlistId}`);
              } else {
                navigate("/");
                toast.info("Tuning into trending feed!");
              }
            }}
            className="w-full sm:w-auto px-6 py-2 text-xs font-semibold rounded-full bg-white hover:bg-zinc-200 text-black shadow-lg transition-all shrink-0 self-stretch sm:self-center"
          >
            Listen
          </button>
        </div>
      </div>
    );
  };

  // 4. Weekly AI taste report
  const renderAICard = (notif: Notification) => {
    const meta = notif.metadata;
    return (
      <div className="relative p-5 rounded-2xl border border-white/[0.04] bg-[#121212] shadow-xl overflow-hidden group/card flex flex-col gap-3">
        {/* Header row */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 text-pink-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">SociTune AI</span>
          </div>
          
          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <button
                onClick={() => markAsRead(notif._id)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white transition-all"
                title="Mark as read"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(notif._id)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-red-400 transition-all"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex flex-col gap-4">
          <div>
            <h4 className="font-bold text-white text-sm">{notif.title}</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
          </div>

          {meta?.musicPersonality && (
            <div className="text-xs text-zinc-400 font-medium">
              Personality: <span className="text-rose-400 font-bold">{meta.musicPersonality}</span>
            </div>
          )}

          {meta?.moodTrend && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Weekly Mood Trajectory</span>
              <div className="flex flex-wrap gap-1.5">
                {meta.moodTrend.map((mood, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1a1a1a] text-zinc-400 border border-white/5"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meta?.recommendations && (
            <div className="pt-3 border-t border-white/[0.04] space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Recommended Tracks</span>
              <div className="space-y-2">
                {meta.recommendations.map((rec, idx) => {
                  const parts = rec.split(" - ");
                  const trackTitle = parts[0] || rec;
                  const trackArtist = parts[1] || "";
                  return (
                    <div key={idx} className="flex justify-between items-center bg-[#1a1a1a]/40 p-2.5 rounded-xl border border-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center border border-white/5">
                          <Music className="w-3.5 h-3.5 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-none">{trackTitle}</p>
                          {trackArtist && <p className="text-[10px] text-zinc-500 mt-0.5">{trackArtist}</p>}
                        </div>
                      </div>
                      <Play className="w-3 h-3 text-zinc-500 hover:text-white cursor-pointer transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Default Fallback Card / Friend requests
  const renderDefaultCard = (notif: Notification) => {
    return (
      <div className="relative p-5 rounded-2xl border border-white/[0.04] bg-[#121212] shadow-xl overflow-hidden group/card flex flex-col gap-3">
        {/* Header row */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1.5 text-zinc-400">
            {notif.type === "social" ? <UserPlus className="w-3.5 h-3.5 text-sky-400" /> :
             notif.type === "messages" ? <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> :
             <Info className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-[10px] font-bold tracking-wider uppercase">{notif.type}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {!notif.isRead && (
              <button
                onClick={() => markAsRead(notif._id)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white transition-all"
                title="Mark as read"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => deleteNotification(notif._id)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-red-400 transition-all"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex gap-3.5 items-start">
          <Avatar className="w-10 h-10 border border-white/10 shrink-0 mt-0.5">
            <AvatarImage src={notif.senderAvatar || undefined} alt={notif.senderName || "User"} className="object-cover" />
            <AvatarFallback className="bg-[#1a1a1a] border border-white/5">
              {notif.type === "social" ? <UserPlus className="w-4 h-4 text-sky-400" /> :
               notif.type === "messages" ? <MessageSquare className="w-4 h-4 text-emerald-400" /> :
               <Info className="w-4 h-4 text-amber-400" />}
            </AvatarFallback>
          </Avatar>

          <div>
            <h4 className="font-bold text-white text-sm leading-snug">{notif.title}</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (notif: Notification) => {
    // Determine card template based on type and metadata properties
    if (notif.type === "music" && notif.metadata?.matchPercentage) {
      return renderCompatibilityCard(notif);
    }
    if (notif.type === "music" && notif.metadata?.listeningStatus) {
      return renderListeningActivityCard(notif);
    }
    if (notif.type === "music" && notif.metadata?.genreBadge) {
      return renderTrendingCard(notif);
    }
    if (notif.type === "ai") {
      return renderAICard(notif);
    }
    return renderDefaultCard(notif);
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-[#0a0a0a] px-4 py-6 sm:p-8 select-none">
      {/* Page Container */}
      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg py-4 border-b border-white/[0.04] flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Notification Center
            </h1>
          </div>

          {notifications.filter((n) => !n.isRead).length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-white transition-all flex items-center justify-center gap-1.5 self-start sm:self-center"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Mark all read
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.02]">
          {TABS.map((tab) => {
            const count = getTabUnreadCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5",
                  isActive 
                    ? "bg-white border-white text-black"
                    : "bg-[#181818] border-white/[0.04] text-zinc-400 hover:text-white hover:bg-[#222]"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none",
                    isActive ? "bg-black text-white" : "bg-white/10 text-zinc-400"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List Content */}
        <div className="space-y-8 min-h-[400px]">
          {isLoading ? (
            // Loading Skeletons
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 w-full bg-[#121212] border border-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : Object.keys(groupedNotifications).length > 0 ? (
            // Grouped Notification Cards
            <AnimatePresence mode="popLayout">
              {Object.entries(groupedNotifications).map(([groupTitle, list]) => (
                <div key={groupTitle} className="space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase pl-1">
                    {groupTitle}
                  </h3>
                  
                  <div className="space-y-3">
                    {(list as Notification[]).map((notif) => (
                      <motion.div
                        key={notif._id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="relative group"
                      >
                        {/* Inline Read/Unread Dot Badge */}
                        {!notif.isRead && (
                          <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-400 rounded-full z-20" />
                        )}

                        {renderCard(notif)}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          ) : (
            // Empty State
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#121212] border border-white/5 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Quiet in the notification center</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 mx-auto leading-relaxed">
                When you get taste matches, friend requests, live listening updates, or AI profile updates, they'll show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
