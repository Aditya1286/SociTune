import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState, useRef, useMemo } from "react";
import { CheckCheck, Trash, Reply, Music2, Users, X, Download, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";
import UsersList from "./components/UsersList";
import ChatHeader from "./components/ChatHeader";
import { UserProfilePanel } from "./components/UserProfilePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageInput from "./components/MessageInput";
import { Button } from "@/components/ui/button";
import { 
    Message, 
    MessageContent, 
    MessageGroup 
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";


const formatTime = (date: string) => {
	return new Date(date).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "long" });
    }
    return date.toLocaleDateString("en-GB");
};

const getSubGroups = (messages: any[]) => {
    const subGroups: any[][] = [];
    let currentSubGroup: any[] = [];
    messages.forEach((msg) => {
        if (currentSubGroup.length === 0) {
            currentSubGroup.push(msg);
        } else {
            const lastMsg = currentSubGroup[currentSubGroup.length - 1];
            if (lastMsg.senderId === msg.senderId) {
                currentSubGroup.push(msg);
            } else {
                subGroups.push(currentSubGroup);
                currentSubGroup = [msg];
            }
        }
    });
    if (currentSubGroup.length > 0) {
        subGroups.push(currentSubGroup);
    }
    return subGroups;
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
        <div className={`flex items-center gap-3 p-2 pr-3.5 rounded-full mb-1.5 w-fit shadow-sm backdrop-blur-md ${isSender ? "bg-white/10 border border-white/20 shadow-inner" : "bg-white/[0.04] border border-white/[0.06] shadow-inner"}`}>
            <Button variant="ghost" size="icon" onClick={togglePlay} className={`h-8 w-8 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 ${isSender ? "bg-white text-emerald-600 hover:bg-white/90" : "bg-emerald-500 text-white hover:bg-emerald-400"}`}>
                {isPlaying ? <Pause className="size-4 fill-currentColor" /> : <Play className="size-4 ml-0.5 fill-currentColor" />}
            </Button>
            <div className="flex items-center w-28 md:w-36">
                <div className={`h-1 w-full rounded-full overflow-hidden ${isSender ? "bg-white/20" : "bg-zinc-800"}`}>
                    <div ref={progressRef} className={`h-full rounded-full ${isSender ? "bg-white" : "bg-emerald-500"}`} style={{ width: `0%`, transition: 'width 0.1s linear' }} />
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
	const { currentUser: user } = useAuthStore();
	const { messages, selectedUser, fetchUsers, fetchMessages, markMessagesAsRead, setReplyingToMessage, deleteMessage, reactToMessage, viewState, setViewState } = useChatStore();
	const [previewImage, setPreviewImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

	const groupedMessages = useMemo(() => {
		const groups: { date: string; messages: any[] }[] = [];
		messages.forEach((msg) => {
			const dateLabel = formatMessageDate(msg.createdAt);
			const lastGroup = groups[groups.length - 1];
			if (lastGroup && lastGroup.date === dateLabel) {
				lastGroup.messages.push(msg);
			} else {
				groups.push({ date: dateLabel, messages: [msg] });
			}
		});
		return groups;
	}, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, viewState]);

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
		<main className='h-full rounded-2xl bg-[#09090b] border border-white/[0.04] overflow-hidden flex flex-col relative shadow-2xl'>
			{/* Apple Ambient Mesh Glows */}
			<div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />
			<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0" />

			<div className='flex flex-1 overflow-hidden relative z-10'>
				<div className={`w-[80px] lg:w-[350px] xl:w-[400px] flex-shrink-0 border-r border-white/[0.04] bg-[#0a0a0c]/60 backdrop-blur-md ${selectedUser ? "hidden md:block" : "block w-full md:w-[80px]"}`}>
					<UsersList />
				</div>

				{/* Main Content Area */}
				<div className={`flex-1 flex-col h-full min-w-0 overflow-hidden bg-[#070709]/80 backdrop-blur-md ${selectedUser ? "flex" : "hidden md:flex"} relative`}>
					{selectedUser ? (
                        viewState === 'profile' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <UserProfilePanel user={selectedUser} onClose={() => setViewState('chat')} isMainView={true} />
                            </div>
                        ) : (
                            <>
                                <ChatHeader />

                                {/* Messages */}
                                <ScrollArea className='flex-1 min-h-0 bg-[url("/chat-bg.png")] bg-repeat bg-center bg-blend-overlay bg-opacity-25'>
                                    <div className='p-4 space-y-4'>
                                        {groupedMessages.map((group) => (
                                            <div key={group.date} className="space-y-3">
                                                <div className="flex justify-center sticky top-2 z-20">
                                                    <span className="bg-[#121216]/90 border border-white/[0.06] backdrop-blur-md text-zinc-300 text-[11px] px-3.5 py-1 rounded-full shadow-lg font-semibold tracking-wide">
                                                        {group.date}
                                                    </span>
                                                </div>
                                                {getSubGroups(group.messages).map((subGroup, subGroupIdx) => {
                                                    const firstMsg = subGroup[0];
                                                    const isSender = firstMsg.senderId === user?.clerkId;
                                                    return (
                                                        <MessageGroup key={subGroupIdx} className={`gap-[3px] ${isSender ? "items-end" : "items-start"}`}>
                                                            {subGroup.map((message, idx) => {
                                                                const isFirstInGroup = idx === 0;
                                                                const bubbleRoundClass = isSender
                                                                    ? (isFirstInGroup ? "rounded-[8px] rounded-tr-none" : "rounded-[8px]")
                                                                    : (isFirstInGroup ? "rounded-[8px] rounded-tl-none" : "rounded-[8px]");
                                                                return (
                                                                    <Message
                                                                        key={message._id}
                                                                        align={isSender ? "end" : "start"}
                                                                        className="group/row"
                                                                    >
                                                                        <MessageContent className={`relative max-w-[65%] w-fit flex flex-col ${isSender ? "items-end" : "items-start"}`}>
                                                                            <Bubble variant="custom" className="w-full">
                                                                                <BubbleContent
                                                                                    className={`${bubbleRoundClass} px-3 py-1.5 w-full shadow-sm relative group/bubble transition-all duration-200 ${
                                                                                        isSender
                                                                                            ? "bg-[#005c4b] text-[#e9edef]"
                                                                                            : "bg-[#202c33] text-[#e9edef] border-0"
                                                                                    }`}
                                                                                >
                                                                                    {message.replyTo && (
                                                                                        <div className="mb-2 p-2 rounded-lg text-xs border-l-2 border-emerald-500 bg-black/20">
                                                                                            <span className="font-semibold block mb-0.5 text-emerald-400">
                                                                                                {message.replyTo.senderId === user?.clerkId ? "You" : selectedUser?.fullName}
                                                                                            </span>
                                                                                            <p className="truncate opacity-80">{message.replyTo.content}</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {message.imageUrl && (
                                                                                        <div className="mb-1.5 rounded-lg overflow-hidden relative border border-white/[0.06] cursor-pointer" onClick={() => setPreviewImage(message.imageUrl!)}>
                                                                                            <img src={message.imageUrl} alt="attachment" className="max-w-[200px] md:max-w-[250px] object-cover hover:scale-[1.02] transition-transform duration-300" />
                                                                                        </div>
                                                                                    )}
                                                                                    {message.voiceNoteUrl && (
                                                                                        <VoiceMessagePlayer url={message.voiceNoteUrl} isSender={isSender} />
                                                                                    )}
                                                                                    {message.content && (
                                                                                        <p className="text-[14px] leading-relaxed break-words">{message.content}</p>
                                                                                    )}
                                                                                    <span className="text-[10px] text-white/50 mt-1 flex items-center justify-end gap-1 font-normal select-none">
                                                                                        {formatTime(message.createdAt)}
                                                                                        {isSender && (
                                                                                            <CheckCheck className={`size-3.5 ${message.isRead ? "text-[#53bdeb]" : "text-white/30"}`} />
                                                                                        )}
                                                                                    </span>
                                                                                </BubbleContent>
                                                                            </Bubble>

                                                                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                                                                                <div className={`absolute -bottom-2.5 flex items-center gap-1 bg-[#121216]/90 border border-white/[0.08] backdrop-blur-md rounded-full px-1.5 py-0.5 text-[10px] shadow-lg z-10 hover:scale-105 active:scale-95 transition-all select-none ${
                                                                                    isSender ? "right-2" : "left-2"
                                                                                }`}>
                                                                                    {Array.from(new Set(Object.values(message.reactions))).map((emoji: any) => (
                                                                                        <span key={emoji}>{emoji}</span>
                                                                                    ))}
                                                                                    <span className="text-[9px] text-zinc-400 ml-0.5 font-bold">
                                                                                        {Object.keys(message.reactions).length}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* Action Menu (Apple Design floating glass pill) */}
                                                                            <div className={`opacity-0 group-hover/row:opacity-100 transition-all duration-200 absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#121215]/90 border border-white/[0.08] p-1 rounded-full shadow-2xl z-10 backdrop-blur-md scale-95 group-hover/row:scale-100 ${
                                                                                isSender ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"
                                                                            }`}>
                                                                                <Button variant="ghost" size="icon" className="size-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 active:scale-90 transition-all" onClick={() => setReplyingToMessage(message)}>
                                                                                    <Reply className="size-4" />
                                                                                </Button>
                                                                                <div className="flex items-center gap-0.5 bg-black/25 rounded-full px-1.5 py-0.5">
                                                                                    {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(emoji => (
                                                                                        <button 
                                                                                            key={emoji}
                                                                                            onClick={() => reactToMessage(message._id, emoji)}
                                                                                            className={`hover:scale-125 p-1 rounded-full text-sm transition-transform active:scale-90 ${message.reactions?.[user?.clerkId || ""] === emoji ? "bg-white/10" : ""}`}
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                                {isSender && (
                                                                                    <Button variant="ghost" size="icon" className="size-7 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-90 transition-all" onClick={() => deleteMessage(message._id)}>
                                                                                        <Trash className="size-4" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </MessageContent>
                                                                    </Message>
                                                                );
                                                            })}
                                                        </MessageGroup>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
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
        <div className='flex flex-col items-center justify-center h-full relative overflow-hidden bg-transparent w-full'>
            {/* Deep background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent z-0" />
            
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
                    className='text-zinc-400 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed px-4 font-medium'
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
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-full shadow-lg shadow-emerald-950/20 transition-all hover:scale-105 border-0 h-12 text-sm font-semibold"
                    >
                        <Users className="size-4 mr-2" />
                        Explore Friends
                    </Button>
                </motion.div>
            </div>
            
            {/* Bottom waves (CSS aesthetic) */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent z-0 pointer-events-none" />
            <div className="absolute bottom-6 text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-semibold z-10 flex items-center gap-2">
                <Music2 className="size-3" />
                MUSIC BRINGS US TOGETHER
            </div>
        </div>
    );
};