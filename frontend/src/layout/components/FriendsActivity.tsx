import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { HeadphonesIcon, Users, Music } from "lucide-react";
import { useEffect } from "react";

const FriendsActivity = () => {
	const { users, fetchUsers, onlineUsers, userActivities } = useChatStore();
	const { user } = useUser();

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	return (
		<div className='h-full bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col relative overflow-hidden'>
			{/* Subtle background glow */}
			<div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

			<div className='p-6 flex justify-between items-center border-b border-white/5 relative z-10'>
				<div className='flex items-center gap-3'>
					<div className="p-2 bg-emerald-500/10 rounded-lg">
						<Users className='size-5 text-emerald-400 shrink-0' />
					</div>
					<h2 className='font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight'>
						Friend Activity
					</h2>
				</div>
			</div>

			{!user && <LoginPrompt />}

			<ScrollArea className='flex-1 min-h-0 relative z-10'>
				<div className='p-4 space-y-3'>
					{users.map((user:any) => {
						const isOnline = onlineUsers.has(user.clerkId);
						const activity = userActivities.get(user.clerkId) || "Offline";
						const isPlaying = activity !== "Offline" && activity !== "Idle";

						return (
							<div
								key={user._id}
								className='cursor-pointer bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-transparent hover:border-white/10 transition-all duration-300 group hover:-translate-y-0.5'
							>
								<div className='flex items-start gap-3'>
									<div className='relative'>
										<Avatar className='size-12 border-2 border-white/5 group-hover:border-emerald-500/30 transition-colors'>
											<AvatarImage src={user.imageUrl} alt={user.fullName} />
											<AvatarFallback>{user.fullName[0]}</AvatarFallback>
										</Avatar>
										<div
											className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-neutral-900 shadow-sm
												${isOnline ? "bg-emerald-500 shadow-emerald-500/50" : "bg-zinc-500"}
											`}
											aria-hidden='true'
										/>
									</div>

									<div className='flex-1 min-w-0 py-0.5'>
										<div className='flex items-center gap-2'>
											<span className='font-semibold text-sm text-white/90 group-hover:text-white transition-colors truncate'>
												{user.fullName}
											</span>
										</div>

										<div className='mt-1 flex items-center gap-1.5'>
											{isPlaying && (
												<Music className="size-3 text-emerald-400 animate-pulse shrink-0" />
											)}
											<span className={`text-xs truncate transition-colors ${isPlaying ? 'text-emerald-400/90 font-medium' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
												{activity}
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
};
export default FriendsActivity;

const LoginPrompt = () => (
	<div className='h-full flex flex-col items-center justify-center p-6 text-center space-y-6 relative z-10'>
		<div className='relative group'>
			<div
				className='absolute -inset-2 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full blur-xl
       opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse'
				aria-hidden='true'
			/>
			<div className='relative bg-neutral-900/80 backdrop-blur-sm rounded-full p-5 border border-white/10 group-hover:border-emerald-500/50 transition-colors'>
				<HeadphonesIcon className='size-8 text-emerald-400' />
			</div>
		</div>

		<div className='space-y-2 max-w-[250px]'>
			<h3 className='text-xl font-bold text-white tracking-tight'>See What Friends Are Playing</h3>
			<p className='text-sm text-zinc-400/80 leading-relaxed'>Login to discover what music your friends are enjoying right now</p>
		</div>
	</div>
);