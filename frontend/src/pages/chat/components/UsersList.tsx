import UsersListSkeleton from "@/components/skeletons/UsersListSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { FriendButton } from "@/components/FriendButton";
import type { User } from "@/types";

const UsersList = () => {
	const { users, selectedUser, isLoading, setSelectedUser, onlineUsers, unreadMessages } = useChatStore();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredUsers = users.filter((user: User) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			user.fullName.toLowerCase().includes(query) ||
			(user.username && user.username.toLowerCase().includes(query))
		);
	});

	const friends = filteredUsers.filter((u: User) => u.isFriend);
	const discoverUsers = searchQuery ? filteredUsers : filteredUsers.filter((u: User) => !u.isFriend);

	const renderUser = (user: User, isFriendTab: boolean) => (
		<div
			key={user._id}
			onClick={() => setSelectedUser(user, isFriendTab ? 'chat' : 'profile')}
			className={`flex items-center justify-between gap-3 p-3 w-full min-w-0
				rounded-2xl transition-all duration-200 group cursor-pointer border
				${selectedUser?.clerkId === user.clerkId 
					? "bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-white/[0.05]" 
					: "hover:bg-white/[0.03] border-transparent"}`}
		>
			<div className='flex items-center gap-3 flex-1 min-w-0'>
				<div className='relative shrink-0'>
					<Avatar className='size-10 md:size-11 border border-white/[0.08] shadow-sm'>
						<AvatarImage src={user.imageUrl} />
						<AvatarFallback>{user.fullName[0]}</AvatarFallback>
					</Avatar>
					<div
						className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#0a0a0c]
						${onlineUsers.has(user.clerkId) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-600"}`}
					/>
				</div>

				<div className='flex-1 min-w-0 hidden lg:flex lg:flex-col'>
					<div className="flex items-center gap-2 min-w-0">
					    <span className='font-semibold text-white/90 group-hover:text-white transition-colors text-[13.5px] truncate block'>{user.fullName}</span>
					</div>
					{user.username && <span className="text-[10px] text-zinc-500 truncate block mt-0.5 tracking-wide">@{user.username}</span>}
					{isFriendTab ? (
						<p className={`text-[11px] truncate mt-0.5 ${unreadMessages.get(user.clerkId) ? "text-emerald-400 font-semibold" : "text-zinc-400 font-medium"}`}>
							{unreadMessages.get(user.clerkId) 
                                ? `${unreadMessages.get(user.clerkId)} new message${unreadMessages.get(user.clerkId)! > 1 ? 's' : ''}` 
                                : (user.lastMessage ? user.lastMessage : "Say hi!")}
						</p>
					) : (
						<p className='text-[10px] text-zinc-500 truncate mt-0.5 font-medium'>
							{user.mutualFriendsCount || 0} mutual friends
						</p>
					)}
				</div>
			</div>
			
			<div className="flex items-center gap-2 shrink-0">
				{isFriendTab && unreadMessages.get(user.clerkId) && unreadMessages.get(user.clerkId)! > 0 ? (
					<div className="flex size-5 rounded-full bg-emerald-500 items-center justify-center text-[10px] font-bold text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
						{unreadMessages.get(user.clerkId)}
					</div>
				) : null}

				<div className="hidden lg:block">
					{!isFriendTab && <FriendButton user={user} />}
				</div>
			</div>
			
			{/* Mobile view action button */}
			<div className="lg:hidden shrink-0">
				{!isFriendTab && <FriendButton user={user} />}
			</div>
		</div>
	);

	return (
		<div className='h-full flex flex-col bg-transparent'>
			<div className='p-4 border-b border-white/[0.04]'>
				<div className="relative">
					<Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
					<Input 
						placeholder="Search users..." 
						className="pl-9 bg-white/[0.03] border-white/[0.06] rounded-full focus-visible:ring-emerald-500 text-sm h-9 placeholder:text-zinc-500 font-medium"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Tabs defaultValue="friends" className="flex-1 flex flex-col min-h-0 w-full">
				<div className="px-4 pt-3 shrink-0">
					<TabsList className="w-full bg-black/25 border border-white/[0.04] p-1 rounded-full h-9">
						<TabsTrigger value="friends" className="flex-1 text-xs rounded-full data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-semibold text-zinc-400 hover:text-zinc-200">
							Friends
						</TabsTrigger>
						<TabsTrigger value="discover" className="flex-1 text-xs rounded-full data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-semibold text-zinc-400 hover:text-zinc-200 relative">
							Discover
							{discoverUsers.some((u: User) => u.isPending) && (
								<span className="absolute top-1.5 right-2 size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 min-w-0 min-h-0 mt-3">
					<ScrollArea className='h-full w-full no-horizontal-scroll'>
						<div className='space-y-1.5 p-4 pt-0 w-full min-w-0'>
							{isLoading ? (
								<UsersListSkeleton />
							) : (
								<>
									<TabsContent value="friends" className="mt-0 outline-none w-full min-w-0 flex flex-col gap-1.5">
										{friends.length === 0 ? (
											<div className="text-center py-10 text-zinc-500 text-sm font-medium">
												No friends found. Go to Discover to add some!
											</div>
										) : (
											friends.map((user: User) => renderUser(user, true))
										)}
									</TabsContent>
									
									<TabsContent value="discover" className="mt-0 outline-none space-y-1.5 w-full min-w-0">
										{discoverUsers.length === 0 ? (
											<div className="text-center py-10 text-zinc-500 text-sm font-medium">
												No more users to discover.
											</div>
										) : (
											discoverUsers.map((user: User) => renderUser(user, false))
										)}
									</TabsContent>
								</>
							)}
						</div>
					</ScrollArea>
				</div>
			</Tabs>
		</div>
	);
};

export default UsersList;