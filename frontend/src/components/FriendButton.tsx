import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { UserPlus, Check, X, Clock, UserCheck } from "lucide-react";
import { useState } from "react";

export const FriendButton = ({ user }: { user: any }) => {
	const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useChatStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isHovering, setIsHovering] = useState(false);

	const handleSendRequest = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsLoading(true);
		await sendFriendRequest(user.clerkId);
		setIsLoading(false);
	};

	const handleAcceptRequest = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsLoading(true);
		await acceptFriendRequest(user.clerkId);
		setIsLoading(false);
	};

	const handleRejectRequest = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsLoading(true);
		await rejectFriendRequest(user.clerkId);
		setIsLoading(false);
	};

	const handleRemoveRequest = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsLoading(true);
		await removeFriend(user.clerkId);
		setIsLoading(false);
	};

	if (user.isFriend) {
		return (
			<Button 
				variant="outline" 
				size="sm" 
				onClick={handleRemoveRequest}
				disabled={isLoading}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				className={`rounded-lg px-4 h-9 transition-colors font-medium border-zinc-800 text-xs ${
					isHovering 
						? "text-red-400 bg-red-950/20 border-red-900/30 hover:bg-red-900/20" 
						: "text-zinc-300 bg-zinc-900/40 hover:bg-zinc-850 hover:text-white"
				}`}
			>
				{isHovering ? (
					<>
						<X className="size-3.5 mr-1.5" /> Remove
					</>
				) : (
					<>
						<UserCheck className="size-3.5 mr-1.5" /> Friends
					</>
				)}
			</Button>
		);
	}

	if (user.isSent) {
		return (
			<Button variant="outline" size="sm" disabled className="text-zinc-500 border-zinc-800 bg-zinc-900/20 rounded-lg px-4 h-9 font-medium text-xs">
				<Clock className="size-3.5 mr-1.5" /> Pending
			</Button>
		);
	}

	if (user.isPending) {
		return (
			<div className="flex gap-1.5">
				<Button 
					variant="default" 
					size="sm" 
					onClick={handleAcceptRequest} 
					disabled={isLoading}
					className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg px-4 h-9 text-xs"
				>
					<Check className="size-3.5 mr-1" /> Accept
				</Button>
				<Button 
					variant="ghost" 
					size="icon" 
					onClick={handleRejectRequest} 
					disabled={isLoading}
					className="hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg h-9 w-9"
				>
					<X className="size-4" />
				</Button>
			</div>
		);
	}

	return (
		<Button 
			variant="default" 
			size="sm" 
			onClick={handleSendRequest} 
			disabled={isLoading}
			className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg px-4 h-9 text-xs border-0 shadow-sm"
		>
			<UserPlus className="size-3.5 mr-1.5" /> Add Friend
		</Button>
	);
};
