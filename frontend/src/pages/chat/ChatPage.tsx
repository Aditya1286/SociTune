import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import { CheckCheck, Trash, Reply, Music2, Users, X, Download, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { UserProfilePanel } from "./components/UserProfilePanel";
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

const VoiceMessagePlayer = ({ url, isSender }: { url: string; isSender: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current && progressRef.current) {
            const currentTime = audioRef.current.currentTime;
            let duration = audioRef.current.duration;
            if (isNaN(duration) || duration === Infinity) {
                duration = 10; // Fallback
            }
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            progressRef.current.style.width = `${Math.min(progress, 100)}%`;
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        if (progressRef.current) {
            progressRef.current.style.width = '0%';
        }
    };

    return (
        <div className={`flex items-center gap-2 p-1.5 pr-3 rounded-full mb-2 w-fit ${isSender ? "bg-emerald-700/80 border border-emerald-500/50 shadow-inner shadow-black/10" : "bg-zinc-900 border border-zinc-700/50 shadow-inner shadow-black/20"}`}>
            <Button variant="ghost" size="icon" onClick={togglePlay} className={`h-8 w-8 rounded-full shadow-sm ${isSender ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"}`}>
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
            </Button>
            <div className="flex items-center w-24 md:w-32">
                <div className={`h-1 w-full rounded-full overflow-hidden ${isSender ? "bg-emerald-800/50" : "bg-zinc-700"}`}>
                    <div ref={progressRef} className={`h-full ${isSender ? "bg-white" : "bg-emerald-500"}`} style={{ width: `0%`, transition: 'width 0.1s linear' }} />
                </div>
            </div>
            <audio 

                ref={audioRef} 
                src={url} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="hidden" 
            />
        </div>
    );
};

const ChatPage = () => {
	const { user } = useUser();
	const { messages, selectedUser, fetchUsers, fetchMessages, markMessagesAsRead, setReplyingToMessage, deleteMessage, reactToMessage, viewState, setViewState } = useChatStore();
	const [previewImage, setPreviewImage] = useState<string | null>(null);

	const handleDownloadImage = async (url: string) => {
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = "socitune_image.png";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
		} catch (error) {
			console.error("Failed to download image", error);
		}
	};

	useEffect(() => {
		if (user) fetchUsers();
	}, [fetchUsers, user]);

	useEffect(() => {
		if (selectedUser && viewState === 'chat') {
            fetchMessages(selectedUser.clerkId);
        }
	}, [selectedUser, fetchMessages, viewState]);

	useEffect(() => {
		if (selectedUser && messages.length > 0 && viewState === 'chat') {
			const hasUnreadFromSelectedUser = messages.some(
				(msg) => msg.senderId === selectedUser.clerkId && !msg.isRead
			);
			if (hasUnreadFromSelectedUser) {
				markMessagesAsRead(selectedUser.clerkId);
			}
		}
	}, [selectedUser, messages, markMessagesAsRead, viewState]);

	return (
        <>
		<main className='h-full rounded-lg bg-zinc-950 overflow-hidden flex flex-col'>
			<div className='flex flex-1 overflow-hidden relative'>
				<div className={`w-[80px] lg:w-[350px] xl:w-[400px] flex-shrink-0 border-r border-white/5 bg-zinc-900/50 ${selectedUser ? "hidden md:block" : "block w-full md:w-[80px]"}`}>
					<UsersList />
				</div>

				{/* Main Content Area */}
				<div className={`flex-1 flex-col h-full min-w-0 overflow-hidden ${selectedUser ? "flex" : "hidden md:flex"} relative`}>
					{selectedUser ? (
                        viewState === 'profile' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <UserProfilePanel user={selectedUser} onClose={() => setViewState('chat')} isMainView={true} />
                            </div>
                        ) : (
                            <>
                                <ChatHeader />

                                {/* Messages */}
                                <ScrollArea className='flex-1 min-h-0 bg-[url("/chat-bg.png")] bg-repeat bg-center opacity-95'>
                                    <div className='p-4 space-y-6'>
                                        {messages.map((message) => (
                                            <div
                                                key={message._id}
                                                className={`flex items-end gap-3 group ${
                                                    message.senderId === user?.id ? "flex-row-reverse" : ""
                                                }`}
                                            >
                                                <Avatar className='size-8 shrink-0 border border-white/10 shadow-sm'>
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

                                                <div className={`relative max-w-[75%] flex flex-col ${message.senderId === user?.id ? "items-end" : "items-start"}`}>
                                                    <div
                                                        className={`rounded-2xl p-3 w-full shadow-md
                                                            ${message.senderId === user?.id ? "bg-emerald-600 text-white rounded-br-none" : "bg-zinc-800/90 text-zinc-100 rounded-bl-none border border-white/5"}
                                                        `}
                                                    >
                                                        {message.replyTo && (
                                                            <div className={`mb-2 p-2 rounded text-xs border-l-2 border-white/30 bg-black/20`}>
                                                                <span className="font-semibold block mb-0.5 text-white/90">
                                                                    {message.replyTo.senderId === user?.id ? "You" : selectedUser?.fullName}
                                                                </span>
                                                                <p className="truncate opacity-80">{message.replyTo.content}</p>
                                                            </div>
                                                        )}

                                                        {message.imageUrl && (
                                                            <div className="mb-2 rounded-lg overflow-hidden relative cursor-pointer" onClick={() => setPreviewImage(message.imageUrl!)}>
                                                                <img src={message.imageUrl} alt="attachment" className="max-w-[200px] md:max-w-[250px] object-cover border border-white/10 hover:opacity-90 transition-opacity" />
                                                            </div>
                                                        )}
                                                        {message.voiceNoteUrl && (
                                                            <VoiceMessagePlayer url={message.voiceNoteUrl} isSender={message.senderId === user?.id} />
                                                        )}
                                                        {message.content && (
                                                            <p className='text-[15px] break-words leading-relaxed'>{message.content}</p>
                                                        )}
                                                        <span className='text-[10px] text-white/50 mt-1 flex items-center justify-end gap-1 font-medium'>
                                                            {formatTime(message.createdAt)}
                                                            {message.senderId === user?.id && (
                                                                <CheckCheck className={`size-3.5 ${message.isRead ? "text-emerald-300" : "text-white/50"}`} />
                                                            )}
                                                        </span>
                                                    </div>

                                                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                                                        <div className={`absolute -bottom-3 flex gap-1 bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-xs shadow-lg z-10
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
                                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-800/95 border border-zinc-700 p-1.5 rounded-full shadow-xl z-10 backdrop-blur-sm
                                                        ${message.senderId === user?.id ? "right-[calc(100%+12px)]" : "left-[calc(100%+12px)]"}
                                                    `}>
                                                        <Button variant='ghost' size='icon' className='size-7 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700' onClick={() => setReplyingToMessage(message)}>
                                                            <Reply className='size-4' />
                                                        </Button>
                                                        <div className="flex items-center gap-0.5 bg-zinc-900/50 rounded-full px-1">
                                                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
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
                        )
					) : (
						<NoConversationPlaceholder />
					)}
				</div>
			</div>
		</main>
        {previewImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
                    <div className="absolute -top-12 right-0 flex gap-4">
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadImage(previewImage)} className="text-white hover:bg-white/20 rounded-full">
                            <Download className="size-6" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setPreviewImage(null)} className="text-white hover:bg-white/20 rounded-full">
                            <X className="size-6" />
                        </Button>
                    </div>
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                </div>
            </div>
        )}
        </>
	);
};
export default ChatPage;

const NoConversationPlaceholder = () => {
    const { users } = useChatStore();
    const floatingUsers = users.slice(0, 4); // Get a few users for the floating effect

    return (
        <div className='flex flex-col items-center justify-center h-full relative overflow-hidden bg-zinc-950 w-full'>
            {/* Deep background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-zinc-950 to-zinc-950" />
            
            {/* Floating Avatars */}
            {floatingUsers.map((u, i) => (
                <motion.div
                    key={u.clerkId}
                    className="absolute z-0 hidden sm:block"
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ 
                        y: [0, -20, 0], 
                        opacity: [0.3, 0.7, 0.3],
                        x: [0, i % 2 === 0 ? 15 : -15, 0]
                    }}
                    transition={{
                        duration: 5 + i,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        top: `${15 + i * 20}%`,
                        left: i % 2 === 0 ? `${10 + i * 5}%` : `${80 - i * 5}%`,
                    }}
                >
                    <div className="relative group">
                        <div className={`absolute -inset-1.5 rounded-full blur-md opacity-40 ${i % 2 === 0 ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
                        <Avatar className='relative size-12 md:size-14 border-2 border-white/10 shadow-xl'>
                            <AvatarImage src={u.imageUrl} />
                            <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                        </Avatar>
                    </div>
                </motion.div>
            ))}

            <div className='relative z-10 flex flex-col items-center text-center'>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative group mb-8 mt-10"
                >
                    <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <img src='/logo.png' alt='Socitune' className='relative size-28 md:size-36 object-contain filter drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' />
                </motion.div>
                
                <motion.h3 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className='text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 text-4xl md:text-5xl font-bold mb-4 tracking-tight'
                >
                    Discover & Chat
                </motion.h3>
                
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className='text-zinc-400 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed px-4'
                >
                    Search for friends or select a conversation. The void won't reply back, no matter how long you stare at it.
                </motion.p>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col gap-4 w-full max-w-[250px] px-4"
                >
                    <Button 
                        onClick={() => document.dispatchEvent(new CustomEvent("open-search"))}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-full shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 border-0 h-12 text-sm font-medium"
                    >
                        <Users className="size-4 mr-2" />
                        Explore Friends
                    </Button>
                </motion.div>
            </div>
            
            {/* Bottom waves (CSS aesthetic) */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent z-0 pointer-events-none" />
            <div className="absolute bottom-6 text-[10px] tracking-[0.3em] uppercase text-zinc-600 font-medium z-10 flex items-center gap-2">
                <Music2 className="size-3" />
                MUSIC BRINGS US TOGETHER
            </div>
        </div>
    );
};