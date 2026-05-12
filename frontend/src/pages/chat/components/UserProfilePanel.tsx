import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import type { User } from "@/types";
import { Users, Info, ArrowLeft, MessageCircle, UserPlus, UserMinus, Music2, Mic2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { cn } from "@/lib/utils";

interface UserProfilePanelProps {
	user: User;
	onClose: () => void;
	isMainView?: boolean;
}

export const UserProfilePanel = ({ user, onClose, isMainView = false }: UserProfilePanelProps) => {
	const { getMutualFriends, onlineUsers, setViewState, sendFriendRequest, removeFriend, setSelectedUser, profileSource } = useChatStore();
	const [mutualFriends, setMutualFriends] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showMutuals, setShowMutuals] = useState(false);

	const isOnline = onlineUsers.has(user.clerkId);

	useEffect(() => {
		const fetchMutuals = async () => {
			setIsLoading(true);
			const friends = await getMutualFriends(user.clerkId);
			setMutualFriends(friends);
			setIsLoading(false);
		};
		fetchMutuals();
	}, [user.clerkId, getMutualFriends]);

	const handleMessageClick = () => {
		setViewState('chat');
	};

	const handleFollowClick = async () => {
		if (user.isFriend) {
			await removeFriend(user.clerkId);
		} else if (!user.isSent && !user.isPending) {
			await sendFriendRequest(user.clerkId);
		}
	};

	return (
		<div className={cn(
            "flex flex-col h-full bg-zinc-950 transition-all duration-300",
            isMainView ? "w-full" : "w-full sm:w-[350px] border-l border-zinc-800"
        )}>
			<div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-zinc-900/50 sticky top-0 z-10">
				<div className="flex items-center gap-2">
					{/* Show X (close/dismiss) when opened from Discover, ArrowLeft when from chat */}
					{isMainView && profileSource === 'discover' ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSelectedUser(null)}
							className="mr-1 text-zinc-400 hover:text-white rounded-full"
						>
							<X className="size-5" />
						</Button>
					) : (
						<Button variant="ghost" size="icon" onClick={onClose} className="mr-1 text-zinc-400 hover:text-white rounded-full">
							<ArrowLeft className="size-5" />
						</Button>
					)}
					{isMainView ? (
						<h3 className="font-bold text-white text-lg tracking-tight">Profile Detail</h3>
					) : (
						<>
							<Info className="size-5 text-emerald-500" />
							<h3 className="font-medium text-white">Profile Info</h3>
						</>
					)}
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className={cn(
                    "flex flex-col items-center",
                    isMainView ? "p-8 md:p-12 max-w-4xl mx-auto" : "p-6"
                )}>
					{/* Avatar Section */}
					<div className={cn("relative mb-6 group flex items-center justify-center", isMainView ? "mb-8" : "mb-4")}>
						{isMainView ? (
							<div className="relative">
								<div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition duration-500 animate-pulse" />
								<Avatar className="relative size-40 md:size-48 border-4 border-zinc-950 shadow-2xl z-10">
									<AvatarImage src={user.imageUrl} className="object-cover" />
									<AvatarFallback className="text-6xl font-bold bg-zinc-800 text-zinc-400">{user.fullName[0]}</AvatarFallback>
								</Avatar>
							</div>
						) : (
							<Avatar className="size-32 border-4 border-zinc-900 shadow-xl">
								<AvatarImage src={user.imageUrl} className="object-cover" />
								<AvatarFallback className="text-4xl bg-zinc-800 text-zinc-400">{user.fullName[0]}</AvatarFallback>
							</Avatar>
						)}
						<div
							className={`absolute bottom-3 right-3 size-6 rounded-full border-4 border-zinc-950 shadow-sm transition-colors duration-500
								${isOnline ? "bg-emerald-500" : "bg-zinc-500"}`}
						/>
					</div>

					{/* Name and Bio */}
					<h2 className={cn(
                        "font-bold text-white tracking-tight mb-1 text-center",
                        isMainView ? "text-3xl md:text-4xl" : "text-xl"
                    )}>
                        {user.fullName}
                    </h2>
					{user.username && (
                        <p className={cn(
                            "text-zinc-400 mb-6 font-medium",
                            isMainView ? "text-lg" : "text-sm"
                        )}>
                            @{user.username}
                        </p>
                    )}
					
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 w-full max-w-xs justify-center mb-8">
                        <Button 
                            onClick={handleMessageClick}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                        >
                            <MessageCircle className="size-4 mr-2" />
                            Message
                        </Button>
                        <Button 
                            onClick={handleFollowClick}
                            variant={user.isFriend ? "outline" : "default"}
                            className={cn(
                                "flex-1 rounded-xl transition-all active:scale-95",
                                user.isFriend 
                                    ? "bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white" 
                                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                            )}
                        >
                            {user.isFriend ? (
                                <><UserMinus className="size-4 mr-2" /> Following</>
                            ) : user.isSent ? (
                                "Requested"
                            ) : user.isPending ? (
                                "Accept"
                            ) : (
                                <><UserPlus className="size-4 mr-2" /> Follow</>
                            )}
                        </Button>
                    </div>

					{user.bio && (
						<p className={cn(
                            "text-center px-4 mb-8 leading-relaxed italic text-zinc-300/80",
                            isMainView ? "text-base max-w-lg" : "text-sm"
                        )}>
							"{user.bio}"
						</p>
					)}

					{/* Stats Grid */}
					<div className={cn(
                        "flex w-full justify-center border-y border-white/5",
                        isMainView ? "gap-8 md:gap-16 mb-8 py-6 max-w-2xl" : "gap-4 sm:gap-6 mb-6 py-4 flex-wrap"
                    )}>
						<div className="text-center group min-w-[70px]">
							<p className={cn("font-bold text-white group-hover:text-emerald-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>{user.friends?.length || 0}</p>
							<p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-medium">Followers</p>
						</div>
                        <div className="text-center group min-w-[70px]">
							<p className={cn("font-bold text-white group-hover:text-indigo-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>{user.friends?.length || 0}</p>
							<p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-medium">Following</p>
						</div>
						<div 
							className="text-center cursor-pointer group min-w-[70px]"
							onClick={() => setShowMutuals(!showMutuals)}
						>
							<p className={cn("font-bold text-white group-hover:text-amber-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>
								{user.mutualFriendsCount || mutualFriends.length}
							</p>
							<p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-medium">Mutuals</p>
						</div>
					</div>

                    {/* Music Identity */}
                    {(user.favoriteSong || user.favoriteArtist) && (
                        <div className="w-full max-w-2xl bg-zinc-900/50 rounded-2xl border border-white/5 p-6 mb-8 flex flex-col md:flex-row gap-6 justify-around">
                            {user.favoriteSong && (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <Music2 className="size-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Favorite Song</p>
                                        <p className="text-white font-medium">{user.favoriteSong}</p>
                                    </div>
                                </div>
                            )}
                            {user.favoriteArtist && (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <Mic2 className="size-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Favorite Artist</p>
                                        <p className="text-white font-medium">{user.favoriteArtist}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

					{/* Mutual Friends List */}
					{showMutuals && (
						<div className={cn(
                            "w-full animate-in fade-in slide-in-from-top-4 duration-300",
                            isMainView ? "max-w-2xl" : ""
                        )}>
							<div className="flex items-center gap-2 mb-4 px-1">
								<Users className="size-4 text-emerald-500" />
								<h4 className="text-sm font-bold text-white uppercase tracking-wider">Mutual Followers</h4>
							</div>
							
							{isLoading ? (
								<p className="text-sm text-zinc-500 text-center py-6">Loading mutuals...</p>
							) : mutualFriends.length === 0 ? (
								<div className="py-8 bg-zinc-900/30 rounded-2xl border border-white/5 text-center">
                                    <p className="text-sm text-zinc-500">No mutual followers</p>
                                </div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									{mutualFriends.map(mutual => (
										<div key={mutual.clerkId} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-transparent hover:border-white/5 transition-all cursor-pointer group">
											<Avatar className="size-10 border border-zinc-700 shadow-sm group-hover:border-emerald-500/50 transition-colors">
												<AvatarImage src={mutual.imageUrl} />
												<AvatarFallback className="bg-zinc-800 text-zinc-400">{mutual.fullName[0]}</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{mutual.fullName}</p>
												{mutual.username && <p className="text-xs text-zinc-500 truncate mt-0.5">@{mutual.username}</p>}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
