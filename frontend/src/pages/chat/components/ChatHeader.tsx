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
		<div className='p-4 border-b border-white/[0.04] flex justify-between items-center bg-[#0a0a0c]/60 backdrop-blur-md sticky top-0 z-20'>
			<div className='flex items-center gap-3'>
				<Avatar className='size-10 border border-white/[0.08] shadow-sm'>
					<AvatarImage src={selectedUser.imageUrl} />
					<AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
				</Avatar>
				<div>
					<h2 className='font-semibold text-white/95 text-[15px]'>{selectedUser.fullName}</h2>
					<div className='text-xs text-zinc-400 font-medium flex items-center gap-1.5 mt-0.5'>
						{onlineUsers.has(selectedUser.clerkId) ? (
							<>
								<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
								<span className="text-emerald-400 font-semibold">Online</span>
							</>
						) : (
							<span>{formatLastSeen(selectedUser.lastSeen)}</span>
						)}
					</div>
				</div>
			</div>
			<div className='flex items-center gap-1.5'>
				<Button 
					variant='ghost' 
					size='icon' 
					onClick={() => {
						setViewState('profile');
						useChatStore.setState({ profileSource: 'chat' });
					}}
					className="text-zinc-400 hover:text-emerald-400 hover:bg-white/5 rounded-full hover:scale-105 active:scale-95 transition-all size-9"
				>
					<Info className='size-5' />
				</Button>
				<Button 
					variant='ghost' 
					size='icon' 
					onClick={() => setSelectedUser(null)}
					className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full hover:scale-105 active:scale-95 transition-all size-9"
				>
					<X className='size-5' />
				</Button>
			</div>
		</div>
	);
};
export default ChatHeader;