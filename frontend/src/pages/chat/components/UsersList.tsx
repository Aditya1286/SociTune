import UsersListSkeleton from "@/components/skeletons/UsersListSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";

const UsersList = () => {
	const { users, selectedUser, isLoading, setSelectedUser, onlineUsers, unreadMessages } = useChatStore();

	return (
		<div className='border-r border-zinc-800 h-full'>
			<div className='flex flex-col h-full'>
				<ScrollArea className='h-[calc(100vh-280px)]'>
					<div className='space-y-2 p-4'>
						{isLoading ? (
							<UsersListSkeleton />
						) : (
							users.map((user) => (
								<div
									key={user._id}
									onClick={() => setSelectedUser(user)}
									className={`flex items-center justify-center lg:justify-start gap-3 p-3 
										rounded-lg cursor-pointer transition-colors
                    ${selectedUser?.clerkId === user.clerkId ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
								>
									<div className='relative'>
										<Avatar className='size-8 md:size-12'>
											<AvatarImage src={user.imageUrl} />
											<AvatarFallback>{user.fullName[0]}</AvatarFallback>
										</Avatar>
										{/* online indicator */}
										<div
											className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-900
                        ${onlineUsers.has(user.clerkId) ? "bg-green-500" : "bg-zinc-500"}`}
										/>
										{/* Unread count badge for small screens (positioned on the avatar) */}
										{unreadMessages.get(user.clerkId) && unreadMessages.get(user.clerkId)! > 0 ? (
											<div className="lg:hidden absolute -top-1 -right-1 size-4 rounded-full bg-green-500 items-center justify-center text-[10px] font-bold text-white flex">
												{unreadMessages.get(user.clerkId)}
											</div>
										) : null}
									</div>

									<div className='flex-1 min-w-0 lg:block hidden'>
										<span className='font-medium truncate block'>{user.fullName}</span>
										<p className='text-sm text-zinc-400 truncate'>
											{user.lastMessage ? user.lastMessage : "Say hi!"}
										</p>
									</div>

									{/* Unread count badge for large screens */}
									{unreadMessages.get(user.clerkId) && unreadMessages.get(user.clerkId)! > 0 ? (
										<div className="lg:flex hidden size-5 rounded-full bg-green-500 items-center justify-center text-xs font-bold text-white">
											{unreadMessages.get(user.clerkId)}
										</div>
									) : null}
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};

export default UsersList;