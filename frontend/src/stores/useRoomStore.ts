import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";


interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
}

interface RoomState {
  activeRoom: any | null;
  chatMessages: ChatMessage[];
  listeners: any[];
  floatingReactions: { id: string; emoji: string }[];
  isLoading: boolean;

  fetchRoom: (roomId: string) => Promise<void>;
  joinRoom: (roomId: string, socket: any) => Promise<void>;
  leaveRoom: (roomId: string, socket: any) => Promise<void>;
  sendChatMessage: (socket: any, roomId: string, sender: any, content: string) => void;
  sendReaction: (socket: any, roomId: string, emoji: string) => void;
  updatePlaybackState: (roomId: string, currentSong: any) => Promise<void>;
  transferDJ: (roomId: string, newHostId: string) => Promise<void>;
  addReactionLocal: (emoji: string) => void;
  clearState: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  activeRoom: null,
  chatMessages: [],
  listeners: [],
  floatingReactions: [],
  isLoading: false,

  fetchRoom: async (roomId) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/rooms/${roomId}`);
      set({ activeRoom: res.data });
    } catch (err) {
      console.error("Failed to fetch room details:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  joinRoom: async (roomId, socket) => {
    try {
      const res = await axiosInstance.post(`/rooms/${roomId}/join`);
      set({ activeRoom: res.data, listeners: res.data.listeners || [] });

      if (socket) {
        socket.emit("join_room", { roomId });

        // Listen for new users joining
        socket.on("user_joined_room", ({ user }: any) => {
          set((state) => {
            if (!state.activeRoom) return state;
            const alreadyExists = state.activeRoom.listeners.includes(user.clerkId);
            const updatedListeners = alreadyExists
              ? state.activeRoom.listeners
              : [...state.activeRoom.listeners, user.clerkId];
            return {
              activeRoom: { ...state.activeRoom, listeners: updatedListeners },
            };
          });
        });

        // Listen for users leaving
        socket.on("user_left_room", ({ userId }: any) => {
          set((state) => {
            if (!state.activeRoom) return state;
            return {
              activeRoom: {
                ...state.activeRoom,
                listeners: state.activeRoom.listeners.filter((id: string) => id !== userId),
              },
            };
          });
        });

        // Listen for chat messages
        socket.on("receive_room_chat_message", (message: ChatMessage) => {
          set((state) => ({
            chatMessages: [...state.chatMessages, message],
          }));
        });

        // Listen for reactions
        socket.on("receive_room_reaction", ({ reaction }: { reaction: string }) => {
          get().addReactionLocal(reaction);
        });

        // Listen for playback changes
        socket.on("receive_room_playback_updated", ({ currentSong, queue, requests }: any) => {
          set((state) => {
            if (!state.activeRoom) return state;
            const updatedRoom = { ...state.activeRoom };
            if (currentSong !== undefined) updatedRoom.currentSong = currentSong;
            if (queue !== undefined) updatedRoom.queue = queue;
            if (requests !== undefined) updatedRoom.requests = requests;
            return { activeRoom: updatedRoom };
          });
        });

        // Listen for DJ transfer
        socket.on("receive_room_dj_transferred", (data: any) => {
          set((state) => {
            if (!state.activeRoom) return state;
            return {
              activeRoom: { ...state.activeRoom, hostId: data.newHostId },
            };
          });
        });
      }
    } catch (err) {
      console.error("Failed to join room:", err);
    }
  },

  leaveRoom: async (roomId, socket) => {
    try {
      await axiosInstance.post(`/rooms/${roomId}/leave`);
      if (socket) {
        socket.emit("leave_room", { roomId });
        socket.off("user_joined_room");
        socket.off("user_left_room");
        socket.off("receive_room_chat_message");
        socket.off("receive_room_reaction");
        socket.off("receive_room_playback_updated");
        socket.off("receive_room_dj_transferred");
      }
      get().clearState();
    } catch (err) {
      console.error("Failed to leave room:", err);
    }
  },

  sendChatMessage: (socket, roomId, sender, content) => {
    if (!socket) return;
    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: sender.id,
      senderName: sender.fullName,
      senderAvatar: sender.imageUrl,
      content,
      timestamp: new Date(),
    };
    socket.emit("room_chat_message", { roomId, message });
  },

  sendReaction: (socket, roomId, emoji) => {
    if (!socket) return;
    socket.emit("room_reaction", { roomId, reaction: emoji });
  },

  updatePlaybackState: async (roomId, currentSong) => {
    try {
      const res = await axiosInstance.post(`/rooms/${roomId}/playback`, { currentSong });
      set({ activeRoom: res.data });
    } catch (err) {
      console.error("Failed to update playback state:", err);
    }
  },

  transferDJ: async (roomId, newHostId) => {
    try {
      const res = await axiosInstance.post(`/rooms/${roomId}/transfer`, { newHostId });
      set({ activeRoom: res.data });
    } catch (err) {
      console.error("Failed to transfer DJ privileges:", err);
    }
  },

  addReactionLocal: (emoji) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      floatingReactions: [...state.floatingReactions, { id, emoji }],
    }));

    // Auto remove reaction after animation finishes (2 seconds)
    setTimeout(() => {
      set((state) => ({
        floatingReactions: state.floatingReactions.filter((r) => r.id !== id),
      }));
    }, 2000);
  },

  clearState: () => {
    set({
      activeRoom: null,
      chatMessages: [],
      listeners: [],
      floatingReactions: [],
    });
  },
}));
