import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useMusicStore } from "@/stores/useMusicStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import {
  Play,
  Pause,
  SkipForward,
  MessageSquare,
  Users,
  Info,
  Crown,
  ListMusic,
  Send,
  Zap,
  Globe,
  Lock,
  Plus,
  Radio,
  Heart,
  Check,
  X,
} from "lucide-react";

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser: user } = useAuthStore();
  const { socket } = useChatStore();
  const { songs, fetchSongs, likedSongs, fetchLikedSongs, toggleLikeSong } = useMusicStore();
  const { currentSong: playerSong, setCurrentSong: setPlayerSong } = usePlayerStore();
  const {
    activeRoom,
    chatMessages,
    floatingReactions,
    fetchRoom,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendReaction,
    updatePlaybackState,
    transferDJ,
    addReactionLocal,
  } = useRoomStore();

  const [chatInput, setChatInput] = useState("");
  const [songSearch, setSongSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<any>(null);

  const isHost = activeRoom?.hostId === user?.clerkId;

  useEffect(() => {
    fetchSongs();
    fetchLikedSongs();
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom, fetchSongs, fetchLikedSongs]);

  // Audio Playback Synchronizer
  useEffect(() => {
    const roomSong = activeRoom?.currentSong;
    if (roomSong && roomSong.songId && roomSong.audioUrl) {
      const songObject = {
        _id: roomSong.songId,
        title: roomSong.title,
        artist: roomSong.artist,
        imageUrl: roomSong.imageUrl,
        audioUrl: roomSong.audioUrl,
        duration: roomSong.duration,
      } as any;

      // Sync active song in player
      if (!playerSong || playerSong._id !== roomSong.songId) {
        setPlayerSong(songObject);
      }

      // Sync play/pause state
      const shouldBePlaying = roomSong.isPlaying;
      if (usePlayerStore.getState().isPlaying !== shouldBePlaying) {
        usePlayerStore.setState({ isPlaying: shouldBePlaying });
      }

      // Sync playback time matching host offset
      const startedAt = roomSong.startedAt ? new Date(roomSong.startedAt).getTime() : Date.now();
      const elapsedSec = roomSong.isPlaying ? (Date.now() - startedAt) / 1000 : 0;
      const targetTime = Math.max(0, Math.min(roomSong.duration, (roomSong.progress || 0) + elapsedSec));

      const audioEl = document.querySelector("audio");
      if (audioEl) {
        if (Math.abs(audioEl.currentTime - targetTime) > 3) {
          audioEl.currentTime = targetTime;
        }
      }
    } else {
      // Pause playback if no track is active in the room
      if (usePlayerStore.getState().isPlaying) {
        usePlayerStore.setState({ isPlaying: false });
      }
    }
  }, [activeRoom?.currentSong, playerSong, setPlayerSong]);

  // Pause local audio when leaving the room
  useEffect(() => {
    return () => {
      usePlayerStore.setState({ isPlaying: false });
    };
  }, []);

  useEffect(() => {
    if (roomId && socket) {
      joinRoom(roomId, socket);
      return () => {
        leaveRoom(roomId, socket);
      };
    }
  }, [roomId, socket, joinRoom, leaveRoom]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle local song progress emulation
  useEffect(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    const currentSong = activeRoom?.currentSong;
    if (currentSong && currentSong.isPlaying) {
      // Calculate progress starting offset
      const startedAt = currentSong.startedAt ? new Date(currentSong.startedAt).getTime() : Date.now();
      const elapsedMs = Date.now() - startedAt;
      const initialProgressSec = Math.min(
        currentSong.duration,
        Math.floor((currentSong.progress * 1000 + elapsedMs) / 1000)
      );
      setProgress(initialProgressSec);

      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentSong.duration) {
            clearInterval(progressTimerRef.current);
            return currentSong.duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (currentSong) {
      setProgress(currentSong.progress || 0);
    } else {
      setProgress(0);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeRoom?.currentSong]);

  const reducedMotion = useReducedMotion();

  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#09090b] space-y-4">
        <motion.div
          animate={reducedMotion ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="space-y-3 w-48"
        >
          <div className="h-2.5 rounded-full bg-white/8 w-full" />
          <div className="h-2 rounded-full bg-white/5 w-3/4" />
          <div className="h-2 rounded-full bg-white/5 w-1/2" />
        </motion.div>
        <p className="text-xs text-zinc-500">Connecting to lounge...</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;
    sendChatMessage(socket, roomId!, user, chatInput);
    setChatInput("");
  };

  const handleReactionClick = (emoji: string) => {
    if (!socket) return;
    sendReaction(socket, roomId!, emoji);
    // Trigger locally as well
    addReactionLocal(emoji);
  };

  // DJ Controller Playback Triggers
  const handlePlayPause = async () => {
    if (!isHost || !activeRoom.currentSong) return;
    const isPlaying = !activeRoom.currentSong.isPlaying;
    const updatedSong = {
      ...activeRoom.currentSong,
      isPlaying,
      progress: progress,
      startedAt: isPlaying ? new Date() : null,
    };
    await updatePlaybackState(roomId!, updatedSong);
    if (socket) {
      socket.emit("room_playback_update", { roomId, currentSong: updatedSong });
    }
  };

  const handleSelectRequestSong = async (song: any) => {
    if (isHost) {
      // Host adds directly to playback/queue
      if (!activeRoom.currentSong || !activeRoom.currentSong.songId) {
        const firstSong = {
          songId: song._id,
          title: song.title,
          artist: song.artist,
          imageUrl: song.imageUrl,
          audioUrl: song.audioUrl,
          duration: song.duration,
          progress: 0,
          isPlaying: true,
          startedAt: new Date(),
        };
        await updatePlaybackState(roomId!, firstSong);
        if (socket) {
          socket.emit("room_playback_update", { roomId, currentSong: firstSong });
        }
      } else {
        const updatedQueue = [
          ...(activeRoom.queue || []),
          {
            songId: song._id,
            title: song.title,
            artist: song.artist,
            imageUrl: song.imageUrl,
            audioUrl: song.audioUrl,
            duration: song.duration,
            requestedBy: user?.fullName || "DJ Host",
            votes: 0,
          },
        ];
        try {
          await axiosInstance.post(`/rooms/${roomId}/playback`, {
            currentSong: activeRoom.currentSong,
            queue: updatedQueue,
          });
          if (socket) {
            socket.emit("room_playback_update", { roomId, currentSong: activeRoom.currentSong, queue: updatedQueue });
          }
        } catch (err) {
          console.error("Queue add failed:", err);
        }
      }
    } else {
      // Listener submits to requests list
      const updatedRequests = [
        ...(activeRoom.requests || []),
        {
          songId: song._id,
          title: song.title,
          artist: song.artist,
          imageUrl: song.imageUrl,
          audioUrl: song.audioUrl,
          duration: song.duration,
          requestedBy: user?.fullName || "Listener",
          votes: 0,
        },
      ];
      try {
        await axiosInstance.post(`/rooms/${roomId}/playback`, {
          requests: updatedRequests,
        });
        if (socket) {
          socket.emit("room_playback_update", { roomId, requests: updatedRequests });
        }
        toast.success(`Requested "${song.title}"! DJ has been notified.`);
      } catch (err) {
        console.error("Failed to request song:", err);
      }
    }
    setSongSearch("");
  };

  const handleApproveRequest = async (reqSong: any) => {
    if (!isHost) return;
    const updatedRequests = (activeRoom.requests || []).filter((r: any) => r.songId !== reqSong.songId);

    if (!activeRoom.currentSong || !activeRoom.currentSong.songId) {
      const firstSong = {
        songId: reqSong.songId,
        title: reqSong.title,
        artist: reqSong.artist,
        imageUrl: reqSong.imageUrl,
        audioUrl: reqSong.audioUrl,
        duration: reqSong.duration,
        progress: 0,
        isPlaying: true,
        startedAt: new Date(),
      };
      try {
        await axiosInstance.post(`/rooms/${roomId}/playback`, {
          currentSong: firstSong,
          requests: updatedRequests,
        });
        if (socket) {
          socket.emit("room_playback_update", { roomId, currentSong: firstSong, requests: updatedRequests });
        }
        toast.success(`Now playing requested song: "${reqSong.title}"`);
      } catch (err) {
        console.error("Failed to play requested song:", err);
      }
    } else {
      const updatedQueue = [
        ...(activeRoom.queue || []),
        {
          songId: reqSong.songId,
          title: reqSong.title,
          artist: reqSong.artist,
          imageUrl: reqSong.imageUrl,
          audioUrl: reqSong.audioUrl,
          duration: reqSong.duration,
          requestedBy: reqSong.requestedBy || "Listener",
          votes: 0,
        },
      ];
      try {
        await axiosInstance.post(`/rooms/${roomId}/playback`, {
          queue: updatedQueue,
          requests: updatedRequests,
        });
        if (socket) {
          socket.emit("room_playback_update", { roomId, queue: updatedQueue, requests: updatedRequests });
        }
        toast.success(`Approved "${reqSong.title}" to lineup!`);
      } catch (err) {
        console.error("Failed to approve request:", err);
      }
    }
  };

  const handleDeclineRequest = async (reqSong: any) => {
    if (!isHost) return;
    const updatedRequests = (activeRoom.requests || []).filter((r: any) => r.songId !== reqSong.songId);
    try {
      await axiosInstance.post(`/rooms/${roomId}/playback`, {
        requests: updatedRequests,
      });
      if (socket) {
        socket.emit("room_playback_update", { roomId, requests: updatedRequests });
      }
      toast.success("Request dismissed");
    } catch (err) {
      console.error("Failed to decline request:", err);
    }
  };

  const handleRemoveFromQueue = async (indexToRemove: number) => {
    if (!isHost) return;
    const updatedQueue = (activeRoom.queue || []).filter((_: any, idx: number) => idx !== indexToRemove);
    try {
      await axiosInstance.post(`/rooms/${roomId}/playback`, {
        currentSong: activeRoom.currentSong,
        queue: updatedQueue,
      });
      if (socket) {
        socket.emit("room_playback_update", { roomId, currentSong: activeRoom.currentSong, queue: updatedQueue });
      }
      toast.success("Removed from lineup");
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const handleSkipForward = async () => {
    if (!isHost) return;
    if (!activeRoom.queue || activeRoom.queue.length === 0) {
      // Nothing next in queue, stop playback
      const emptySong = {
        songId: "",
        title: "",
        artist: "",
        imageUrl: "",
        audioUrl: "",
        duration: 0,
        progress: 0,
        isPlaying: false,
        startedAt: null,
      };
      try {
        await axiosInstance.post(`/rooms/${roomId}/playback`, {
          currentSong: emptySong,
        });
        if (socket) {
          socket.emit("room_playback_update", { roomId, currentSong: emptySong });
        }
        toast.success("Queue finished");
      } catch (err) {
        console.error("Failed to clear playback:", err);
      }
      return;
    }

    const nextSong = activeRoom.queue[0];
    const updatedQueue = activeRoom.queue.slice(1);
    const newCurrent = {
      songId: nextSong.songId,
      title: nextSong.title,
      artist: nextSong.artist,
      imageUrl: nextSong.imageUrl,
      audioUrl: nextSong.audioUrl,
      duration: nextSong.duration,
      progress: 0,
      isPlaying: true,
      startedAt: new Date(),
    };

    try {
      await axiosInstance.post(`/rooms/${roomId}/playback`, {
        currentSong: newCurrent,
        queue: updatedQueue,
      });
      if (socket) {
        socket.emit("room_playback_update", { roomId, currentSong: newCurrent, queue: updatedQueue });
      }
      toast.success(`Skipped forward to "${nextSong.title}"`);
    } catch (err) {
      console.error("Failed to skip song:", err);
    }
  };

  const handleCancelRoom = async () => {
    if (window.confirm("Are you sure you want to cancel and close this room?")) {
      try {
        await axiosInstance.post(`/rooms/${roomId}/cancel`);
        navigate("/rooms");
      } catch (err) {
        console.error("Failed to cancel room:", err);
      }
    }
  };

  const handleLeaveRoom = () => {
    navigate("/rooms");
  };

  const handleTransferDJClick = async (newHostId: string) => {
    if (window.confirm("Transfer DJ controls to this listener?")) {
      await transferDJ(roomId!, newHostId);
    }
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title?.toLowerCase().includes(songSearch.toLowerCase()) ||
      s.artist?.toLowerCase().includes(songSearch.toLowerCase())
  );

  return (
    <div className="h-full flex bg-[#09090b]/90 overflow-hidden relative text-white">



      {/* Main Lounge Workspace */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 relative">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeRoom.coverUrl || "/albums/default.jpg"}
                alt=""
                className="size-11 rounded-lg object-cover border border-white/10"
              />
              <div className="absolute -bottom-1 -right-1 p-0.5 bg-red-600 rounded-full border border-[#09090b]">
                <Radio className="size-3 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm tracking-tight">{activeRoom.name}</h2>
                <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                  <span className="size-1 bg-red-500 rounded-full animate-ping mr-0.5" />
                  Live
                </Badge>
                <Badge className="bg-white/5 text-zinc-400 border-white/5 text-[9px] font-medium px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  {activeRoom.visibility === "private" ? <Lock className="size-2.5" /> : <Globe className="size-2.5" />}
                  {activeRoom.visibility}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[320px]">
                Hosted by <span className="font-semibold text-zinc-200">{isHost ? "You" : "DJ Host"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isHost ? (
              <Button
                variant="destructive"
                onClick={handleCancelRoom}
                className="text-xs h-8 px-3 rounded-lg border border-red-500/30 font-medium"
              >
                Close Room
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleLeaveRoom}
                className="text-xs h-8 px-3 rounded-lg bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
              >
                Leave Lounge
              </Button>
            )}
          </div>
        </div>

        {/* Lounge Core Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Music Player & Waveform Visualizer */}
          <div className="bg-[#0f0f13]/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center shadow-xl relative overflow-hidden">
            {/* Ambient Shadow glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] to-transparent pointer-events-none" />

            {/* Currently Playing Card */}
            <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-lg z-10">
              <motion.div
                className="size-36 rounded-xl overflow-hidden relative shadow-2xl border border-white/10 shrink-0"
                whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              >
                <img
                  src={activeRoom.currentSong?.imageUrl || "/albums/default.jpg"}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <AnimatePresence>
                  {activeRoom.currentSong?.isPlaying && (
                    <motion.div
                      key="eq-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]"
                    >
                      <div className="flex items-end gap-1 h-8">
                        {[0.1, 0.4, 0.2, 0.6].map((delay, bi) => (
                          <motion.div
                            key={bi}
                            className="w-1 bg-purple-400 rounded-full origin-bottom"
                            animate={reducedMotion ? {} : { scaleY: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
                            style={{ height: "100%" }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex-1 text-center md:text-left space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0 text-left">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={activeRoom.currentSong?.title || "empty"}
                        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: "spring", stiffness: 340, damping: 30 }}
                        className="font-bold text-lg text-white truncate"
                      >
                        {activeRoom.currentSong?.title || "Waiting for track..."}
                      </motion.h3>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeRoom.currentSong?.artist || "empty-artist"}
                        initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ type: "spring", stiffness: 340, damping: 30, delay: 0.05 }}
                        className="text-sm text-zinc-400 truncate"
                      >
                        {activeRoom.currentSong?.artist || "The DJ hasn't queued a track yet"}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  {activeRoom.currentSong?.songId && (
                    <motion.button
                      whileTap={reducedMotion ? undefined : { scale: [1, 1.5, 1] }}
                      transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      onClick={async () => {
                        const songId = activeRoom.currentSong.songId;
                        const isLiked = likedSongs.some((s: any) => s._id === songId || s === songId);
                        await toggleLikeSong(songId, {
                          title: activeRoom.currentSong.title,
                          artist: activeRoom.currentSong.artist,
                          imageUrl: activeRoom.currentSong.imageUrl,
                          duration: activeRoom.currentSong.duration,
                        });
                        toast.success(isLiked ? "Removed from Liked Songs" : "Added to Liked Songs");
                      }}
                      className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Heart
                        className={
                          likedSongs.some((s: any) => s._id === activeRoom.currentSong.songId || s === activeRoom.currentSong.songId)
                            ? "size-5 fill-red-500 text-red-500"
                            : "size-5"
                        }
                      />
                    </motion.button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-2">
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                    <motion.div
                      className="bg-purple-600 h-full rounded-full"
                      animate={{ width: `${activeRoom.currentSong?.duration ? (progress / activeRoom.currentSong.duration) * 100 : 0}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 18 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{formatTime(progress)}</span>
                    <span>
                      {activeRoom.currentSong?.duration ? formatTime(activeRoom.currentSong.duration) : "0:00"}
                    </span>
                  </div>
                </div>

                {/* DJ controls */}
                {isHost && activeRoom.currentSong?.songId && (
                  <div className="flex items-center justify-center md:justify-start gap-4 pt-1">
                    <motion.button
                      onClick={handlePlayPause}
                      whileHover={reducedMotion ? undefined : { scale: 1.08 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.93 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md shadow-purple-600/20"
                    >
                      <AnimatePresence mode="wait">
                        {activeRoom.currentSong.isPlaying ? (
                          <motion.div key="pause" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}>
                            <Pause className="size-4" />
                          </motion.div>
                        ) : (
                          <motion.div key="play" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.12 }}>
                            <Play className="size-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      onClick={handleSkipForward}
                      whileHover={reducedMotion ? undefined : { scale: 1.1 }}
                      whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className="p-2 text-zinc-400 hover:text-white"
                      title="Skip Track"
                    >
                      <SkipForward className="size-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Waveform — Framer Motion scaleY bars */}
            <div className="w-full flex justify-between items-end h-8 gap-0.5 mt-8 px-2 max-w-md opacity-30">
              {Array.from({ length: 48 }).map((_, i) => {
                const baseH = 20 + ((i * 7 + 13) % 60);
                return (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-purple-500 origin-bottom"
                    style={{ height: `${baseH}%` }}
                    animate={reducedMotion ? {} : activeRoom.currentSong?.isPlaying ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.3 }}
                    transition={{ duration: 0.7 + (i % 5) * 0.08, repeat: Infinity, delay: i * 0.02, ease: "easeInOut" }}
                  />
                );
              })}
            </div>
          </div>

          {/* Floating Reactions selector */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="text-xs text-zinc-400 font-medium">Send Live Reaction:</span>
            <div className="flex items-center gap-2">
              {["🔥", "💖", "😂", "👏", "😮", "🎉"].map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  whileHover={reducedMotion ? undefined : { scale: 1.25, rotate: 8 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 440, damping: 20 }}
                  className="text-lg p-1"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live Audience Strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Audience Lounge
            </h3>
            <motion.div
              className="flex items-center flex-wrap gap-2.5"
              variants={reducedMotion ? undefined : { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {/* Host avatar first */}
              <motion.div
                className="relative group cursor-pointer"
                variants={reducedMotion ? undefined : { hidden: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 360, damping: 26 } } }}
              >
                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-md opacity-20 scale-110" />
                <img
                  src={activeRoom.coverUrl || "/avatars/default.png"}
                  className="size-9 rounded-full object-cover border-2 border-yellow-500 relative"
                  alt="Host"
                />
                <Crown className="size-3.5 text-yellow-500 absolute -top-1 -right-1 bg-[#09090b] rounded-full p-0.5" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#09090b] border border-white/10 p-2 rounded-lg text-[10px] w-28 text-center shadow-xl z-20">
                  <p className="font-bold text-white">DJ Host</p>
                  <p className="text-zinc-500 mt-0.5">Room Owner</p>
                </div>
              </motion.div>

              {/* Other listeners */}
              {activeRoom.listeners?.slice(0, 8).map((listenerId: string) => {
                if (listenerId === activeRoom.hostId) return null;
                return (
                  <motion.div
                    key={listenerId}
                    className="relative group cursor-pointer"
                    variants={reducedMotion ? undefined : { hidden: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 360, damping: 26 } } }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${listenerId}`}
                      className="size-9 rounded-full object-cover border border-white/10 hover:border-purple-500 transition-colors"
                      alt="Listener"
                    />
                    {isHost && (
                      <button
                        onClick={() => handleTransferDJClick(listenerId)}
                        className="absolute -top-1 -right-1 p-0.5 bg-[#09090b] border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 text-purple-400 hover:text-white"
                        title="Transfer DJ Controls"
                      >
                        <Crown className="size-2.5" />
                      </button>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#09090b] border border-white/10 p-2 rounded-lg text-[10px] w-28 text-center shadow-xl z-20">
                      <p className="font-bold text-white">Listener</p>
                      <p className="text-zinc-500 mt-0.5">Active Listener</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Song Requests & Queue Section */}
          {isHost ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* DJ Search & Quick Add */}
              <div className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-heading">
                  <Plus className="size-3.5 text-purple-400" /> DJ Search Desk
                </h4>
                <p className="text-[11px] text-zinc-500">Quickly search and queue tracks directly onto the lounge lineup.</p>
                <Input
                  placeholder="Search song to add..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  className="bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600 text-xs py-1 h-9"
                />
                <ScrollArea className="h-52">
                  <div className="space-y-1.5 pr-1">
                    {songSearch && filteredSongs.length === 0 ? (
                      <div className="text-zinc-500 text-center py-6 text-xs">No matching songs.</div>
                    ) : (
                      (songSearch ? filteredSongs : songs.slice(0, 6)).map((song) => (
                        <div
                          key={song._id}
                          onClick={() => handleSelectRequestSong(song)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={song.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border border-white/5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[130px]">{song.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[130px]">{song.artist}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-purple-400 hover:text-white hover:bg-purple-600/20 rounded-full"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Lineup Queue */}
              <div className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-heading">
                  <ListMusic className="size-3.5 text-purple-400" /> Lounge Lineup
                </h4>
                <p className="text-[11px] text-zinc-500">Upcoming songs in playback queue.</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-1">
                    {!activeRoom.queue || activeRoom.queue.length === 0 ? (
                      <div className="text-zinc-600 text-center py-14 text-xs font-medium">
                        Lineup is empty. Search songs to queue!
                      </div>
                    ) : (
                      activeRoom.queue.map((qSong: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5 group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-zinc-500 w-3">{index + 1}</span>
                            <img
                              src={qSong.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border border-white/5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{qSong.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{qSong.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[8px] bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                              By {qSong.requestedBy ? qSong.requestedBy.split(" ")[0] : "DJ"}
                            </span>
                            <button
                              onClick={() => handleRemoveFromQueue(index)}
                              className="p-1 text-zinc-500 hover:text-red-400 rounded-full hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove Track"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Incoming Listener Requests */}
              <div className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-heading">
                  <Radio className="size-3.5 text-purple-400 animate-pulse" /> Listener Requests
                </h4>
                <p className="text-[11px] text-zinc-500">Incoming track requests from the audience.</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-1">
                    {!activeRoom.requests || activeRoom.requests.length === 0 ? (
                      <div className="text-zinc-600 text-center py-14 text-xs font-medium">
                        No active listener requests.
                      </div>
                    ) : (
                      activeRoom.requests.map((reqSong: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={reqSong.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border border-white/5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[110px]">{reqSong.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[110px]">{reqSong.artist}</p>
                              <span className="text-[9px] text-purple-400 block">
                                From: {reqSong.requestedBy ? reqSong.requestedBy.split(" ")[0] : "Listener"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleApproveRequest(reqSong)}
                              className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 rounded-full transition-colors animate-in"
                              title="Approve & Queue"
                            >
                              <Check className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(reqSong)}
                              className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/20 rounded-full transition-colors"
                              title="Decline Request"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Listener Search & Request Vibe */}
              <div className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-heading">
                  <Plus className="size-3.5 text-purple-400" /> Request a Track
                </h4>
                <p className="text-[11px] text-zinc-500">Search a song and submit a request to the DJ host.</p>
                <Input
                  placeholder="Search song to request..."
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  className="bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600 text-xs py-1 h-9"
                />
                <ScrollArea className="h-52">
                  <div className="space-y-1.5 pr-1">
                    {songSearch && filteredSongs.length === 0 ? (
                      <div className="text-zinc-500 text-center py-6 text-xs">No matching songs.</div>
                    ) : (
                      (songSearch ? filteredSongs : songs.slice(0, 6)).map((song) => (
                        <div
                          key={song._id}
                          onClick={() => handleSelectRequestSong(song)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={song.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border border-white/5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[140px]">{song.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">{song.artist}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-purple-400 hover:text-white hover:bg-purple-600/20 rounded-full"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Lineup Queue (Read-only) */}
              <div className="bg-[#0f0f13]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-heading">
                  <ListMusic className="size-3.5 text-purple-400" /> Lounge Lineup
                </h4>
                <p className="text-[11px] text-zinc-500">Upcoming songs. Add tracks via request!</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-1">
                    {!activeRoom.queue || activeRoom.queue.length === 0 ? (
                      <div className="text-zinc-600 text-center py-14 text-xs font-medium">
                        Lineup is empty. Request songs to help build the vibe!
                      </div>
                    ) : (
                      activeRoom.queue.map((qSong: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] border border-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-zinc-500 w-3">{index + 1}</span>
                            <img
                              src={qSong.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border border-white/5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[140px]">{qSong.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">{qSong.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[8px] bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                              By {qSong.requestedBy ? qSong.requestedBy.split(" ")[0] : "DJ"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Reactions Renderer Overlay — Framer Motion */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              className="absolute text-2xl"
              style={{ bottom: 20, right: 24 + Math.floor(Math.random() * 60) }}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -240, scale: [0.6, 1.15, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Right Companion Drawer Tabbed Panel */}
      <div className="w-80 flex flex-col bg-[#0b0b0e]/95 shrink-0 select-none">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid grid-cols-4 bg-black/20 border-b border-white/5 rounded-none p-1">
            <TabsTrigger value="chat" className="text-[11px] py-1.5">
              <MessageSquare className="size-3.5 mr-1" /> Chat
            </TabsTrigger>
            <TabsTrigger value="audience" className="text-[11px] py-1.5">
              <Users className="size-3.5 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="info" className="text-[11px] py-1.5">
              <Info className="size-3.5 mr-1" /> Info
            </TabsTrigger>
            <TabsTrigger value="leader" className="text-[11px] py-1.5">
              <Zap className="size-3.5 mr-1" /> Streaks
            </TabsTrigger>
          </TabsList>

          {/* Chat Panel */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
            {/* Pinned Announcement */}
            <div className="bg-purple-900/10 border-b border-purple-500/20 p-2.5 flex items-start gap-2">
              <Crown className="size-4 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-zinc-300">
                <span className="font-bold text-white">DJ Announcement:</span> Play nice and send song requests in the queue!
              </div>
            </div>

            {/* Chat message logs */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3.5 pr-1">
                {chatMessages.length === 0 ? (
                  <div className="text-zinc-500 text-center py-20 text-xs">
                    Lounge chat is silent. Be the first to say hi!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMsgHost = activeRoom.hostId === msg.senderId;
                    return (
                      <motion.div
                        key={msg.id}
                        className="flex items-start gap-2.5"
                        initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                      >
                        <img src={msg.senderAvatar || "/avatars/default.png"} alt="" className="size-7 rounded-full object-cover border border-white/5 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate max-w-[120px]">{msg.senderName}</span>
                            {isMsgHost && (
                              <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] font-bold px-1 rounded">DJ</Badge>
                            )}
                            <span className="text-[8px] text-zinc-500 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 break-words mt-0.5">{msg.content}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/20 flex gap-2">
              <Input
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600 text-xs h-8 flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="size-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shrink-0"
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </TabsContent>

          {/* Audience Panel */}
          <TabsContent value="audience" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-3 pr-1">
                <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                  Host
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <img
                    src={activeRoom.coverUrl || "/avatars/default.png"}
                    className="size-8 rounded-full object-cover border border-white/10"
                    alt=""
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-white">DJ Host</p>
                      <Crown className="size-3 text-yellow-500" />
                    </div>
                    <p className="text-[9px] text-zinc-500">Host / DJ Owner</p>
                  </div>
                </div>

                <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider pt-2">
                  Listeners ({activeRoom.listeners?.length || 1})
                </div>
                {activeRoom.listeners?.map((listenerId: string) => {
                  if (listenerId === activeRoom.hostId) return null;
                  return (
                    <div
                      key={listenerId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${listenerId}`}
                          className="size-8 rounded-full object-cover border border-white/10"
                          alt=""
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Lounge Listener</p>
                          <p className="text-[9px] text-zinc-500">Active</p>
                        </div>
                      </div>
                      {isHost && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTransferDJClick(listenerId)}
                          className="size-6 text-purple-400 hover:text-white"
                          title="Transfer DJ controls"
                        >
                          <Crown className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Room Info Panel */}
          <TabsContent value="info" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4 pr-1">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {activeRoom.description || "No description set for this room."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mood Tags</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {activeRoom.moodTags?.map((tag: string) => (
                      <Badge key={tag} className="bg-white/5 border-white/5 text-zinc-400 font-medium py-0.5 px-2 rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lounge Details</h4>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1">
                      <span className="text-zinc-500">Visibility</span>
                      <span className="capitalize font-semibold text-zinc-300">{activeRoom.visibility}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1">
                      <span className="text-zinc-500">Host ID</span>
                      <span className="font-mono text-zinc-400 text-[10px]">{activeRoom.hostId}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Created At</span>
                      <span className="text-zinc-400">
                        {new Date(activeRoom.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Leaderboard/Streaks Panel */}
          <TabsContent value="leader" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-3.5 pr-1">
                <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                  Active Listener Streaks
                </div>
                {[
                  { rank: 1, name: "VibeMaster", points: 840, streak: 8 },
                  { rank: 2, name: "JazzLover", points: 610, streak: 5 },
                  { rank: 3, name: "MidnightRain", points: 430, streak: 3 },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-400 font-mono w-4">#{item.rank}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{item.name}</p>
                        <p className="text-[9px] text-zinc-500">{item.points} Points</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-600/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold gap-0.5">
                      <Zap className="size-2.5 fill-purple-400" /> {item.streak}d Streak
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
