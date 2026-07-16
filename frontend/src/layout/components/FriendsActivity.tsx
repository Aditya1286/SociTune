import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { HeadphonesIcon, Users } from "lucide-react";
import { useEffect } from "react";

const PlayingEqualizer = () => (
  <div className="flex items-end gap-[2px] h-3 w-3 shrink-0 mb-[2px]">
    <span className="w-[1.5px] bg-emerald-400 animate-[eq-bar-1_0.8s_ease-in-out_infinite]" />
    <span className="w-[1.5px] bg-emerald-400 animate-[eq-bar-2_0.5s_ease-in-out_infinite]" />
    <span className="w-[1.5px] bg-emerald-400 animate-[eq-bar-3_0.7s_ease-in-out_infinite]" />
  </div>
);

const FriendsActivity = () => {
	const { users, fetchUsers, onlineUsers, userActivities } = useChatStore();
	const { currentUser } = useAuthStore();

	useEffect(() => {
		if (currentUser) fetchUsers();
	}, [fetchUsers, currentUser]);

	return (
		<div className="h-full pl-1 pr-2 pb-2 flex flex-col font-sans select-none relative">
			{/* CSS Keyframes for Micro-Equalizer */}
			<style dangerouslySetInnerHTML={{__html: `
				@keyframes eq-bar-1 {
					0%, 100% { height: 3px; }
					50% { height: 11px; }
				}
				@keyframes eq-bar-2 {
					0%, 100% { height: 11px; }
					50% { height: 4px; }
				}
				@keyframes eq-bar-3 {
					0%, 100% { height: 5px; }
					50% { height: 10px; }
				}
			`}} />

			{/* Main glass card */}
			<div className="flex-1 rounded-xl bg-[#09090b]/80 backdrop-blur-sm p-4 border border-white/5 flex flex-col overflow-hidden relative shadow-2xl shadow-black/40">
				{/* Ambient Glow */}
				<div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

				{/* Header */}
				<div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04] relative z-10">
					<div className="flex items-center text-zinc-400 gap-3">
						<Users className="size-5 text-zinc-400 shrink-0" />
						<span className="font-semibold text-sm tracking-widest text-zinc-300 uppercase">Friend Activity</span>
					</div>
				</div>

				{!currentUser && <LoginPrompt />}

				{/* Friends List */}
				<ScrollArea className="flex-1 min-h-0 -mx-2 px-2 relative z-10">
					<div className="space-y-1.5 pb-4">
						{users.filter((u:any) => u.isFriend).length === 0 ? (
							<div className="text-center py-12 text-zinc-500 text-xs font-light">
								No friends active yet.
							</div>
						) : (
							users.filter((u:any) => u.isFriend).map((friend:any) => {
								const isOnline = onlineUsers.has(friend.clerkId);
								let activity = userActivities.get(friend.clerkId) || friend.lastActivity || "Offline";
								
								if (activity === "Idle" && !isOnline) {
									activity = "Offline";
								}
								
								const isPlaying = isOnline && activity !== "Offline" && activity !== "Idle";
								const isLastListened = !isOnline && activity.startsWith("Recently");

								// Clean names of trailing "null" or "undefined"
								const cleanName = friend.fullName.replace(/\s+null$/, "").replace(/\s+undefined$/, "");

								return (
									<div
										key={friend._id}
										className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
									>
										{/* Avatar */}
										<div className={`relative shrink-0 transition-opacity duration-300 ${!isOnline ? 'opacity-55' : 'opacity-100'}`}>
											<Avatar className="size-10 border border-white/10 group-hover:border-zinc-400 transition-colors shadow-sm">
												<AvatarImage src={friend.imageUrl} alt={cleanName} />
												<AvatarFallback className="bg-zinc-900 text-zinc-400 text-xs font-medium">{cleanName[0]}</AvatarFallback>
											</Avatar>
											{isOnline && (
												<div
													className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-500"
													aria-hidden="true"
												/>
											)}
										</div>

										{/* Content */}
										<div className="flex-1 min-w-0 py-0.5 overflow-hidden">
											<p className="font-semibold text-xs text-white/90 truncate group-hover:text-white transition-colors">
												{cleanName}
											</p>

											{isLastListened ? (
												<div className="mt-1 flex flex-col gap-0.5">
													<div className="flex items-center gap-1 text-zinc-500 mb-0.5">
														<HeadphonesIcon className="size-3 text-zinc-500 shrink-0" />
														<span className="text-[8px] uppercase tracking-wider font-semibold">Recently Played</span>
													</div>
													{(() => {
														const cleanActivity = activity.replace("Recently listened: ", "").replace("Paused: ", "").replace("Paused ", "");
														let songName = cleanActivity;
														let artistName = "";
														if (cleanActivity.includes(" by ")) {
															const parts = cleanActivity.split(" by ");
															artistName = parts.pop() || "";
															songName = parts.join(" by ");
														}

														return (
															<>
																<p className="text-[11px] text-zinc-300 font-medium truncate">
																	{songName}
																</p>
																{artistName && (
																	<p className="text-[9px] text-zinc-500 truncate font-light">
																		by {artistName}
																	</p>
																)}
															</>
														);
													})()}
												</div>
											) : isPlaying ? (
												<div className="mt-1.5 flex flex-col gap-0.5">
													{(() => {
														const cleanActivity = activity.replace("Playing ", "").replace("Paused ", "");
														let songName = cleanActivity;
														let artistName = "";
														if (cleanActivity.includes(" by ")) {
															const parts = cleanActivity.split(" by ");
															artistName = parts.pop() || "";
															songName = parts.join(" by ");
														}

														return (
															<>
																<div className="flex items-center gap-1.5">
																	<p className="text-[11px] text-emerald-400 font-medium truncate">
																		{songName}
																	</p>
																	<PlayingEqualizer />
																</div>
																{artistName && (
																	<p className="text-[9px] text-zinc-500 truncate font-light">
																		by {artistName}
																	</p>
																)}
															</>
														);
													})()}
												</div>
											) : (
												<p className="text-[10px] text-zinc-600 font-light mt-1.5">
													Offline
												</p>
											)}
										</div>
									</div>
								);
							})
						)}
					</div>
				</ScrollArea>
			</div>
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
			<h3 className='text-base font-bold text-white tracking-tight'>See What Friends Are Playing</h3>
			<p className='text-xs text-zinc-500 leading-relaxed'>Login to discover what music your friends are enjoying right now</p>
		</div>
	</div>
);