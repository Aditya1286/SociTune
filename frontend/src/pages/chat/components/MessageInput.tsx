import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Send, X } from "lucide-react";
import { useState } from "react";

const MessageInput = () => {
	const [newMessage, setNewMessage] = useState("");
	const { user } = useUser();
	const { selectedUser, sendMessage, replyingToMessage, setReplyingToMessage } = useChatStore();

	const handleSend = () => {
		if (!selectedUser || !user || !newMessage) return;
		sendMessage(selectedUser.clerkId, user.id, newMessage.trim(), replyingToMessage?._id);
		setNewMessage("");
	};

	return (
		<div className='p-4 mt-auto border-t border-zinc-800 flex flex-col gap-2'>
			{replyingToMessage && (
				<div className='bg-zinc-800/50 rounded-md p-2 flex items-center justify-between border border-zinc-700/50'>
					<div className='text-sm truncate pr-4 text-zinc-300'>
						<span className='font-semibold text-white mr-2'>
							Replying to {replyingToMessage.senderId === user?.id ? "Yourself" : selectedUser?.fullName}:
						</span>
						{replyingToMessage.content}
					</div>
					<Button variant='ghost' size='icon' className='size-6 shrink-0 text-zinc-400 hover:text-white' onClick={() => setReplyingToMessage(null)}>
						<X className='size-4' />
					</Button>
				</div>
			)}
			<div className='flex gap-2'>
				<Input
					placeholder='Type a message'
					value={newMessage}
					onChange={(e) => setNewMessage(e.target.value)}
					className='flex-1 min-w-0 bg-zinc-800 border-none'
					onKeyDown={(e) => e.key === "Enter" && handleSend()}
				/>

				<Button size={"icon"} onClick={handleSend} disabled={!newMessage.trim()} className="shrink-0">
					<Send className='size-4' />
				</Button>
			</div>
		</div>
	);
};
export default MessageInput;