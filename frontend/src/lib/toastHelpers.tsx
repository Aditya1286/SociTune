import { toast } from "sonner";
import type { Notification } from "@/types";
import { useChatStore } from "@/stores/useChatStore";
import { MessageSquare, X, Bell } from "lucide-react";

export const showNotificationToast = (notification: Notification) => {
	// Sound feedback
	try {
		const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
		audio.volume = 0.2;
		audio.play().catch(() => {});
	} catch (e) {}

	if (notification.type === "messages") {
		const chatState = useChatStore.getState();
		const isCurrentlyChatting = 
			window.location.pathname === "/chat" && 
			chatState.selectedUser?.clerkId === notification.senderId;

		if (isCurrentlyChatting) {
			// Do not show popup if they are currently chatting with this user
			return;
		}

		toast.custom((t) => (
			<div 
				className="group relative flex w-full max-w-sm md:w-[350px] bg-zinc-950/95 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 gap-3.5 items-center cursor-pointer hover:bg-zinc-900/60 transition-all duration-300 select-none overflow-hidden"
				onClick={() => {
					toast.dismiss(t);
					// Set selected user to this person before navigating if possible
					const user = chatState.users.find(u => u.clerkId === notification.senderId);
					if (user) {
						chatState.setSelectedUser(user, 'chat');
					}
					window.location.href = "/chat";
				}}
			>
				{/* Top-right subtle message tag or close button */}
				<div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
					<span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
						<MessageSquare className="w-3 h-3" />
						Chat
					</span>
					<button 
						onClick={(e) => {
							e.stopPropagation();
							toast.dismiss(t);
						}}
						className="p-0.5 hover:bg-white/10 rounded-full transition-colors ml-1"
					>
						<X className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
					</button>
				</div>

				{/* Avatar with Ring/Glow and Status Indicator */}
				<div className="relative shrink-0 mt-1">
					<div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full blur-[2px] opacity-40 group-hover:opacity-100 transition-opacity" />
					<img 
						src={notification.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"} 
						alt={notification.senderName || "User"} 
						className="relative w-11 h-11 rounded-full object-cover border border-zinc-950" 
					/>
					<span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
				</div>

				{/* Text contents */}
				<div className="flex-1 min-w-0 pr-8 mt-1">
					<p className="text-[13px] font-bold text-white truncate tracking-tight">
						{notification.senderName || "New Message"}
					</p>
					<p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-snug">
						{notification.message}
					</p>
				</div>
			</div>
		), { duration: 5000, position: 'top-center' });
	} else {
		// Standard custom fallback toast with matching premium style
		toast.custom((t) => (
			<div 
				className="group relative flex w-full max-w-sm md:w-[350px] bg-zinc-950/95 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 gap-3.5 items-center cursor-pointer hover:bg-zinc-900/60 transition-all duration-300 select-none overflow-hidden"
				onClick={() => {
					toast.dismiss(t);
					window.location.href = "/notifications";
				}}
			>
				{/* Top-right close button */}
				<div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
					<button 
						onClick={(e) => {
							e.stopPropagation();
							toast.dismiss(t);
						}}
						className="p-0.5 hover:bg-white/10 rounded-full transition-colors"
					>
						<X className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
					</button>
				</div>

				{/* Icon/Avatar with ring */}
				<div className="relative shrink-0">
					{notification.senderAvatar ? (
						<>
							<div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full blur-[2px] opacity-40 group-hover:opacity-100 transition-opacity" />
							<img 
								src={notification.senderAvatar} 
								alt={notification.senderName || "User"} 
								className="relative w-11 h-11 rounded-full object-cover border border-zinc-950" 
							/>
						</>
					) : (
						<div className="w-11 h-11 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
							<Bell className="w-5 h-5" />
						</div>
					)}
				</div>

				{/* Text contents */}
				<div className="flex-1 min-w-0 pr-6">
					<p className="text-[13px] font-bold text-white truncate tracking-tight">
						{notification.title}
					</p>
					<p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-snug">
						{notification.message}
					</p>
				</div>
			</div>
		), { duration: 5000, position: 'top-center' });
	}
};
