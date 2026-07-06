import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Radio, Calendar, Users, Clock, Globe, Lock, ArrowRight, Music } from "lucide-react";
import CreateRoomModal from "@/components/rooms/CreateRoomModal";
import { motion } from "framer-motion";

export default function RoomsPage() {
  const navigate = useNavigate();
  const { socket } = useChatStore();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get("/rooms");
      setRooms(res.data || []);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    if (socket) {
      socket.on("room_created", (newRoom: any) => {
        setRooms((prev) => [newRoom, ...prev.filter((r) => r._id !== newRoom._id)]);
      });

      socket.on("room_cancelled_broadcast", ({ roomId }: { roomId: string }) => {
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
      });

      // Cleanup
      return () => {
        socket.off("room_created");
        socket.off("room_cancelled_broadcast");
      };
    }
  }, [socket]);

  const liveRooms = rooms.filter((r) => r.isLive);
  const scheduledRooms = rooms.filter((r) => !r.isLive && r.scheduledStartTime);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/rooms/${roomId}`);
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b]/40 overflow-hidden relative">
      {/* Top Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Radio className="size-6 text-purple-500 animate-pulse" /> Live Lounges
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Discover digital music lounges, join your friends, and listen live.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs py-2 px-4 shadow-lg shadow-purple-600/25 flex items-center gap-1.5 font-medium transition-all"
        >
          <Plus className="size-4" /> Create Lounge
        </Button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-2">
            <div className="size-8 rounded-full border-2 border-purple-500/25 border-t-purple-600 animate-spin" />
            <p className="text-xs text-zinc-500">Loading lounges...</p>
          </div>
        ) : (
          <>
            {/* Live Rooms Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-500 animate-ping" />
                Live Now ({liveRooms.length})
              </h2>

              {liveRooms.length === 0 ? (
                <Card className="bg-white/[0.02] border-white/5 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                  <div className="size-16 rounded-full bg-purple-500/5 flex items-center justify-center mb-4 border border-purple-500/10">
                    <Music className="size-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">No lounges are currently live</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                    Start the vibe by creating the first lounge and playing some tracks!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setModalOpen(true)}
                    className="mt-4 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg text-xs"
                  >
                    Start a Lounge
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveRooms.map((room) => (
                    <motion.div
                      key={room._id}
                      whileHover={{ y: -4 }}
                      onClick={() => handleJoinRoom(room._id)}
                      className="bg-[#0f0f13]/80 border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-purple-500/30 hover:bg-[#121217] transition-all relative group overflow-hidden shadow-xl"
                    >
                      {/* Ambient Glow */}
                      <div className="absolute -top-12 -left-12 size-24 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-120 transition-all pointer-events-none" />

                      <div className="aspect-video w-full rounded-xl overflow-hidden relative border border-white/5 mb-3 bg-zinc-900">
                        <img
                          src={room.coverUrl || "/albums/default.jpg"}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Badge className="bg-red-600/90 text-white border-none text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wider animate-pulse">
                            <span className="size-1.5 rounded-full bg-white inline-block animate-ping mr-0.5" />
                            Live
                          </Badge>
                          <Badge className="bg-black/60 backdrop-blur-md text-zinc-300 border-white/5 text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                            {room.visibility === "private" ? <Lock className="size-2.5" /> : <Globe className="size-2.5" />}
                            {room.visibility}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white truncate">{room.name}</h3>
                      <p className="text-xs text-zinc-500 truncate mt-1">{room.description || "No description provided"}</p>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {room.moodTags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[9px] font-medium bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-zinc-400">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {room.listeners?.length || 1} listening
                          </span>
                        </div>
                        <div className="flex items-center text-purple-400 text-xs font-semibold gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Join Room <ArrowRight className="size-3.5" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Rooms Section */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Calendar className="size-4 text-zinc-400" />
                Scheduled Lounges ({scheduledRooms.length})
              </h2>

              {scheduledRooms.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-white/10 rounded-2xl bg-white/[0.005]">
                  No upcoming lounges scheduled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scheduledRooms.map((room) => {
                    const startDateObj = new Date(room.scheduledStartTime);
                    return (
                      <motion.div
                        key={room._id}
                        whileHover={{ y: -3 }}
                        className="bg-[#0f0f13]/60 border border-white/5 rounded-2xl p-4 hover:border-purple-500/20 hover:bg-[#121217]/80 transition-all relative overflow-hidden"
                      >
                        <div className="aspect-video w-full rounded-xl overflow-hidden relative border border-white/5 mb-3 bg-zinc-900">
                          <img
                            src={room.coverUrl || "/albums/default.jpg"}
                            alt={room.name}
                            className="w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <Badge className="bg-purple-900/80 text-purple-200 border-purple-500/20 text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Calendar className="size-2.5" /> Upcoming
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-bold text-sm text-white truncate">{room.name}</h3>
                        <p className="text-xs text-zinc-500 truncate mt-1">{room.description || "No description"}</p>

                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                            <Clock className="size-3.5 text-purple-400" />
                            <span className="font-medium text-[11px]">
                              {startDateObj.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              at{" "}
                              {startDateObj.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span>Visibility:</span>
                            <span className="font-semibold text-zinc-400 capitalize">{room.visibility}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <CreateRoomModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRoomCreated={(newRoom) => {
          setRooms((prev) => [newRoom, ...prev]);
          if (newRoom.isLive) {
            navigate(`/rooms/${newRoom._id}`);
          }
        }}
      />
    </div>
  );
}
