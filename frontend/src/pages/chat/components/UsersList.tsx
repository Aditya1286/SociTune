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
			className={`flex items-center justify-between gap-3 p-3 
				rounded-lg transition-colors group cursor-pointer
				${selectedUser?.clerkId === user.clerkId ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
		>
			<div className='flex items-center gap-3 flex-1 min-w-0'>
				<div className='relative shrink-0'>
					<Avatar className='size-10 md:size-12 border border-zinc-800'>
						<AvatarImage src={user.imageUrl} />
						<AvatarFallback>{user.fullName[0]}</AvatarFallback>
					</Avatar>
					<div
						className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-900
						${onlineUsers.has(user.clerkId) ? "bg-green-500" : "bg-zinc-500"}`}
					/>
					{isFriendTab && unreadMessages.get(user.clerkId) && unreadMessages.get(user.clerkId)! > 0 ? (
						<div className="lg:hidden absolute -top-1 -right-1 size-4 rounded-full bg-green-500 items-center justify-center text-[10px] font-bold text-white flex">
							{unreadMessages.get(user.clerkId)}
						</div>
					) : null}
				</div>

				<div className='flex-1 min-w-0 hidden lg:block'>
					<span className='font-medium truncate block text-white/90 group-hover:text-white transition-colors'>{user.fullName}</span>
					{user.username && <span className="text-[10px] text-zinc-500 truncate block mt-0.5">@{user.username}</span>}
					{isFriendTab ? (
						<p className='text-xs text-zinc-400 truncate mt-0.5'>
							{user.lastMessage ? user.lastMessage : "Say hi!"}
						</p>
					) : (
						<p className='text-[10px] text-zinc-500 truncate mt-0.5'>
							{user.mutualFriendsCount || 0} mutual friends
						</p>
					)}
				</div>
			</div>
			
			<div className="flex items-center gap-2 shrink-0">
				{isFriendTab && unreadMessages.get(user.clerkId) && unreadMessages.get(user.clerkId)! > 0 ? (
					<div className="hidden lg:flex size-5 rounded-full bg-green-500 items-center justify-center text-xs font-bold text-white">
						{unreadMessages.get(user.clerkId)}
					</div>
				) : null}

				<div className="hidden lg:block">
					<FriendButton user={user} />
				</div>
			</div>
			
			{/* Mobile view action button */}
			<div className="lg:hidden shrink-0">
				<FriendButton user={user} />
			</div>
		</div>
	);

	return (
		<div className='border-r border-zinc-800 h-full flex flex-col'>
			<div className='p-4 border-b border-zinc-800'>
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
					<Input 
						placeholder="Search users..." 
						className="pl-9 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<Tabs defaultValue="friends" className="flex-1 flex flex-col min-h-0 w-full">
				<div className="px-4 pt-2 shrink-0">
					<TabsList className="w-full bg-zinc-900 border border-zinc-800">
						<TabsTrigger value="friends" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
							Friends
						</TabsTrigger>
						<TabsTrigger value="discover" className="flex-1 data-[state=active]:bg-zinc-800 data-[state=active]:text-white relative">
							Discover
							{discoverUsers.some((u: User) => u.isPending) && (
								<span className="absolute top-1.5 right-2 size-2 bg-emerald-500 rounded-full animate-pulse" />
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				<div className="flex-1 min-h-0 mt-2">
					<ScrollArea className='h-full'>
						<div className='space-y-2 p-4 pt-0'>
							{isLoading ? (
								<UsersListSkeleton />
							) : (
								<>
									<TabsContent value="friends" className="mt-0 outline-none">
										{friends.length === 0 ? (
											<div className="text-center py-8 text-zinc-500 text-sm">
												No friends found. Go to Discover to add some!
											</div>
										) : (
											friends.map((user: User) => renderUser(user, true))
										)}
									</TabsContent>
									
									<TabsContent value="discover" className="mt-0 outline-none">
										{discoverUsers.length === 0 ? (
											<div className="text-center py-8 text-zinc-500 text-sm">
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