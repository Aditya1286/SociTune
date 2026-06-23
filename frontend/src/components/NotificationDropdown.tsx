import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, Sparkles, MessageSquare, UserPlus, Info, Check, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification } = useNotificationStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "social":
        return <UserPlus className="w-4 h-4 text-sky-400" />;
      case "messages":
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case "music":
        return <Bell className="w-4 h-4 text-purple-400" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      default:
        return <Info className="w-4 h-4 text-amber-400" />;
    }
  };

  const getCategoryBg = (type: string) => {
    switch (type) {
      case "social":
        return "bg-sky-500/10 border-sky-500/20";
      case "messages":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "music":
        return "bg-purple-500/10 border-purple-500/20";
      case "ai":
        return "bg-pink-500/10 border-pink-500/20";
      default:
        return "bg-amber-500/10 border-amber-500/20";
    }
  };

  // Only show the 5 most recent notifications in the dropdown
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/80 transition-all focus:outline-none"
        aria-label="Toggle notifications dropdown"
      >
        <Bell className="w-5 h-5 transition-transform duration-300 active:scale-90" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 items-center justify-center text-[8px] font-bold text-black font-sans leading-none">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/[0.08] bg-zinc-950/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-white/[0.04]">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={cn(
                      "group/item relative p-4 flex gap-3 transition-colors hover:bg-white/[0.02]",
                      !notif.isRead && "bg-emerald-500/[0.01]"
                    )}
                  >
                    {/* Unread Indicator Dot */}
                    {!notif.isRead && (
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}

                    {/* Sender Avatar or Icon */}
                    {notif.senderAvatar ? (
                      <img
                        src={notif.senderAvatar}
                        alt={notif.senderName || "Sender"}
                        className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 self-start mt-0.5"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5",
                          getCategoryBg(notif.type)
                        )}
                      >
                        {getCategoryIcon(notif.type)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    </div>

                    {/* Action buttons (hover visible) */}
                    <div className="absolute right-3 bottom-2 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id)}
                          className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id)}
                        className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-all"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5 mb-3 text-zinc-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">All caught up!</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">No new notifications.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2.5 bg-white/[0.01] hover:bg-white/[0.03] border-t border-white/[0.06] text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              View All Notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
