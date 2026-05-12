import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";

const formatLastSeen = (dateString?: string) => {
	if (!dateString) return "Offline";
	const date = new Date(dateString);
	const now = new Date();
	
	// if today, show time
	if (date.toDateString() === now.toDateString()) {
		return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}
	// if yesterday, show yesterday + time
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	if (date.toDateString() === yesterday.toDateString()) {
		return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
	}
	
	// else show date
	return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

const ChatHeader = () => {
	const { selectedUser, onlineUsers, setSelectedUser, setViewState } = useChatStore();

	if (!selectedUser) return null;

	return (
		<div className='p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50'>
			<div className='flex items-center gap-3'>
				<Avatar>
					<AvatarImage src={selectedUser.imageUrl} />
					<AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
				</Avatar>
				<div>
					<h2 className='font-medium'>{selectedUser.fullName}</h2>
					<p className='text-sm text-zinc-400'>
						{onlineUsers.has(selectedUser.clerkId) ? "Online" : formatLastSeen(selectedUser.lastSeen)}
					</p>
				</div>
			</div>
			<div className='flex items-center gap-2'>
				<Button 
					variant='ghost' 
					size='icon' 
					onClick={() => {
						setViewState('profile');
						useChatStore.setState({ profileSource: 'chat' });
					}}
				>
					<Info className='size-5 text-emerald-500' />
				</Button>
				<Button variant='ghost' size='icon' onClick={() => setSelectedUser(null)}>
					<X className='size-5' />
				</Button>
			</div>
		</div>
	);
};
export default ChatHeader;