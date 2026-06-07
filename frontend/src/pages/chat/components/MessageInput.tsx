import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useUser } from "@clerk/clerk-react";
import { Send, X, Paperclip, Mic, Square, Loader2, Smile, Play, Pause, Volume2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const MessageInput = () => {
	const [newMessage, setNewMessage] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const emojis = ['😊', '😂', '🥺', '❤️', '🔥', '👍', '🙏', '😢', '😮', '🥳', '😎', '✨', '🎶', '🎧', '🎸', '🎹'];
	
	// Image State
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Voice State
	const [isRecording, setIsRecording] = useState(false);
	const [recordingDuration, setRecordingDuration] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
	const [isPlayingPreview, setIsPlayingPreview] = useState(false);
	const previewAudioRef = useRef<HTMLAudioElement | null>(null);
	
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<BlobPart[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const { user } = useUser();
	const { selectedUser, sendMessage, replyingToMessage, setReplyingToMessage } = useChatStore();

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
				mediaRecorderRef.current.stop();
			}
		};
	}, []);

	useEffect(() => {
		return () => {
			if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
		};
	}, [audioPreviewUrl]);

	useEffect(() => {
		return () => {
			if (imagePreview) URL.revokeObjectURL(imagePreview);
		};
	}, [imagePreview]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) return;

		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
				setAudioBlob(audioBlob);
				setAudioPreviewUrl(URL.createObjectURL(audioBlob));
				stream.getTracks().forEach((track) => track.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
			setRecordingDuration(0);
			timerRef.current = setInterval(() => {
				setRecordingDuration((prev) => prev + 1);
			}, 1000);
		} catch (error) {
			console.error("Error accessing microphone:", error);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
			if (timerRef.current) clearInterval(timerRef.current);
		}
	};

	const cancelRecording = () => {
		setAudioBlob(null);
		if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
		setAudioPreviewUrl(null);
		setRecordingDuration(0);
		setIsPlayingPreview(false);
	};

	const togglePreviewPlay = () => {
		if (previewAudioRef.current) {
			if (isPlayingPreview) {
				previewAudioRef.current.pause();
			} else {
				previewAudioRef.current.play();
			}
			setIsPlayingPreview(!isPlayingPreview);
		}
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const uploadMedia = async (file: File | Blob, filename: string): Promise<string | null> => {
		try {
			const formData = new FormData();
			formData.append("media", file, filename);
			const res = await axiosInstance.post("/users/messages/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return res.data.url;
		} catch (error) {
			console.error("Upload error:", error);
			return null;
		}
	};

	const handleSend = async () => {
		if (!selectedUser || !user) return;
		if (!newMessage.trim() && !imageFile && !audioBlob) return;

		setIsUploading(true);
		
		let imageUrl = undefined;
		let voiceNoteUrl = undefined;

		if (imageFile) {
			const uploadedUrl = await uploadMedia(imageFile, imageFile.name);
			if (uploadedUrl) {
				imageUrl = uploadedUrl;
			} else {
				toast.error("Failed to upload image");
				setIsUploading(false);
				return;
			}
		}

		if (audioBlob) {
			const uploadedUrl = await uploadMedia(audioBlob, "voicenote.webm");
			if (uploadedUrl) {
				voiceNoteUrl = uploadedUrl;
			} else {
				toast.error("Failed to upload voice note");
				setIsUploading(false);
				return;
			}
		}

		sendMessage(selectedUser.clerkId, user.id, newMessage.trim(), replyingToMessage?._id, imageUrl, voiceNoteUrl);
		
		setNewMessage("");
		setImageFile(null);
		setImagePreview(null);
		setAudioBlob(null);
		setAudioPreviewUrl(null);
		setIsUploading(false);
		setShowEmojiPicker(false);
	};

	return (
		<div className='p-4 mt-auto border-t border-zinc-800 flex flex-col gap-2'>
			{replyingToMessage && (
				<div className='bg-zinc-800/50 rounded-md p-2 flex items-center justify-between border border-zinc-700/50'>
					<div className='text-sm truncate pr-4 text-zinc-300'>
						<span className='font-semibold text-white mr-2'>
							Replying to {replyingToMessage.senderId === user?.id ? "Yourself" : selectedUser?.fullName}:
						</span>
						{replyingToMessage.content || (replyingToMessage.imageUrl ? "Image" : "Voice Note")}
					</div>
					<Button variant='ghost' size='icon' className='size-6 shrink-0 text-zinc-400 hover:text-white' onClick={() => setReplyingToMessage(null)}>
						<X className='size-4' />
					</Button>
				</div>
			)}
			
			{imagePreview && (
				<div className="relative inline-block mb-2 self-start">
					<img src={imagePreview} alt="Preview" className="h-20 rounded-md border border-zinc-700 object-cover" />
					<button 
						onClick={() => { setImageFile(null); setImagePreview(null); }} 
						className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full p-0.5 text-zinc-400 hover:text-white"
					>
						<X className="size-4" />
					</button>
				</div>
			)}

			{audioBlob && !isRecording && (
				<motion.div 
					initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
					className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 p-2 pr-3 rounded-full mb-2 w-fit shadow-lg shadow-black/20"
				>
					<Button variant="ghost" size="icon" onClick={togglePreviewPlay} className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300">
						{isPlayingPreview ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
					</Button>
					<div className="flex items-center gap-1.5 opacity-70">
						<Volume2 className="size-4 text-emerald-500" />
						<div className="h-1 w-24 bg-zinc-700 rounded-full overflow-hidden">
							<motion.div className="h-full bg-emerald-500" initial={{ width: "0%" }} animate={{ width: isPlayingPreview ? "100%" : "0%" }} transition={{ duration: recordingDuration || 2, ease: "linear", repeat: isPlayingPreview ? Infinity : 0 }} />
						</div>
					</div>
					<span className="text-xs font-mono text-zinc-400">{formatDuration(recordingDuration)}</span>
					<Button variant="ghost" size="icon" onClick={cancelRecording} className="h-6 w-6 rounded-full text-red-400 hover:text-red-300 hover:bg-red-400/20 ml-2">
						<X className="size-3" />
					</Button>
					<audio 
						ref={previewAudioRef} 
						src={audioPreviewUrl!} 
						onEnded={() => setIsPlayingPreview(false)} 
						className="hidden" 
					/>
				</motion.div>
			)}

			<div className='flex gap-2 items-center'>
				{isRecording ? (
					<motion.div 
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						className="flex-1 flex items-center gap-4 bg-zinc-900 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)] rounded-full px-4 py-2"
					>
						<div className="flex items-center gap-2">
							<motion.div 
								animate={{ opacity: [1, 0.3, 1] }} 
								transition={{ repeat: Infinity, duration: 1.5 }}
								className="size-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
							/>
							<span className="text-red-400 font-mono text-sm tracking-wider font-medium">{formatDuration(recordingDuration)}</span>
						</div>
						
						{/* Simulated Audio Wave */}
						<div className="flex-1 flex items-center justify-center gap-1 opacity-70">
							{[1, 2, 3, 4, 5, 6, 7].map((i) => (
								<motion.div
									key={i}
									className="w-1 bg-red-400 rounded-full"
									animate={{ height: ['10px', '24px', '10px'] }}
									transition={{ repeat: Infinity, duration: 0.8 + (i * 0.1), delay: i * 0.1 }}
								/>
							))}
						</div>

						<Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full h-8 px-3" onClick={stopRecording}>
							<Square className="size-3.5 mr-1.5" /> Stop
						</Button>
					</motion.div>
				) : (
					<>
						<input 
							type="file" 
							accept="image/*" 
							className="hidden" 
							ref={fileInputRef} 
							onChange={handleImageChange} 
						/>
						<Button 
							variant="ghost" 
							size="icon" 
							className="text-zinc-400 hover:text-white shrink-0" 
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading || !!audioBlob}
						>
							<Paperclip className="size-5" />
						</Button>

						<div className="relative">
							<Button 
								variant="ghost" 
								size="icon" 
								className={`shrink-0 transition-colors ${showEmojiPicker ? "text-emerald-400 bg-emerald-400/10" : "text-zinc-400 hover:text-white"}`}
								onClick={() => setShowEmojiPicker(!showEmojiPicker)}
								disabled={isUploading || !!audioBlob}
							>
								<Smile className="size-5" />
							</Button>
							
							<AnimatePresence>
								{showEmojiPicker && (
									<motion.div 
										initial={{ opacity: 0, scale: 0.9, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.9, y: 10 }}
										className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-3 w-64 z-50 grid grid-cols-6 gap-2"
									>
										{emojis.map(emoji => (
											<button 
												key={emoji}
												onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }}
												className="text-xl hover:bg-zinc-800 rounded-md p-1 transition-transform hover:scale-125"
											>
												{emoji}
											</button>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						<Input
							placeholder='Type a message...'
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							className='flex-1 min-w-0 bg-zinc-800 border-none'
							onKeyDown={(e) => e.key === "Enter" && handleSend()}
							disabled={isUploading || !!audioBlob}
						/>

						<Button 
							variant="ghost" 
							size="icon" 
							className="text-zinc-400 hover:text-emerald-400 shrink-0"
							onMouseDown={startRecording}
							disabled={isUploading || !!imageFile || !!audioBlob || newMessage.length > 0}
						>
							<Mic className="size-5" />
						</Button>
					</>
				)}

				<Button 
					size="icon" 
					onClick={handleSend} 
					disabled={isUploading || isRecording || (!newMessage.trim() && !imageFile && !audioBlob)} 
					className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white"
				>
					{isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className='size-4' />}
				</Button>
			</div>
		</div>
	);
};
export default MessageInput;