import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { 
  Laptop2, 
  ListMusic, 
  Mic2, 
  Pause, 
  Play, 
  Repeat, 
  Shuffle, 
  SkipBack, 
  SkipForward, 
  Volume1, 
  VolumeX, 
  ChevronDown, 
  MoreHorizontal 
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LikeButton } from "@/components/LikeButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useStore as useSpotifyStore } from "@/Features/SpotifyPlayer/store/PlayerStore";
import { api as spotifyApi } from "@/Features/SpotifyPlayer/services/spotifyApi";


const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const PlaybackControls = () => {
	const { 
		currentSong, 
		isPlaying: localIsPlaying, 
		togglePlay, 
		playNext, 
		playPrevious, 
		isShuffled, 
		isLooping, 
		toggleShuffle, 
		toggleLoop,
		lyrics,
		isLoadingLyrics,
		fetchLyrics
	} = usePlayerStore();

	const spotifyStore = useSpotifyStore();
	const isSpotifyTrack = currentSong?.audioUrl?.startsWith("spotify:");

	const isPlaying = isSpotifyTrack ? spotifyStore.isPlaying : localIsPlaying;
	const shuffleActive = isSpotifyTrack ? spotifyStore.shuffle : isShuffled;
	const repeatActive = isSpotifyTrack ? spotifyStore.repeat !== "off" : isLooping;

	const handleTogglePlay = async () => {
		if (isSpotifyTrack) {
			try {
				if (spotifyStore.isPlaying) {
					await spotifyApi.pause();
					spotifyStore.setPlaybackState({ isPlaying: false });
				} else {
					await spotifyApi.play();
					spotifyStore.setPlaybackState({ isPlaying: true });
				}
			} catch (e) {
				console.error("Spotify toggle play error:", e);
			}
		} else {
			togglePlay();
		}
	};

	const handlePlayNext = async () => {
		if (isSpotifyTrack) {
			try {
				await spotifyApi.next();
			} catch (e) {
				console.error("Spotify next error:", e);
			}
		} else {
			playNext();
		}
	};

	const handlePlayPrevious = async () => {
		if (isSpotifyTrack) {
			try {
				await spotifyApi.prev();
			} catch (e) {
				console.error("Spotify prev error:", e);
			}
		} else {
			playPrevious();
		}
	};

	const handleToggleShuffle = async () => {
		if (isSpotifyTrack) {
			const next = !spotifyStore.shuffle;
			spotifyStore.setPlaybackState({ shuffle: next });
			try {
				await spotifyApi.shuffle(next);
			} catch (e) {
				console.error(e);
			}
		} else {
			toggleShuffle();
		}
	};

	const handleToggleRepeat = async () => {
		if (isSpotifyTrack) {
			const repeatCycle: ("off" | "context" | "track")[] = ["off", "context", "track"];
			const next = repeatCycle[(repeatCycle.indexOf(spotifyStore.repeat) + 1) % repeatCycle.length];
			spotifyStore.setPlaybackState({ repeat: next });
			try {
				await spotifyApi.repeat(next);
			} catch (e) {
				console.error(e);
			}
		} else {
			toggleLoop();
		}
	};

	const { currentUser: user } = useAuthStore();
	const navigate = useNavigate();

	const renderArtistLinks = (artistString: string, classNames?: string) => {
		const names = artistString.split(",").map(n => n.trim());
		return (
			<span className={classNames}>
				{names.map((name, i) => (
					<span key={name}>
						<span 
							onClick={(e) => {
								e.stopPropagation();
								setIsPreviewOpen(false);
								navigate(`/artists/${encodeURIComponent(name)}`);
							}}
							className="hover:underline hover:text-white cursor-pointer transition-colors"
						>
							{name}
						</span>
						{i < names.length - 1 && ", "}
					</span>
				))}
			</span>
		);
	};

	const [volume, setVolume] = useState(75);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [currentDevice, setCurrentDevice] = useState("SociTune Web Player");
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"details" | "lyrics" | "queue">("details");

	const songLyrics = currentSong ? lyrics[currentSong._id] : null;

	useEffect(() => {
		if (currentSong && activeTab === "lyrics") {
			fetchLyrics(currentSong._id);
		}
	}, [currentSong, activeTab, fetchLyrics]);

	const toggleMute = () => {
		if (!audioRef.current) return;
		audioRef.current.muted = !isMuted;
		setIsMuted(!isMuted);
	};

	useEffect(() => {
		const getAudioDevice = async () => {
			try {
				if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
					return;
				}
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
				const defaultDevice = audioOutputs.find(d => d.deviceId === 'default') || audioOutputs[0];
				
				if (defaultDevice && defaultDevice.label) {
					setCurrentDevice(defaultDevice.label);
				} else if (audioOutputs.length > 0 && audioOutputs[0].label) {
					setCurrentDevice(audioOutputs[0].label);
				} else {
					setCurrentDevice("SociTune Web Player");
				}
			} catch (error) {
				console.error("Error getting audio devices", error);
			}
		};

		getAudioDevice();

		if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
			navigator.mediaDevices.addEventListener('devicechange', getAudioDevice);
			return () => {
				navigator.mediaDevices.removeEventListener('devicechange', getAudioDevice);
			};
		}
	}, []);

	useEffect(() => {
		if (isSpotifyTrack) {
			setCurrentTime(spotifyStore.position / 1000);
			setDuration(spotifyStore.duration / 1000);
		}
	}, [isSpotifyTrack, spotifyStore.position, spotifyStore.duration]);

	useEffect(() => {
		audioRef.current = document.querySelector("audio");

		const audio = audioRef.current;
		if (!audio) return;

		const updateTime = () => {
			if (!isSpotifyTrack) {
				setCurrentTime(audio.currentTime);
			}
		};
		const updateDuration = () => {
			if (!isSpotifyTrack) {
				setDuration(audio.duration);
			}
		};

		audio.addEventListener("timeupdate", updateTime);
		audio.addEventListener("loadedmetadata", updateDuration);

		const handleEnded = () => {
			if (!isSpotifyTrack) {
				usePlayerStore.setState({ isPlaying: false });
			}
		};

		audio.addEventListener("ended", handleEnded);

		return () => {
			audio.removeEventListener("timeupdate", updateTime);
			audio.removeEventListener("loadedmetadata", updateDuration);
			audio.removeEventListener("ended", handleEnded);
		};
	}, [currentSong, isSpotifyTrack]);

	const handleSeek = (value: number[]) => {
		if (isSpotifyTrack) {
			const ms = value[0] * 1000;
			spotifyStore.setPosition(ms);
			spotifyApi.seek(ms).catch(console.error);
		} else if (audioRef.current) {
			audioRef.current.currentTime = value[0];
		}
	};

	return (
		<>
			<footer className='h-20 sm:h-24 bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-white/[0.05] px-6 relative z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]'>
				{/* Top edge subtle gloss sheen */}
				<div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none" />
				
				<div className='flex justify-between items-center h-full max-w-[1800px] mx-auto'>
					{/* currently playing song */}
					<div 
						className={`hidden sm:flex items-center gap-3.5 min-w-[180px] w-[30%] ${currentSong ? 'cursor-pointer group/playing-bar' : ''}`}
						onClick={(e) => {
							const target = e.target as HTMLElement;
							if (target.closest('.like-btn-container')) return;
							if (currentSong) setIsPreviewOpen(true);
						}}
					>
						{currentSong && (
							<>
								<div className="relative overflow-hidden rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.5)] border border-white/5 group-hover/playing-bar:scale-[1.03] transition-all duration-300">
									<img
										src={currentSong.imageUrl}
										alt={currentSong.title}
										className='w-12 h-12 object-cover'
									/>
								</div>
								<div className='flex-1 min-w-0'>
									<div className='font-semibold text-[14px] text-white/90 truncate hover:text-emerald-400 hover:underline transition-colors leading-snug'>
										{currentSong.title}
									</div>
									<div className='text-xs text-zinc-400 truncate mt-0.5'>
										{renderArtistLinks(currentSong.artist)}
									</div>
								</div>
								<div className="like-btn-container transition-transform hover:scale-105 active:scale-95">
									<LikeButton songId={currentSong._id} className="ml-1 text-zinc-400 hover:text-emerald-500" />
								</div>
							</>
						)}
					</div>

					{/* player controls*/}
					<div className='flex flex-col items-center gap-2 flex-1 max-w-full sm:max-w-[45%]'>
						<div className='flex items-center gap-4 sm:gap-6'>
							<Button
								size='icon'
								variant='ghost'
								className={`hidden sm:inline-flex hover:text-white hover:bg-transparent transition-all ${shuffleActive ? "text-emerald-500 hover:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-zinc-400"}`}
								onClick={handleToggleShuffle}
							>
								<Shuffle className='h-4 w-4' />
							</Button>

							<Button
								size='icon'
								variant='ghost'
								className='hover:text-white text-zinc-400 hover:bg-transparent active:scale-90 transition-all'
								onClick={handlePlayPrevious}
								disabled={!currentSong}
							>
								<SkipBack className='h-4 w-4 fill-zinc-400 hover:fill-white transition-all' />
							</Button>

							<Button
								size='icon'
								className='bg-white hover:bg-white/90 text-black rounded-full h-10 w-10 flex items-center justify-center shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all'
								onClick={handleTogglePlay}
								disabled={!currentSong}
							>
								{isPlaying ? <Pause className='h-5 w-5 fill-black' /> : <Play className='h-5 w-5 fill-black ml-0.5' />}
							</Button>
							<Button
								size='icon'
								variant='ghost'
								className='hover:text-white text-zinc-400 hover:bg-transparent active:scale-90 transition-all'
								onClick={handlePlayNext}
								disabled={!currentSong}
							>
								<SkipForward className='h-4 w-4 fill-zinc-400 hover:fill-white transition-all' />
							</Button>
							<Button
								size='icon'
								variant='ghost'
								className={`hidden sm:inline-flex hover:text-white hover:bg-transparent transition-all ${repeatActive ? "text-emerald-500 hover:text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-zinc-400"}`}
								onClick={handleToggleRepeat}
							>
								<Repeat className='h-4 w-4' />
							</Button>
						</div>

						<div className='hidden sm:flex items-center gap-3 w-full group/slider'>
							<div className='text-[10px] font-semibold text-zinc-500 tracking-wider w-8 text-right font-mono tabular-nums'>{formatTime(currentTime)}</div>
							<Slider
								value={[currentTime]}
								max={duration || 100}
								step={1}
								className='w-full cursor-pointer hover:cursor-grab active:cursor-grabbing group-hover/slider:[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-zinc-800 [&_[data-slot=slider-track]]:transition-all [&_[data-slot=slider-range]]:bg-emerald-500 hover:[&_[data-slot=slider-thumb]]:scale-100 [&_[data-slot=slider-thumb]]:scale-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:transition-all'
								onValueChange={handleSeek}
							/>
							<div className='text-[10px] font-semibold text-zinc-500 tracking-wider w-8 text-left font-mono tabular-nums'>
								{duration ? `-${formatTime(Math.max(0, duration - currentTime))}` : "0:00"}
							</div>
						</div>
					</div>

					{/* volume controls */}
					<div className='hidden sm:flex items-center gap-4 min-w-[180px] w-[30%] justify-end'>
						<Button 
							size='icon' 
							variant='ghost' 
							className={`hover:text-white hover:bg-transparent transition-colors ${isPreviewOpen && activeTab === "lyrics" ? "text-emerald-400" : "text-zinc-400"}`}
							onClick={() => {
								if (currentSong) {
									setActiveTab("lyrics");
									setIsPreviewOpen(true);
								}
							}}
						>
							<Mic2 className='h-4 w-4' />
						</Button>
						<Button 
							size='icon' 
							variant='ghost' 
							className={`hover:text-white hover:bg-transparent transition-colors ${isPreviewOpen && activeTab === "queue" ? "text-emerald-400" : "text-zinc-400"}`}
							onClick={() => {
								if (currentSong) {
									setActiveTab("queue");
									setIsPreviewOpen(true);
								}
							}}
						>
							<ListMusic className='h-4 w-4' />
						</Button>
						<div className="relative group">
							<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400 hover:bg-transparent transition-colors'>
								<Laptop2 className='h-4 w-4' />
							</Button>
							<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-max bg-zinc-900 border border-white/[0.08] text-[11px] p-2.5 rounded-lg shadow-xl z-50 backdrop-blur-md">
								<p className="font-semibold text-zinc-400 mb-0.5">Current Device</p>
								<p className="text-emerald-400 flex items-center gap-1.5 font-medium"><Laptop2 className="size-3" /> {currentDevice}</p>
							</div>
						</div>

						<div className='flex items-center gap-2 group/volume'>
							<Button size='icon' variant='ghost' className='hover:text-white text-zinc-400 hover:bg-transparent transition-colors' onClick={toggleMute}>
								{isMuted ? <VolumeX className='h-4 w-4' /> : <Volume1 className='h-4 w-4' />}
							</Button>

							<Slider
								value={[volume]}
								max={100}
								step={1}
								className='w-24 cursor-pointer group-hover/volume:[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:h-1 [&_[data-slot=slider-track]]:bg-zinc-800 [&_[data-slot=slider-track]]:transition-all [&_[data-slot=slider-range]]:bg-emerald-500 hover:[&_[data-slot=slider-thumb]]:scale-100 [&_[data-slot=slider-thumb]]:scale-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:transition-all'
								onValueChange={(value) => {
									setVolume(value[0]);
									if (audioRef.current) {
										audioRef.current.volume = value[0] / 100;
										if (isMuted && value[0] > 0) {
											audioRef.current.muted = false;
											setIsMuted(false);
										} else if (!isMuted && value[0] === 0) {
											audioRef.current.muted = true;
											setIsMuted(true);
										}
									}
								}}
							/>
						</div>
					</div>
				</div>
			</footer>

			{/* Fullscreen Now Playing Preview Modal Overlay */}
			{currentSong && isPreviewOpen && (
				<div className="fixed inset-0 z-[9999] bg-[#050507] flex flex-col p-6 sm:p-10 font-['Poppins'] animate-in fade-in duration-300 select-none overflow-hidden h-screen w-screen">
					
					{/* Ambient Blurred Album Art Background with Apple Music organic shift animation */}
					<div 
						className="absolute inset-0 bg-cover bg-center filter blur-[130px] opacity-[0.55] pointer-events-none transition-all duration-700 animate-ambient-glow" 
						style={{ backgroundImage: `url(${currentSong.imageUrl})` }}
					/>
					<div className="absolute inset-0 bg-noise opacity-[0.06] pointer-events-none" />
					<div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/55 to-[#040406] pointer-events-none" />

					{/* Top header navigation row */}
					<div className="flex items-center justify-between relative z-10 w-full max-w-lg mx-auto mb-6">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsPreviewOpen(false)}
							className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10 transition-colors"
						>
							<ChevronDown size={24} />
						</Button>
						
						<div className="text-center">
							<p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Playing from library</p>
							<p className="text-xs text-white font-semibold truncate max-w-[200px]">{currentSong.title}</p>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10 transition-colors"
						>
							<MoreHorizontal size={24} />
						</Button>
					</div>

					{/* Tabs */}
					<div className="flex justify-center gap-6 relative z-10 mb-2">
						<button 
							onClick={() => setActiveTab("details")}
							className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all duration-200 ${
								activeTab === "details" 
									? "text-emerald-400 border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
									: "text-zinc-500 border-transparent hover:text-zinc-300"
							}`}
						>
							Artwork
						</button>
						<button 
							onClick={() => setActiveTab("lyrics")}
							className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all duration-200 ${
								activeTab === "lyrics" 
									? "text-emerald-400 border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
									: "text-zinc-500 border-transparent hover:text-zinc-300"
							}`}
						>
							Lyrics
						</button>
						<button 
							onClick={() => setActiveTab("queue")}
							className={`text-xs font-bold uppercase tracking-wider pb-1.5 border-b-2 transition-all duration-200 ${
								activeTab === "queue" 
									? "text-emerald-400 border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
									: "text-zinc-500 border-transparent hover:text-zinc-300"
							}`}
						>
							Queue
						</button>
					</div>

					{/* Middle Content - Apple Music Responsive Layout */}
					<div className={`flex-1 flex relative z-10 w-full mx-auto my-4 overflow-hidden transition-all duration-500 ${
						activeTab === "lyrics" 
							? "max-w-5xl flex-col md:flex-row gap-10 items-stretch justify-center px-4" 
							: activeTab === "queue"
								? "max-w-3xl flex-col items-stretch justify-start px-4"
								: "max-w-lg flex-col items-center justify-center"
					}`}>
						{activeTab === "details" ? (
							<div className="relative aspect-square w-64 h-64 sm:w-80 sm:h-80 mb-8 flex justify-center items-center">
								{/* Outer ambient glow */}
								<div className="absolute inset-0 rounded-[32px] bg-emerald-500/10 blur-3xl pointer-events-none" />
								<img
									src={currentSong.imageUrl}
									alt={currentSong.title}
									className="w-full h-full object-cover rounded-2xl sm:rounded-[32px] shadow-[0_24px_50px_rgba(0,0,0,0.7)] border border-white/[0.08] relative z-10 transition-transform duration-500 hover:scale-[1.02]"
								/>
							</div>
						) : activeTab === "lyrics" ? (
							<>
								{/* Left Column (Artwork & Song Details) - Only on Desktop for Lyrics view */}
								<div className="hidden md:flex flex-col justify-center items-center w-[35%] gap-6 shrink-0 text-center select-none">
									<div className="relative aspect-square w-64 h-64 flex justify-center items-center">
										{/* Ambient glow under artwork */}
										<div className="absolute inset-0 rounded-[24px] bg-white/5 blur-2xl pointer-events-none" />
										<img
											src={currentSong.imageUrl}
											alt={currentSong.title}
											className="w-full h-full object-cover rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/[0.08] relative z-10"
										/>
									</div>
									<div className="max-w-full px-2">
										<h3 className="text-2xl font-extrabold text-white leading-tight truncate">
											{currentSong.title}
										</h3>
										<p className="text-zinc-400 font-semibold text-sm mt-1 truncate">
											{renderArtistLinks(currentSong.artist)}
										</p>
									</div>
								</div>

								{/* Right Column (Scrollable Lyrics list) */}
								<div className="flex-1 w-full md:w-[65%] flex flex-col justify-center relative overflow-hidden h-full">
									{isLoadingLyrics ? (
										<div className="flex flex-col items-center justify-center gap-3 h-full">
											<div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
											<span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading lyrics...</span>
										</div>
									) : songLyrics ? (
										<div 
											className="w-full h-[40vh] md:h-[480px] overflow-y-auto pr-6 text-left select-text scroll-smooth [&::-webkit-scrollbar]:hidden flex flex-col gap-6"
											style={{ scrollbarWidth: 'none' }}
										>
											{songLyrics.split("\n").map((line, idx) => (
												<p 
													key={idx} 
													className="transition-all duration-300 hover:text-white hover:translate-x-2 origin-left cursor-default text-white/35 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight"
												>
													{line || "\u00A0"}
												</p>
											))}
										</div>
									) : (
										<div className="text-center p-8 flex flex-col items-center justify-center h-full">
											<Mic2 className="size-10 text-zinc-600 mb-3 animate-pulse" />
											<p className="text-zinc-400 font-bold text-base">Lyrics unavailable</p>
											<p className="text-zinc-600 text-sm mt-1">No lyrics found for this song.</p>
										</div>
									)}
								</div>
							</>
						) : (
							/* activeTab === "queue" */
							<div className="flex-1 w-full flex flex-col relative overflow-hidden h-full">
								<div className="flex justify-between items-center mb-4 px-2 select-none">
									<h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Up Next</h4>
									<Button 
										variant="ghost" 
										size="sm" 
										onClick={() => usePlayerStore.setState({ queue: [], currentIndex: -1 })}
										className="text-xs text-zinc-500 hover:text-rose-400 p-0 h-auto hover:bg-transparent"
									>
										Clear Queue
									</Button>
								</div>
								{usePlayerStore.getState().queue.length === 0 ? (
									<div className="text-center p-8 flex flex-col items-center justify-center h-full select-none">
										<ListMusic className="size-10 text-zinc-600 mb-3 animate-pulse" />
										<p className="text-zinc-400 font-bold text-base">Queue is empty</p>
										<p className="text-zinc-600 text-sm mt-1">Play an album or add songs to lineup.</p>
									</div>
								) : (
									<div 
										className="w-full h-[40vh] md:h-[480px] overflow-y-auto pr-6 text-left select-none scroll-smooth [&::-webkit-scrollbar]:hidden flex flex-col gap-2 pb-10"
										style={{ scrollbarWidth: 'none' }}
									>
										{usePlayerStore.getState().queue.map((song, idx) => {
											const isCurrent = idx === usePlayerStore.getState().currentIndex;
											return (
												<div 
													key={song._id + idx}
													onClick={() => {
														usePlayerStore.setState({ 
															currentSong: song, 
															currentIndex: idx, 
															isPlaying: true 
														});
													}}
													className={`flex items-center gap-3.5 p-2 rounded-xl transition-all duration-300 cursor-pointer ${
														isCurrent 
															? "bg-emerald-500/10 border border-emerald-500/20 text-white font-bold" 
															: "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent text-zinc-300 hover:text-white"
													}`}
												>
													<div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
														<img src={song.imageUrl} alt="" className="w-full h-full object-cover" />
														{isCurrent && (
															<div className="absolute inset-0 bg-black/40 flex items-center justify-center">
																<div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
															</div>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<p className={`text-sm truncate ${isCurrent ? "text-emerald-400" : ""}`}>{song.title}</p>
														<p className="text-xs text-zinc-500 truncate mt-0.5">{song.artist}</p>
													</div>
													<div className="text-[11px] font-mono text-zinc-500 font-bold tabular-nums">
														{formatTime(song.duration)}
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Bottom Playback area with clean glass panel */}
					<div className="relative z-10 w-full max-w-lg mx-auto mb-8">
						<div className="bg-white/[0.03] border border-white/[0.06] rounded-[32px] p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
							
							{/* Title, Artist and Like Button Row */}
							<div className="flex items-center justify-between mb-6 px-1">
								<div className="text-left flex-1 min-w-0 pr-4">
									<h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1 truncate">
										{currentSong.title}
									</h2>
									<p className="text-sm sm:text-base text-zinc-400 font-semibold truncate">
										{renderArtistLinks(currentSong.artist)}
									</p>
								</div>
								<div className="like-btn-container flex-shrink-0 scale-125">
									<LikeButton songId={currentSong._id} className="text-zinc-400 hover:text-emerald-400" />
								</div>
							</div>

							{/* Progress Bar slider following theme */}
							<div className="space-y-2 mb-6">
								<Slider
									value={[currentTime]}
									max={duration || 100}
									step={1}
									onValueChange={handleSeek}
									className="w-full cursor-pointer hover:scale-[1.01] transition-transform [&_[data-slot=slider-track]]:bg-zinc-800 [&_[data-slot=slider-range]]:bg-emerald-500"
								/>
								<div className="flex justify-between text-[11px] text-zinc-500 font-bold px-1 font-mono tabular-nums">
									<span>{formatTime(currentTime)}</span>
									<span>{duration ? `-${formatTime(Math.max(0, duration - currentTime))}` : "0:00"}</span>
								</div>
							</div>

							{/* Buttons controls row with emerald highlights */}
							<div className="flex items-center justify-between px-2 mb-6">
								<Button
									variant="ghost"
									size="icon"
									className={`hover:text-white transition-all h-10 w-10 ${shuffleActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-zinc-400"}`}
									onClick={handleToggleShuffle}
								>
									<Shuffle size={20} />
								</Button>

								<Button
									variant="ghost"
									size="icon"
									className="text-zinc-400 hover:text-white transition-all h-10 w-10 active:scale-90"
									onClick={handlePlayPrevious}
									disabled={!currentSong}
								>
									<SkipBack size={24} fill="currentColor" />
								</Button>

								<Button
									size="icon"
									onClick={handleTogglePlay}
									className="bg-white hover:bg-white/90 text-black rounded-full h-14 w-14 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
								>
									{isPlaying ? (
										<Pause size={24} fill="black" className="text-black" />
									) : (
										<Play size={24} fill="black" className="text-black ml-1" />
									)}
								</Button>

								<Button
									variant="ghost"
									size="icon"
									className="text-zinc-400 hover:text-white transition-all h-10 w-10 active:scale-90"
									onClick={handlePlayNext}
									disabled={!currentSong}
								>
									<SkipForward size={24} fill="currentColor" />
								</Button>

								<Button
									variant="ghost"
									size="icon"
									className={`hover:text-white transition-all h-10 w-10 ${repeatActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-zinc-400"}`}
									onClick={handleToggleRepeat}
								>
									<Repeat size={20} />
								</Button>
							</div>

							{/* Bottom controls row */}
							<div className="flex justify-center gap-12 border-t border-white/[0.04] pt-4 text-zinc-500">
								<Button 
									variant="ghost" 
									size="icon" 
									className={`hover:text-white p-0 h-auto transition-colors ${activeTab === "queue" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-zinc-500"}`}
									onClick={() => setActiveTab(activeTab === "queue" ? "details" : "queue")}
								>
									<ListMusic size={18} />
								</Button>
								<Button 
									variant="ghost" 
									size="icon" 
									className={`hover:text-white p-0 h-auto transition-colors ${activeTab === "lyrics" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-zinc-500"}`}
									onClick={() => setActiveTab(activeTab === "lyrics" ? "details" : "lyrics")}
								>
									<Mic2 size={18} />
								</Button>
								<Button variant="ghost" size="icon" className="hover:text-white p-0 h-auto">
									<Laptop2 size={18} />
								</Button>
							</div>
						</div>
					</div>

					{/* Bottom-left user profile circle */}
					<div className="absolute bottom-6 left-6 z-20">
						{user ? (
							<div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 text-white font-bold text-sm shadow-lg overflow-hidden">
								{user.imageUrl ? (
									<img src={user.imageUrl} className="w-full h-full object-cover" />
								) : (
									(user.displayName || user.fullName || "U").charAt(0)
								)}
							</div>
						) : (
							<div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-800 border border-white/10 text-white font-bold text-sm shadow-lg">
								A
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
};