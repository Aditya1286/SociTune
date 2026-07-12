import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useChatStore } from "@/stores/useChatStore";
import { axiosInstance } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Search,
  X,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Globe,
  Users,
  Lock,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { spring, useReducedMotion } from "@/lib/motion";

// Spring-based step slide variants — direction aware
const makeStepVariants = (direction: number) => ({
  hidden: { opacity: 0, x: direction * 28, scale: 0.98 },
  visible: { opacity: 1, x: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: direction * -28, scale: 0.98, transition: { ...spring, duration: 0.18 } },
});

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated?: (room: any) => void;
}

const MOOD_CHIPS = ["🔥 Chill", "🌙 Midnight", "☕ Coffee", "🌧 Rain", "⚡ Energetic", "🎸 Rock", "🎧 Lo-Fi", "💃 Party"];

export default function CreateRoomModal({ open, onOpenChange, onRoomCreated }: CreateRoomModalProps) {
  const { user } = useUser();
  const { getUserFriends } = useChatStore();
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const directionRef = useRef(1); // 1 = forward, -1 = backward
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 1: Identity
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Visibility & Invites
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [selectedInvitees, setSelectedInvitees] = useState<any[]>([]);

  // Step 3: Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [reminderLeadTime, setReminderLeadTime] = useState(15);

  useEffect(() => {
    if (open && user?.id) {
      // Fetch friends list for Private invitation selection
      getUserFriends(user.id).then((res) => {
        setFriends(res || []);
      });
      setStep(1);
      setRoomName("");
      setDescription("");
      setCoverUrl("");
      setSelectedMoods([]);
      setVisibility("public");
      setSelectedInvitees([]);
      setIsScheduled(false);
      setStartDate("");
      setStartTime("");
      setReminderLeadTime(15);
    }
  }, [open, user?.id, getUserFriends]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const formData = new FormData();
    formData.append("media", file);

    try {
      const response = await axiosInstance.post("/users/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.url) {
        setCoverUrl(response.data.url);
      }
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  const toggleInvitee = (friend: any) => {
    const exists = selectedInvitees.find((u) => u.clerkId === friend.clerkId);
    if (exists) {
      setSelectedInvitees(selectedInvitees.filter((u) => u.clerkId !== friend.clerkId));
    } else {
      setSelectedInvitees([...selectedInvitees, friend]);
    }
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#a855f7", "#6366f1", "#3b82f6", "#ffffff"],
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const scheduledStartTime = isScheduled && startDate && startTime ? `${startDate}T${startTime}` : null;
      const roomPayload = {
        name: roomName || "Listening Lounge",
        description,
        coverUrl,
        moodTags: selectedMoods,
        visibility,
        invitedUsers: selectedInvitees.map((u) => u.clerkId),
        scheduledStartTime,
        reminderLeadTime,
        isLiveNow: !isScheduled,
      };

      const res = await axiosInstance.post("/rooms", roomPayload);
      triggerConfetti();
      if (onRoomCreated) {
        onRoomCreated(res.data);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => { directionRef.current = 1; setStep((s) => Math.min(s + 1, 4)); };
  const prevStep = () => { directionRef.current = -1; setStep((s) => Math.max(s - 1, 1)); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#09090b]/95 border border-white/10 text-white shadow-2xl p-6 rounded-2xl overflow-hidden backdrop-blur-xl">
        {/* Background Beams Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-indigo-950/10 to-zinc-950/20 pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col h-full">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center justify-between">
              <span>Create Live Room</span>
              <span className="text-xs text-zinc-500 font-mono">Step {step} of 4</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Gather your friends, host a DJ session, and experience music together.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Progress */}
          <div className="w-full bg-white/5 h-1.5 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="bg-purple-600 h-full rounded-full"
              initial={{ width: "25%" }}
              animate={{ width: `${step * 25}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
            />
          </div>

          <div className="flex-1 min-h-[320px] max-h-[420px] overflow-y-auto pr-1">
            <AnimatePresence mode="wait" custom={directionRef.current}>
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={directionRef.current}
                  variants={reducedMotion ? undefined : makeStepVariants(directionRef.current)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Room Poster/Cover
                    </label>
                    <div
                      onClick={handleUploadClick}
                      className="border border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-white/[0.02] transition-colors relative overflow-hidden group h-36"
                    >
                      <AnimatePresence mode="wait">
                        {coverUrl ? (
                          <motion.div key="preview" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                            <motion.img layoutId="room-poster-preview" src={coverUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" style={{ borderRadius: 12 }} />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="size-6 text-white" />
                              <span className="text-xs font-medium text-white ml-2">Change Image</span>
                            </div>
                          </motion.div>
                        ) : uploadingCover ? (
                          <motion.div key="uploading" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Loader2 className="size-6 text-purple-400 animate-spin mb-2" />
                            <span className="text-xs text-zinc-400">Uploading cover poster...</span>
                          </motion.div>
                        ) : (
                          <motion.div key="empty" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div className="p-3 bg-purple-500/10 rounded-full mb-2" whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                              <Upload className="size-5 text-purple-400" />
                            </motion.div>
                            <p className="text-sm font-medium text-zinc-300">Drag & drop or click to upload</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Recommended: Square or 16:9 aspect ratio</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Room Name
                    </label>
                    <Input
                      placeholder="e.g. Late Night Jazz Lounge"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600 focus-visible:border-purple-600 focus:bg-white/[0.08]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Description (Optional)
                    </label>
                    <Textarea
                      placeholder="What is this lounge about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600 focus-visible:border-purple-600 focus:bg-white/[0.08] min-h-[60px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Mood/Genre Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MOOD_CHIPS.map((mood) => {
                        const selected = selectedMoods.includes(mood);
                        return (
                          <motion.button
                            key={mood}
                            type="button"
                            onClick={() => toggleMood(mood)}
                            whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                            animate={selected && !reducedMotion ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className={`relative px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ${
                              selected
                                ? "border-purple-500 text-purple-300 bg-purple-600/20 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {mood}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  variants={reducedMotion ? undefined : makeStepVariants(directionRef.current)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Room Visibility
                    </label>
                    <Tabs
                      value={visibility}
                      onValueChange={(val: any) => setVisibility(val)}
                      className="w-full bg-white/5 p-1 rounded-lg border border-white/5"
                    >
                      <TabsList className="grid grid-cols-3 w-full bg-transparent">
                        <TabsTrigger value="public" className="gap-1.5 text-xs py-1.5">
                          <Globe className="size-3.5" /> Public
                        </TabsTrigger>
                        <TabsTrigger value="followers" className="gap-1.5 text-xs py-1.5">
                          <Users className="size-3.5" /> Followers
                        </TabsTrigger>
                        <TabsTrigger value="private" className="gap-1.5 text-xs py-1.5">
                          <Lock className="size-3.5" /> Private
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <AnimatePresence>
                    {visibility === "private" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                            Select Listeners
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                            <Input
                              placeholder="Search friends/followers..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-purple-600"
                            />
                          </div>
                        </div>

                        {selectedInvitees.length > 0 && (
                          <motion.div layout className="flex flex-wrap gap-1 bg-white/[0.02] p-2 rounded-lg border border-white/5 max-h-20 overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                              {selectedInvitees.map((u) => (
                                <motion.div
                                  key={u.clerkId}
                                  layout
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 380, damping: 22 } }}
                                  exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.15 } }}
                                >
                                  <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30 gap-1 pr-1.5">
                                    <img src={u.imageUrl} className="size-4 rounded-full object-cover" alt="" />
                                    <span className="text-[10px]">{u.fullName}</span>
                                    <button type="button" onClick={() => toggleInvitee(u)}>
                                      <X className="size-3 hover:text-white" />
                                    </button>
                                  </Badge>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        )}

                        <ScrollArea className="h-44 border border-white/15 rounded-xl bg-white/[0.01]">
                          <div className="p-2 space-y-1">
                            {filteredFriends.length === 0 ? (
                              <div className="text-center py-6 text-zinc-500 text-xs">
                                No friends found. Make sure they follow you back.
                              </div>
                            ) : (
                              filteredFriends.map((friend, i) => {
                                const isSelected = !!selectedInvitees.find((u) => u.clerkId === friend.clerkId);
                                return (
                                  <motion.div
                                    key={friend.clerkId}
                                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...{ type: "spring", stiffness: 340, damping: 30 }, delay: i * 0.03 }}
                                    onClick={() => toggleInvitee(friend)}
                                    whileHover={reducedMotion ? undefined : { x: 2 }}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                      isSelected ? "bg-purple-600/10" : "hover:bg-white/5"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <img src={friend.imageUrl || "/avatars/default.png"} alt={friend.fullName} className="size-8 rounded-full object-cover border border-white/10" />
                                      <div>
                                        <p className="text-xs font-semibold text-white">{friend.fullName}</p>
                                        <p className="text-[10px] text-zinc-500">@{friend.username}</p>
                                      </div>
                                    </div>
                                    <motion.div
                                      animate={isSelected ? { backgroundColor: "rgb(147 51 234)", borderColor: "rgb(168 85 247)" } : { backgroundColor: "transparent", borderColor: "rgb(82 82 91)" }}
                                      transition={{ duration: 0.15 }}
                                      className="size-4 rounded-full border flex items-center justify-center"
                                    >
                                      <AnimatePresence mode="wait">
                                        {isSelected && <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 450, damping: 20 }}><Check className="size-2.5 text-white" /></motion.div>}
                                      </AnimatePresence>
                                    </motion.div>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>
                        <p className="text-[10px] text-zinc-500 text-right">
                          {selectedInvitees.length} people selected
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  variants={reducedMotion ? undefined : makeStepVariants(directionRef.current)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      When should the room start?
                    </label>
                    <Tabs
                      value={isScheduled ? "later" : "now"}
                      onValueChange={(val) => setIsScheduled(val === "later")}
                      className="w-full bg-white/5 p-1 rounded-lg border border-white/5"
                    >
                      <TabsList className="grid grid-cols-2 w-full bg-transparent">
                        <TabsTrigger value="now" className="gap-1.5 text-xs py-1.5">
                          <Check className="size-3.5" /> Start Now
                        </TabsTrigger>
                        <TabsTrigger value="later" className="gap-1.5 text-xs py-1.5">
                          <Calendar className="size-3.5" /> Schedule for Later
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <AnimatePresence>
                    {isScheduled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-2"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                              Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                              <input
                                type="date"
                                value={startDate}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus-visible:ring-purple-600 focus:outline-none focus:border-purple-600 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                              Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                              <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus-visible:ring-purple-600 focus:outline-none focus:border-purple-600 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                            Reminder Lead Time
                          </label>
                          <select
                            value={reminderLeadTime}
                            onChange={(e) => setReminderLeadTime(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#09090b] border border-white/10 text-white rounded-lg focus:outline-none focus:border-purple-600 text-xs"
                          >
                            <option value={5}>5 minutes before</option>
                            <option value={15}>15 minutes before</option>
                            <option value={30}>30 minutes before</option>
                            <option value={60}>1 hour before</option>
                          </select>
                        </div>

                        {startDate && startTime && (
                          <p className="text-xs text-purple-400 font-medium">
                            * Room goes live on{" "}
                            {new Date(`${startDate}T${startTime}`).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-4"
                  variants={reducedMotion ? undefined : makeStepVariants(directionRef.current)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4 flex flex-col items-center"
                >
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold text-center mb-1">
                    Review Lounge Details
                  </p>

                  {/* 3D Card / Spotlight Mock Card */}
                  <div className="w-full max-w-[280px] bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
                    {/* Glowing highlight */}
                    <div className="absolute -top-12 -left-12 size-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700 pointer-events-none" />

                    <div className="aspect-video w-full rounded-xl bg-zinc-900 overflow-hidden relative border border-white/5 mb-3">
                      <motion.img
                        layoutId="room-poster-preview"
                        src={coverUrl || "/albums/default.jpg"}
                        alt="Poster"
                        className="w-full h-full object-cover"
                        transition={{ type: "spring", stiffness: 240, damping: 30 }}
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-wider font-semibold">
                        {visibility}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-white truncate">{roomName || "Listening Lounge"}</h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{description || "No description provided"}</p>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={user?.imageUrl || "/avatars/default.png"}
                          alt="DJ Host"
                          className="size-5 rounded-full object-cover"
                        />
                        <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[100px]">
                          {user?.fullName} (DJ)
                        </span>
                      </div>
                      <div className="flex items-center text-purple-400 text-[10px] font-semibold gap-1">
                        <Calendar className="size-3" />
                        <span>{isScheduled ? "Scheduled" : "Live Now"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-center mt-2 max-w-sm">
                    {selectedMoods.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {selectedMoods.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-zinc-400">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    {visibility === "private" && (
                      <p className="text-[10px] text-zinc-500 mt-1">
                        * In-app invites will be sent to {selectedInvitees.length} users.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="mt-6 border-t border-white/5 pt-4 flex flex-row justify-between items-center bg-transparent">
            {step > 1 ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Button
                  variant="outline"
                  type="button"
                  onClick={prevStep}
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white rounded-lg text-xs py-1.5 h-8 flex items-center gap-1"
                >
                  <ArrowLeft className="size-3.5" /> Back
                </Button>
              </motion.div>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Button
                  type="button"
                  disabled={step === 1 && !roomName.trim()}
                  onClick={nextStep}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs py-1.5 h-8 flex items-center gap-1 shadow-lg shadow-purple-600/20"
                >
                  Next <ArrowRight className="size-3.5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs py-1.5 h-8 overflow-hidden shadow-lg shadow-purple-600/20 min-w-[130px] justify-center"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span key="loading" className="flex items-center gap-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                        <Loader2 className="size-3.5 animate-spin" /> Creating...
                      </motion.span>
                    ) : (
                      <motion.span key="label" className="flex items-center gap-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                        {isScheduled ? "Schedule Room" : "Go Live Now"}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
