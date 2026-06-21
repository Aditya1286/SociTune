import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@clerk/clerk-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import type { User } from "@/types";
import { Users, Info, ArrowLeft, MessageCircle, UserPlus, UserMinus, Music2, Mic2, X, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FriendButton } from "@/components/FriendButton";

import { cn } from "@/lib/utils";

interface UserProfilePanelProps {
	user: User;
	onClose: () => void;
	isMainView?: boolean;
}

export const UserProfilePanel = ({ user, onClose, isMainView = false }: UserProfilePanelProps) => {
	const { userId } = useAuth();
	const { getMutualFriends, getUserFriends, onlineUsers, setViewState, sendFriendRequest, removeFriend, setSelectedUser, profileSource } = useChatStore();
	const [mutualFriends, setMutualFriends] = useState<User[]>([]);
	const [userFriends, setUserFriends] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isMutualsModalOpen, setIsMutualsModalOpen] = useState(false);
	const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
	const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
	const [isHoveringFollow, setIsHoveringFollow] = useState(false);

	const isOnline = onlineUsers.has(user.clerkId);

	useEffect(() => {
		const fetchFriendsData = async () => {
			setIsLoading(true);
			const [mutuals, friends] = await Promise.all([
				getMutualFriends(user.clerkId),
				getUserFriends(user.clerkId)
			]);
			setMutualFriends(mutuals);
			setUserFriends(friends);
			setIsLoading(false);
		};
		fetchFriendsData();
	}, [user.clerkId, getMutualFriends, getUserFriends]);

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
            "flex flex-col h-full bg-[#0a0a0c]/60 backdrop-blur-md transition-all duration-300",
            isMainView ? "w-full" : "w-full sm:w-[350px] border-l border-white/[0.04]"
        )}>
			<div className="p-4 border-b border-white/[0.04] flex items-center justify-between backdrop-blur-md bg-transparent sticky top-0 z-10">
				<div className="flex items-center gap-2">
					{/* Show X (close/dismiss) when opened from Discover, ArrowLeft when from chat */}
					{isMainView && profileSource === 'discover' ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSelectedUser(null)}
							className="mr-1 text-zinc-400 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all"
						>
							<X className="size-5" />
						</Button>
					) : (
						<Button variant="ghost" size="icon" onClick={onClose} className="mr-1 text-zinc-400 hover:text-white rounded-full hover:scale-105 active:scale-95 transition-all">
							<ArrowLeft className="size-5" />
						</Button>
					)}
					{isMainView ? (
						<h3 className="font-bold text-white text-lg tracking-tight">Profile Detail</h3>
					) : (
						<>
							<Info className="size-5 text-emerald-500" />
							<h3 className="font-semibold text-white">Profile Info</h3>
						</>
					)}
				</div>
			</div>

			<ScrollArea className="flex-1 bg-transparent">
				<div className={cn(
                    "flex flex-col items-center",
                    isMainView ? "p-8 md:p-12 max-w-4xl mx-auto" : "p-6"
                )}>
					{/* Avatar Section */}
					<div className={cn("relative mb-6 group flex items-center justify-center", isMainView ? "mb-8" : "mb-4")}>
						{isMainView ? (
							<div className="relative">
								<div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition duration-500 animate-pulse" />
								<Avatar className="relative size-40 md:size-44 border-4 border-[#09090b] shadow-2xl z-10">
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
                            "text-zinc-400 mb-6 font-semibold",
                            isMainView ? "text-lg" : "text-sm"
                        )}>
                            @{user.username}
                        </p>
                    )}
					
                    {/* Action Buttons */}
                    {user.clerkId !== userId && (
                        <div className="flex items-center gap-3 w-full max-w-xs justify-center mb-8">
                            <Button 
                                onClick={handleMessageClick}
                                disabled={!user.isFriend}
                                className={cn(
                                    "flex-1 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold text-xs",
                                    user.isFriend 
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/10" 
                                        : "bg-white/5 text-zinc-500 cursor-not-allowed opacity-50"
                                )}
                            >
                                <MessageCircle className="size-4 mr-1.5" />
                                Message
                            </Button>
                            <Button 
                                onClick={handleFollowClick}
                                onMouseEnter={() => setIsHoveringFollow(true)}
                                onMouseLeave={() => setIsHoveringFollow(false)}
                                variant={user.isFriend ? "outline" : "default"}
                                className={cn(
                                    "flex-1 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold text-xs",
                                    user.isFriend 
                                        ? (isHoveringFollow ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-transparent border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white")
                                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10"
                                )}
                            >
                                {user.isFriend ? (
                                    isHoveringFollow ? (
                                        <><UserMinus className="size-4 mr-1.5" /> Unfollow</>
                                    ) : (
                                        <><UserCheck className="size-4 mr-1.5" /> Following</>
                                    )
                                ) : user.isSent ? (
                                    "Requested"
                                ) : user.isPending ? (
                                    "Accept"
                                ) : (
                                    <><UserPlus className="size-4 mr-1.5" /> Follow</>
                                )}
                            </Button>
                        </div>
                    )}

					{user.bio && (
						<p className={cn(
                            "text-center px-4 mb-8 leading-relaxed italic text-zinc-300/80 font-medium",
                            isMainView ? "text-base max-w-lg" : "text-sm"
                        )}>
							"{user.bio}"
						</p>
					)}

					{/* Stats Grid */}
					<div className={cn(
                        "flex w-full justify-center border-y border-white/[0.04] bg-white/[0.01]",
                        isMainView ? "gap-8 md:gap-16 mb-8 py-6 max-w-2xl" : "gap-4 sm:gap-6 mb-6 py-4 flex-wrap"
                    )}>
                        <Dialog open={isFollowersModalOpen} onOpenChange={setIsFollowersModalOpen}>
                            <DialogTrigger asChild>
                                <div className="text-center cursor-pointer group min-w-[70px]">
                                    <p className={cn("font-bold text-white group-hover:text-emerald-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>{user.friends?.length || 0}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">Followers</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-[#121215]/95 border-white/[0.08] text-white shadow-2xl backdrop-blur-xl rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                        <Users className="size-5 text-emerald-500" />
                                        Followers
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh] mt-2">
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : userFriends.length === 0 ? (
                                        <div className="py-8 bg-white/[0.02] rounded-xl border border-white/[0.04] text-center mt-2">
                                            <p className="text-sm text-zinc-500 font-medium">No followers</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 pr-4 pb-4">
                                            {userFriends.map(friend => (
                                                <div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                                    <div 
                                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
                                                        onClick={() => { 
                                                            setIsFollowersModalOpen(false); 
                                                            setSelectedUser(friend, 'profile'); 
                                                        }}
                                                    >
                                                        <Avatar className="size-11 border border-white/[0.08] shadow-sm group-hover:border-emerald-500/30 transition-colors">
                                                            <AvatarImage src={friend.imageUrl} />
                                                            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{friend.fullName[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{friend.fullName}</p>
                                                            {friend.username && <p className="text-[11px] text-zinc-500 truncate">@{friend.username}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 ml-3">
                                                        {friend.clerkId !== userId && <FriendButton user={friend} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isFollowingModalOpen} onOpenChange={setIsFollowingModalOpen}>
                            <DialogTrigger asChild>
                                <div className="text-center cursor-pointer group min-w-[70px]">
                                    <p className={cn("font-bold text-white group-hover:text-indigo-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>{user.friends?.length || 0}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">Following</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-[#121215]/95 border-white/[0.08] text-white shadow-2xl backdrop-blur-xl rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                        <Users className="size-5 text-indigo-500" />
                                        Following
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh] mt-2">
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="size-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : userFriends.length === 0 ? (
                                        <div className="py-8 bg-white/[0.02] rounded-xl border border-white/[0.04] text-center mt-2">
                                            <p className="text-sm text-zinc-500 font-medium">Not following anyone</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 pr-4 pb-4">
                                            {userFriends.map(friend => (
                                                <div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                                    <div 
                                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
                                                        onClick={() => { 
                                                            setIsFollowingModalOpen(false); 
                                                            setSelectedUser(friend, 'profile'); 
                                                        }}
                                                    >
                                                        <Avatar className="size-11 border border-white/[0.08] shadow-sm group-hover:border-indigo-500/30 transition-colors">
                                                            <AvatarImage src={friend.imageUrl} />
                                                            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{friend.fullName[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">{friend.fullName}</p>
                                                            {friend.username && <p className="text-[11px] text-zinc-500 truncate">@{friend.username}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 ml-3">
                                                        {friend.clerkId !== userId && <FriendButton user={friend} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                        
                        <Dialog open={isMutualsModalOpen} onOpenChange={setIsMutualsModalOpen}>
                            <DialogTrigger asChild>
                                <div className="text-center cursor-pointer group min-w-[70px]">
                                    <p className={cn("font-bold text-white group-hover:text-amber-400 transition-colors", isMainView ? "text-2xl" : "text-xl")}>
                                        {user.mutualFriendsCount || mutualFriends.length}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-semibold">Mutuals</p>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-[#121215]/95 border-white/[0.08] text-white shadow-2xl backdrop-blur-xl rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                        <Users className="size-5 text-emerald-500" />
                                        Mutual Followers
                                    </DialogTitle>
                                </DialogHeader>
                                <ScrollArea className="max-h-[60vh] mt-2">
                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="size-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : mutualFriends.length === 0 ? (
                                        <div className="py-8 bg-white/[0.02] rounded-xl border border-white/[0.04] text-center mt-2">
                                            <p className="text-sm text-zinc-500 font-medium">No mutual followers</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 pr-4 pb-4">
                                            {mutualFriends.map(mutual => (
                                                <div key={mutual.clerkId} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                                    <div 
                                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
                                                        onClick={() => { 
                                                            setIsMutualsModalOpen(false); 
                                                            setSelectedUser(mutual, 'profile'); 
                                                        }}
                                                    >
                                                        <Avatar className="size-11 border border-white/[0.08] shadow-sm group-hover:border-emerald-500/30 transition-colors">
                                                            <AvatarImage src={mutual.imageUrl} />
                                                            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{mutual.fullName[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{mutual.fullName}</p>
                                                            {mutual.username && <p className="text-[11px] text-zinc-500 truncate">@{mutual.username}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 ml-3">
                                                        {mutual.clerkId !== userId && <FriendButton user={mutual} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
					</div>

                    {/* Music Identity */}
                    {(user.favoriteSong || user.favoriteArtist) && (
                        <div className="w-full max-w-2xl bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 mb-8 flex flex-col md:flex-row gap-6 justify-around">
                            {user.favoriteSong && (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                                        <Music2 className="size-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Favorite Song</p>
                                        <p className="text-white font-semibold">{user.favoriteSong}</p>
                                    </div>
                                </div>
                            )}
                            {user.favoriteArtist && (
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <Mic2 className="size-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Favorite Artist</p>
                                        <p className="text-white font-semibold">{user.favoriteArtist}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
				</div>
			</ScrollArea>
		</div>
	);
};
