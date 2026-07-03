import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@clerk/clerk-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import type { User } from "@/types";
import { Users, ArrowLeft, MessageCircle, UserPlus, UserMinus, Music2, Mic2, X, UserCheck, Flame, Network, Activity } from "lucide-react";
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
	const [activeTab, setActiveTab] = useState<'vibe' | 'match'>('vibe');

	const isOnline = onlineUsers.has(user.clerkId);
	const hasMatchData = user.similarityScore !== undefined || !!user.matchDetails;

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
			"flex flex-col h-full bg-[#030303]/45 backdrop-blur-md transition-all duration-300",
			isMainView ? "w-full" : "w-full sm:w-[350px] border-l border-zinc-900"
		)}>
			{/* Top Bar Navigation */}
			<div className="p-4 border-b border-zinc-900 flex items-center justify-between backdrop-blur-md bg-transparent sticky top-0 z-10">
				<div className="flex items-center gap-2">
					{isMainView && profileSource === 'discover' ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setSelectedUser(null)}
							className="mr-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
						>
							<X className="size-4.5" />
						</Button>
					) : (
						<Button 
							variant="ghost" 
							size="icon" 
							onClick={onClose} 
							className="mr-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
						>
							<ArrowLeft className="size-4.5" />
						</Button>
					)}
					<h3 className="font-semibold text-zinc-200 text-sm tracking-wide uppercase text-[11px]">
						{isMainView ? "Profile Detail" : "Profile Info"}
					</h3>
				</div>
			</div>

			<ScrollArea className="flex-1 bg-transparent">
				<div className={cn(
					"flex flex-col",
					isMainView ? "p-8 md:p-12 max-w-4xl mx-auto items-stretch" : "p-5 items-center"
				)}>
					
					{/* Header Section */}
					{isMainView ? (
						/* Horizontal Desktop Layout */
						<div className="w-full flex flex-col md:flex-row gap-8 items-start mb-10 pb-10 border-b border-zinc-900">
							{/* Large Avatar */}
							<div className="relative shrink-0 mx-auto md:mx-0">
								<div className="relative">
									<div className="absolute -inset-1.5 bg-gradient-to-tr from-zinc-800 via-zinc-900 to-zinc-800 rounded-full border border-zinc-900" />
									<Avatar className="relative size-32 md:size-36 border-4 border-zinc-955 shadow-2xl z-10">
										<AvatarImage src={user.imageUrl} className="object-cover" />
										<AvatarFallback className="text-5xl font-light bg-zinc-900 text-zinc-500">{user.fullName[0]}</AvatarFallback>
									</Avatar>
								</div>
								<div className={cn(
									"absolute bottom-2 right-2 size-4.5 rounded-full border-4 border-zinc-955 shadow-sm z-20",
									isOnline ? "bg-emerald-500" : "bg-zinc-650"
								)} />
							</div>

							{/* User details and buttons */}
							<div className="flex-1 flex flex-col gap-5 text-center md:text-left w-full">
								<div className="flex flex-col md:flex-row md:items-center gap-4 justify-between flex-wrap">
									<div>
										<h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100">{user.fullName}</h2>
										{user.username && <p className="text-zinc-500 text-sm mt-0.5">@{user.username}</p>}
									</div>
									{user.clerkId !== userId && (
										<div className="flex items-center gap-2 justify-center md:justify-start">
											<Button 
												onClick={handleFollowClick}
												onMouseEnter={() => setIsHoveringFollow(true)}
												onMouseLeave={() => setIsHoveringFollow(false)}
												variant={user.isFriend ? "outline" : "default"}
												className={cn(
													"h-9 px-4 rounded-lg transition-all font-medium text-xs tracking-wide",
													user.isFriend 
														? (isHoveringFollow ? "bg-red-550/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850")
														: "bg-blue-600 hover:bg-blue-700 text-white border-0"
												)}
											>
												{user.isFriend ? (
													isHoveringFollow ? <><UserMinus className="size-3.5 mr-1.5" /> Unfollow</> : <><UserCheck className="size-3.5 mr-1.5" /> Following</>
												) : user.isSent ? (
													"Requested"
												) : user.isPending ? (
													"Accept"
												) : (
													<><UserPlus className="size-3.5 mr-1.5" /> Follow</>
												)}
											</Button>
											<Button 
												onClick={handleMessageClick}
												disabled={!user.isFriend}
												className="h-9 px-4 rounded-lg transition-all font-medium text-xs tracking-wide bg-white hover:bg-zinc-200 text-black hover:text-black border-0 disabled:bg-white disabled:text-black disabled:opacity-40 disabled:cursor-not-allowed"
											>
												<MessageCircle className="size-3.5 mr-1.5" />
												Message
											</Button>
										</div>
									)}
								</div>

								{/* Stats row */}
								<div className="flex justify-center md:justify-start gap-10 border-t border-zinc-900/60 pt-4">
									<Dialog open={isFollowersModalOpen} onOpenChange={setIsFollowersModalOpen}>
										<DialogTrigger asChild>
											<div className="cursor-pointer group flex items-baseline gap-1.5">
												<span className="font-semibold text-zinc-100 text-base group-hover:text-zinc-300 transition-colors">{user.friends?.length || 0}</span>
												<span className="text-zinc-500 text-xs font-normal">followers</span>
											</div>
										</DialogTrigger>
										{/* Followers Dialog Content */}
										<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
													<Users className="size-4 text-zinc-500" />
													Followers
												</DialogTitle>
											</DialogHeader>
											<ScrollArea className="max-h-[60vh] mt-2">
												{isLoading ? (
													<div className="flex justify-center py-8">
														<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
													</div>
												) : userFriends.length === 0 ? (
													<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
														<p className="text-xs text-zinc-500 font-medium">No followers</p>
													</div>
												) : (
													<div className="flex flex-col gap-1 pr-4 pb-4">
														{userFriends.map(friend => (
															<div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
																<div 
																	className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																	onClick={() => { 
																		setIsFollowersModalOpen(false); 
																		setSelectedUser(friend, 'profile'); 
																	}}
																>
																	<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																		<AvatarImage src={friend.imageUrl} />
																		<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{friend.fullName[0]}</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{friend.fullName}</p>
																		{friend.username && <p className="text-[10px] text-zinc-500 truncate">@{friend.username}</p>}
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
											<div className="cursor-pointer group flex items-baseline gap-1.5">
												<span className="font-semibold text-zinc-100 text-base group-hover:text-zinc-300 transition-colors">{user.friends?.length || 0}</span>
												<span className="text-zinc-500 text-xs font-normal">following</span>
											</div>
										</DialogTrigger>
										{/* Following Dialog Content */}
										<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
													<Users className="size-4 text-zinc-500" />
													Following
												</DialogTitle>
											</DialogHeader>
											<ScrollArea className="max-h-[60vh] mt-2">
												{isLoading ? (
													<div className="flex justify-center py-8">
														<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
													</div>
												) : userFriends.length === 0 ? (
													<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
														<p className="text-xs text-zinc-500 font-medium">Not following anyone</p>
													</div>
												) : (
													<div className="flex flex-col gap-1 pr-4 pb-4">
														{userFriends.map(friend => (
															<div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
																<div 
																	className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																	onClick={() => { 
																		setIsFollowingModalOpen(false); 
																		setSelectedUser(friend, 'profile'); 
																	}}
																>
																	<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																		<AvatarImage src={friend.imageUrl} />
																		<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{friend.fullName[0]}</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{friend.fullName}</p>
																		{friend.username && <p className="text-[10px] text-zinc-500 truncate">@{friend.username}</p>}
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
											<div className="cursor-pointer group flex items-baseline gap-1.5">
												<span className="font-semibold text-zinc-100 text-base group-hover:text-zinc-300 transition-colors">
													{user.mutualFriendsCount || mutualFriends.length}
												</span>
												<span className="text-zinc-500 text-xs font-normal">mutuals</span>
											</div>
										</DialogTrigger>
										{/* Mutuals Dialog Content */}
										<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
											<DialogHeader>
												<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
													<Users className="size-4 text-zinc-500" />
													Mutual Followers
												</DialogTitle>
											</DialogHeader>
											<ScrollArea className="max-h-[60vh] mt-2">
												{isLoading ? (
													<div className="flex justify-center py-8">
														<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
													</div>
												) : mutualFriends.length === 0 ? (
													<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
														<p className="text-xs text-zinc-500 font-medium">No mutual followers</p>
													</div>
												) : (
													<div className="flex flex-col gap-1 pr-4 pb-4">
														{mutualFriends.map(mutual => (
															<div key={mutual.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
																<div 
																	className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																	onClick={() => { 
																		setIsMutualsModalOpen(false); 
																		setSelectedUser(mutual, 'profile'); 
																	}}
																>
																	<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																		<AvatarImage src={mutual.imageUrl} />
																		<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{mutual.fullName[0]}</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{mutual.fullName}</p>
																		{mutual.username && <p className="text-[10px] text-zinc-500 truncate">@{mutual.username}</p>}
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

								{/* Biography */}
								{user.bio && (
									<p className="text-zinc-300 text-sm leading-relaxed max-w-xl italic font-light">
										"{user.bio}"
									</p>
								)}
							</div>
						</div>
					) : (
						/* Compact Sidebar Layout */
						<div className="flex flex-col items-center w-full mb-6 pb-6 border-b border-zinc-900">
							{/* Sidebar Avatar */}
							<div className="relative mb-5 flex items-center justify-center">
								<div className="relative">
									<div className="absolute -inset-1 bg-gradient-to-tr from-zinc-800/40 via-zinc-900/20 to-zinc-800/40 rounded-full border border-zinc-900" />
									<Avatar className="size-24 border-4 border-zinc-950 shadow-xl relative z-10">
										<AvatarImage src={user.imageUrl} className="object-cover" />
										<AvatarFallback className="text-3xl bg-zinc-900 text-zinc-500 font-light">{user.fullName[0]}</AvatarFallback>
									</Avatar>
								</div>
								<div className={cn(
									"absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-zinc-955 shadow-sm z-20",
									isOnline ? "bg-emerald-500" : "bg-zinc-650"
								)} />
							</div>

							<h2 className="text-lg font-semibold text-zinc-100 text-center">{user.fullName}</h2>
							{user.username && <p className="text-zinc-500 text-xs text-center mt-0.5">@{user.username}</p>}

							{/* Sidebar action buttons */}
							{user.clerkId !== userId && (
								<div className="flex gap-2 w-full max-w-[260px] mx-auto mt-4">
									<Button 
										onClick={handleFollowClick}
										onMouseEnter={() => setIsHoveringFollow(true)}
										onMouseLeave={() => setIsHoveringFollow(false)}
										variant={user.isFriend ? "outline" : "default"}
										className={cn(
											"flex-1 h-9 rounded-lg transition-all font-medium text-xs tracking-wide",
											user.isFriend 
												? (isHoveringFollow ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850")
												: "bg-blue-600 hover:bg-blue-700 text-white border-0"
										)}
									>
										{user.isFriend ? (
											isHoveringFollow ? <><UserMinus className="size-3.5 mr-1" /> Unfollow</> : <><UserCheck className="size-3.5 mr-1" /> Following</>
										) : user.isSent ? (
											"Requested"
										) : user.isPending ? (
											"Accept"
										) : (
											<><UserPlus className="size-3.5 mr-1" /> Follow</>
										)}
									</Button>
									<Button 
										onClick={handleMessageClick}
										disabled={!user.isFriend}
										className="flex-1 h-9 rounded-lg transition-all font-medium text-xs tracking-wide bg-white hover:bg-zinc-200 text-black hover:text-black border-0 disabled:bg-white disabled:text-black disabled:opacity-40 disabled:cursor-not-allowed"
									>
										<MessageCircle className="size-3.5 mr-1" />
										Message
									</Button>
								</div>
							)}

							{user.bio && (
								<p className="text-zinc-400 text-xs leading-relaxed text-center italic mt-4 px-2">
									"{user.bio}"
								</p>
							)}

							{/* Sidebar Stats Row */}
							<div className="flex justify-center gap-6 border-y border-zinc-900 py-3.5 my-5 w-full bg-zinc-900/10">
								<Dialog open={isFollowersModalOpen} onOpenChange={setIsFollowersModalOpen}>
									<DialogTrigger asChild>
										<div className="text-center cursor-pointer group min-w-[50px]">
											<p className="font-semibold text-zinc-200 text-sm group-hover:text-zinc-100 transition-colors">{user.friends?.length || 0}</p>
											<p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">followers</p>
										</div>
									</DialogTrigger>
									<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
										<DialogHeader>
											<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
												<Users className="size-4 text-zinc-500" />
												Followers
											</DialogTitle>
										</DialogHeader>
										<ScrollArea className="max-h-[60vh] mt-2">
											{isLoading ? (
												<div className="flex justify-center py-8">
													<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
												</div>
											) : userFriends.length === 0 ? (
												<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
													<p className="text-xs text-zinc-500 font-medium">No followers</p>
												</div>
											) : (
												<div className="flex flex-col gap-1 pr-4 pb-4">
													{userFriends.map(friend => (
														<div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
															<div 
																className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																onClick={() => { 
																	setIsFollowersModalOpen(false); 
																	setSelectedUser(friend, 'profile'); 
																}}
															>
																<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																	<AvatarImage src={friend.imageUrl} />
																	<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{friend.fullName[0]}</AvatarFallback>
																</Avatar>
																<div className="flex-1 min-w-0">
																	<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{friend.fullName}</p>
																	{friend.username && <p className="text-[10px] text-zinc-500 truncate">@{friend.username}</p>}
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
										<div className="text-center cursor-pointer group min-w-[50px]">
											<p className="font-semibold text-zinc-200 text-sm group-hover:text-zinc-100 transition-colors">{user.friends?.length || 0}</p>
											<p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">following</p>
										</div>
									</DialogTrigger>
									<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
										<DialogHeader>
											<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
												<Users className="size-4 text-zinc-500" />
												Following
											</DialogTitle>
										</DialogHeader>
										<ScrollArea className="max-h-[60vh] mt-2">
											{isLoading ? (
												<div className="flex justify-center py-8">
													<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
												</div>
											) : userFriends.length === 0 ? (
												<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
													<p className="text-xs text-zinc-500 font-medium">Not following anyone</p>
												</div>
											) : (
												<div className="flex flex-col gap-1 pr-4 pb-4">
													{userFriends.map(friend => (
														<div key={friend.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
															<div 
																className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																onClick={() => { 
																	setIsFollowingModalOpen(false); 
																	setSelectedUser(friend, 'profile'); 
																}}
															>
																<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																	<AvatarImage src={friend.imageUrl} />
																	<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{friend.fullName[0]}</AvatarFallback>
																</Avatar>
																<div className="flex-1 min-w-0">
																	<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{friend.fullName}</p>
																	{friend.username && <p className="text-[10px] text-zinc-500 truncate">@{friend.username}</p>}
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
										<div className="text-center cursor-pointer group min-w-[50px]">
											<p className="font-semibold text-zinc-200 text-sm group-hover:text-zinc-100 transition-colors">{user.mutualFriendsCount || mutualFriends.length}</p>
											<p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">mutuals</p>
										</div>
									</DialogTrigger>
									<DialogContent className="sm:max-w-md bg-[#09090b] border-zinc-900 text-white shadow-2xl backdrop-blur-xl rounded-2xl p-5">
										<DialogHeader>
											<DialogTitle className="flex items-center gap-2 text-md font-semibold tracking-wide uppercase text-[11px] text-zinc-400">
												<Users className="size-4 text-zinc-500" />
												Mutual Followers
											</DialogTitle>
										</DialogHeader>
										<ScrollArea className="max-h-[60vh] mt-2">
											{isLoading ? (
												<div className="flex justify-center py-8">
													<div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
												</div>
											) : mutualFriends.length === 0 ? (
												<div className="py-8 bg-zinc-900/20 rounded-xl border border-zinc-900 text-center mt-2">
													<p className="text-xs text-zinc-500 font-medium">No mutual followers</p>
												</div>
											) : (
												<div className="flex flex-col gap-1 pr-4 pb-4">
													{mutualFriends.map(mutual => (
														<div key={mutual.clerkId} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors group">
															<div 
																className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" 
																onClick={() => { 
																	setIsMutualsModalOpen(false); 
																	setSelectedUser(mutual, 'profile'); 
																}}
															>
																<Avatar className="size-10 border border-zinc-800 shadow-sm transition-colors group-hover:border-zinc-700">
																	<AvatarImage src={mutual.imageUrl} />
																	<AvatarFallback className="bg-zinc-900 text-zinc-500 font-medium text-sm">{mutual.fullName[0]}</AvatarFallback>
																</Avatar>
																<div className="flex-1 min-w-0">
																	<p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-zinc-100 transition-colors">{mutual.fullName}</p>
																	{mutual.username && <p className="text-[10px] text-zinc-500 truncate">@{mutual.username}</p>}
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
						</div>
					)}

					{/* Tab Navigation selectors */}
					{hasMatchData && (
						<div className="w-full border-t border-zinc-900/60 flex justify-center gap-10 mb-6">
							<button 
								onClick={() => setActiveTab('vibe')}
								className={cn(
									"flex items-center gap-1.5 py-3 text-[10px] font-semibold uppercase tracking-widest border-t-2 -mt-[1px] transition-all",
									activeTab === 'vibe' ? "border-zinc-200 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
								)}
							>
								<Music2 className="size-3.5" />
								Music Vibe
							</button>
							<button 
								onClick={() => setActiveTab('match')}
								className={cn(
									"flex items-center gap-1.5 py-3 text-[10px] font-semibold uppercase tracking-widest border-t-2 -mt-[1px] transition-all",
									activeTab === 'match' ? "border-zinc-200 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
								)}
							>
								<Users className="size-3.5" />
								Taste Match
							</button>
						</div>
					)}

					{/* Tab Contents */}
					{activeTab === 'vibe' ? (
						/* Music Vibe Content */
						<div className={cn(
							"grid gap-4 w-full",
							isMainView ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 px-1"
						)}>
							{user.favoriteSong ? (
								<div className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 transition-all">
									<div className="size-12 bg-zinc-950 border border-zinc-800/40 rounded-lg flex items-center justify-center shrink-0">
										<Music2 className="size-5 text-zinc-400" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Favorite Track</p>
										<p className="text-zinc-200 font-medium text-xs truncate">{user.favoriteSong.split(' - ')[0] || user.favoriteSong}</p>
										{user.favoriteSong.split(' - ')[1] && (
											<p className="text-zinc-500 text-[10px] truncate mt-0.5">{user.favoriteSong.split(' - ')[1]}</p>
										)}
									</div>
								</div>
							) : (
								<div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-xl p-4 flex items-center justify-center text-center">
									<p className="text-[10px] text-zinc-500 uppercase tracking-widest">No Favorite Track</p>
								</div>
							)}

							{user.favoriteArtist ? (
								<div className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 transition-all">
									<div className="size-12 bg-zinc-950 border border-zinc-800/40 rounded-lg flex items-center justify-center shrink-0">
										<Mic2 className="size-5 text-zinc-400" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">Favorite Artist</p>
										<p className="text-zinc-200 font-medium text-xs truncate">{user.favoriteArtist}</p>
										<p className="text-zinc-500 text-[10px] mt-0.5 truncate">Taste Match aligned</p>
									</div>
								</div>
							) : (
								<div className="bg-zinc-900/10 border border-dashed border-zinc-800 rounded-xl p-4 flex items-center justify-center text-center">
									<p className="text-[10px] text-zinc-500 uppercase tracking-widest">No Favorite Artist</p>
								</div>
							)}
						</div>
					) : (
						/* Taste Match Tab Content */
						<div className="w-full flex flex-col gap-5">
							{/* Compatibility score percentage */}
							<div className="flex flex-col items-center justify-center p-5 bg-zinc-900/10 border border-zinc-900 rounded-xl max-w-2xl mx-auto w-full text-center">
								<span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Acoustic Compatibility</span>
								<div className="text-3xl md:text-4xl font-extrabold text-zinc-200 tracking-tighter">
									{Math.round(user.similarityScore || 0)}%
								</div>
								<span className="text-zinc-400 text-[10px] mt-0.5">Music taste similarity</span>
							</div>

							{/* Narrative Quote block */}
							{user.matchDetails?.narrative_summary && (
								<div className="p-4 border-l border-zinc-700 bg-zinc-900/10 rounded-r-xl max-w-2xl mx-auto w-full">
									<p className="text-zinc-300 text-xs italic font-normal leading-relaxed">
										"{user.matchDetails.narrative_summary}"
									</p>
								</div>
							)}

							{/* Progress Bar Grid */}
							<div className={cn(
								"grid gap-4 w-full",
								isMainView ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 px-1"
							)}>
								{/* Sync Breakdown */}
								{user.matchDetails?.signal_breakdown && (
									<div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 space-y-3.5">
										<div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-widest border-b border-zinc-900 pb-2">
											<Network size={12} className="text-zinc-500" />
											Sync Breakdown
										</div>
										{[
											{ label: 'Genre Sync', val: user.matchDetails.signal_breakdown.genre_overlap },
											{ label: 'Audio Sync', val: user.matchDetails.signal_breakdown.audio_similarity },
											{ label: 'Mood Alignment', val: user.matchDetails.signal_breakdown.mood_alignment }
										].map(signal => {
											if (signal.val === undefined) return null;
											return (
												<div key={signal.label} className="space-y-1">
													<div className="flex justify-between text-[10px]">
														<span className="text-zinc-500">{signal.label}</span>
														<span className="text-zinc-300 font-semibold">{Math.round(signal.val * 100)}%</span>
													</div>
													<div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
														<div className="h-full bg-zinc-300 rounded-full" style={{ width: `${signal.val * 100}%` }} />
													</div>
												</div>
											);
										})}
									</div>
								)}

								{/* Audio DNA */}
								{user.matchDetails?.audioMatch && (
									<div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 space-y-3.5">
										<div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-widest border-b border-zinc-900 pb-2">
											<Activity size={12} className="text-zinc-500" />
											Audio DNA Sync
										</div>
										{[
											{ label: 'Energy Sync', val: user.matchDetails.audioMatch.energy },
											{ label: 'Vibe Sync', val: user.matchDetails.audioMatch.valence },
											{ label: 'Acoustic Sync', val: user.matchDetails.audioMatch.acousticness }
										].map(feature => {
											if (feature.val === undefined) return null;
											return (
												<div key={feature.label} className="space-y-1">
													<div className="flex justify-between text-[10px]">
														<span className="text-zinc-500">{feature.label}</span>
														<span className="text-zinc-300 font-semibold">{feature.val}%</span>
													</div>
													<div className="w-full h-1 bg-zinc-950 rounded-full overflow-hidden">
														<div className="h-full bg-zinc-300 rounded-full" style={{ width: `${feature.val}%` }} />
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>

							{/* Anthems & Artists */}
							<div className={cn(
								"grid gap-4 w-full",
								isMainView ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 px-1"
							)}>
								{/* Shared Anthems */}
								{user.matchDetails?.topSongs && user.matchDetails.topSongs.length > 0 && (
									<div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 space-y-3">
										<div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-widest border-b border-zinc-900 pb-2">
											<Flame size={12} className="text-zinc-500" />
											Shared Anthems
										</div>
										<div className="space-y-2.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
											{user.matchDetails.topSongs.slice(0, 3).map((song) => (
												<div key={song.id} className="flex justify-between items-center text-[11px]">
													<div className="min-w-0 flex-1">
														<p className="font-medium text-zinc-200 truncate">{song.title}</p>
														<p className="text-[9px] text-zinc-500 truncate">{song.artist}</p>
													</div>
													<span className="text-[9px] font-mono text-zinc-500 shrink-0 ml-2">
														{song.playsA}x vs {song.playsB}x
													</span>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Shared Artists */}
								{user.matchDetails?.topArtists && user.matchDetails.topArtists.length > 0 && (
									<div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 space-y-3">
										<div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-semibold uppercase tracking-widest border-b border-zinc-900 pb-2">
											<Mic2 size={12} className="text-zinc-500" />
											Shared Artists
										</div>
										<div className="flex flex-wrap gap-1.5">
											{user.matchDetails.topArtists.slice(0, 6).map((artist, idx) => (
												<span key={idx} className="text-[9px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
													{artist.name}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};
