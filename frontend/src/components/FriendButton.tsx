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
				variant="ghost" 
				size="sm" 
				onClick={handleRemoveRequest}
				disabled={isLoading}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => setIsHovering(false)}
				className={`transition-colors ${isHovering ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" : "text-emerald-500"}`}
			>
				{isHovering ? (
					<>
						<X className="size-4 mr-2" /> Remove
					</>
				) : (
					<>
						<UserCheck className="size-4 mr-2" /> Friends
					</>
				)}
			</Button>
		);
	}

	if (user.isSent) {
		return (
			<Button variant="outline" size="sm" disabled className="text-zinc-400 border-zinc-700 bg-zinc-800/50">
				<Clock className="size-3 mr-2" /> Pending
			</Button>
		);
	}

	if (user.isPending) {
		return (
			<div className="flex gap-2">
				<Button 
					variant="default" 
					size="sm" 
					onClick={handleAcceptRequest} 
					disabled={isLoading}
					className="bg-emerald-600 hover:bg-emerald-500"
				>
					<Check className="size-4 mr-1" /> Accept
				</Button>
				<Button 
					variant="ghost" 
					size="icon" 
					onClick={handleRejectRequest} 
					disabled={isLoading}
					className="hover:bg-red-500/20 hover:text-red-400 text-zinc-400"
				>
					<X className="size-4" />
				</Button>
			</div>
		);
	}

	return (
		<Button 
			variant="outline" 
			size="sm" 
			onClick={handleSendRequest} 
			disabled={isLoading}
			className="hover:bg-emerald-500/20 hover:text-emerald-400 border-zinc-700 hover:border-emerald-500/50"
		>
			<UserPlus className="size-4 mr-2" /> Add Friend
		</Button>
	);
};
