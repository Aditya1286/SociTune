
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { CheckCheck, Trash, Reply } from "lucide-react";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import { Button } from "@/components/ui/button";

const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages, markMessagesAsRead, setReplyingToMessage, deleteMessage, reactToMessage } = useChatStore();

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser) fetchMessages(selectedUser.clerkId);
	}, [selectedUser, fetchMessages]);

	useEffect(() => {
		if (selectedUser && messages.length > 0) {
			const hasUnreadFromSelectedUser = messages.some(
				(msg) => msg.senderId === selectedUser.clerkId && !msg.isRead
			);
			if (hasUnreadFromSelectedUser) {
				markMessagesAsRead(selectedUser.clerkId);
			}
		}
	}, [selectedUser, messages, markMessagesAsRead]);

	return (
		<main className='h-full rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden flex flex-col'>
			<div className='flex flex-1 overflow-hidden'>
				<div className={`w-[80px] lg:w-[300px] flex-shrink-0 ${selectedUser ? "hidden sm:block" : "block w-full sm:w-[80px]"}`}>
					<UsersList />
				</div>

				{/* chat message */}
				<div className={`flex-1 flex-col h-full min-w-0 overflow-hidden ${selectedUser ? "flex" : "hidden sm:flex"}`}>
					{selectedUser ? (
						<>
							<ChatHeader />

							{/* Messages */}
							<ScrollArea className='flex-1 min-h-0'>
								<div className='p-4 space-y-6'>
									{messages.map((message) => (
										<div
											key={message._id}
											className={`flex items-end gap-3 group ${
												message.senderId === user?.id ? "flex-row-reverse" : ""
											}`}
										>
											<Avatar className='size-8 shrink-0'>
												<AvatarImage
													src={
														message.senderId === user?.id
															? user.imageUrl
															: selectedUser.imageUrl
													}
												/>
												<AvatarFallback>
													{message.senderId === user?.id
														? user?.fullName?.[0]
														: selectedUser.fullName[0]}
												</AvatarFallback>
											</Avatar>

											<div className={`relative max-w-[70%] flex flex-col ${message.senderId === user?.id ? "items-end" : "items-start"}`}>
												<div
													className={`rounded-lg p-3 w-full
														${message.senderId === user?.id ? "bg-green-500" : "bg-zinc-800"}
													`}
												>
													{message.replyTo && (
														<div className={`mb-2 p-2 rounded text-xs border-l-2 border-white/20 bg-black/10`}>
															<span className="font-semibold block mb-0.5">
																{message.replyTo.senderId === user?.id ? "You" : selectedUser?.fullName}
															</span>
															<p className="truncate opacity-80">{message.replyTo.content}</p>
														</div>
													)}

													<p className='text-sm break-words'>{message.content}</p>
													<span className='text-[10px] text-zinc-300 mt-1 flex items-center justify-end gap-1'>
														{formatTime(message.createdAt)}
														{message.senderId === user?.id && (
															<CheckCheck className={`size-3 ${message.isRead ? "text-blue-500" : "text-zinc-300"}`} />
														)}
													</span>
												</div>

												{message.reactions && Object.keys(message.reactions).length > 0 && (
													<div className={`absolute -bottom-3 flex gap-1 bg-zinc-900 border border-zinc-700 rounded-full px-2 py-0.5 text-xs shadow-sm z-10
														${message.senderId === user?.id ? "right-2" : "left-2"}
													`}>
														{Array.from(new Set(Object.values(message.reactions))).map((emoji: any) => (
															<span key={emoji}>{emoji}</span>
														))}
														<span className="text-[10px] text-zinc-400 ml-1 font-medium">
															{Object.keys(message.reactions).length}
														</span>
													</div>
												)}

												{/* Action Menu */}
												<div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-800/90 border border-zinc-700 p-1 rounded-full shadow-md z-10
													${message.senderId === user?.id ? "right-[calc(100%+10px)]" : "left-[calc(100%+10px)]"}
												`}>
													<Button variant='ghost' size='icon' className='size-7 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700' onClick={() => setReplyingToMessage(message)}>
														<Reply className='size-4' />
													</Button>
													<div className="flex items-center gap-0.5 bg-zinc-900/50 rounded-full px-1">
														{['👍', '❤️', '😂'].map(emoji => (
															<button 
																key={emoji}
																onClick={() => reactToMessage(message._id, emoji)}
																className={`hover:bg-zinc-700 p-1.5 rounded-full text-sm transition-colors ${message.reactions?.[user?.id || ""] === emoji ? "bg-zinc-700" : ""}`}
															>
																{emoji}
															</button>
														))}
													</div>
													{message.senderId === user?.id && (
														<Button variant='ghost' size='icon' className='size-7 rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/10' onClick={() => deleteMessage(message._id)}>
															<Trash className='size-4' />
														</Button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>

							<MessageInput />
						</>
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => (
	<div className='flex flex-col items-center justify-center h-full space-y-6'>
		<img src='/logo.png' alt='Socitune' className='size-16 animate-bounce' />
		<div className='text-center'>
			<h3 className='text-zinc-300 text-lg font-medium mb-1'>No conversation selected</h3>
			<p className='text-zinc-500 text-sm'>Choose a friend to start chatting</p>
		</div>
	</div>
);