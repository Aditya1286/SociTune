import {create} from "zustand";
import type { Song, ListenEventMetaData } from "@/types";
import { axiosInstance } from "@/lib/axios";

interface PLayerStore {
    currentSong: Song | null;
    isPlaying: boolean;
    queue: Song[];
    currentIndex: number;

    initializeQueue: (songs: Song[]) => void;
    playAlbum: (songs: Song[], startIndex?: number) => void;
    setCurrentSong: (song: Song | null) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrevious: () => void;
    toggleShuffle: () => void;
    toggleLoop: () => void;
    isShuffled: boolean;
    isLooping: boolean;
    lyrics: Record<string, string | null>;
    isLoadingLyrics: boolean;
    fetchLyrics: (songId: string) => Promise<void>;
    logPlay: (payload: ListenEventMetaData) => Promise<void>;
}

export const usePlayerStore = create<PLayerStore>((set,get) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,
    isShuffled: false,
    isLooping: false,
    initializeQueue: (songs: Song[]) => {
        set({ queue: songs,
              currentSong: get().currentSong || songs[0],
              currentIndex: get().currentIndex === -1 ? 0 : get().currentIndex,
            });
    },
    playAlbum: (songs: Song[], startIndex=0) => {
        if(songs.length=== 0)return;
        const song = songs[startIndex];
        set({
            queue: songs,
            currentSong: song,
            currentIndex: startIndex,
            isPlaying: true,
        });
    },
    setCurrentSong: (song: Song | null) => {

        if(!song) return;
        const songIndex = get().queue.findIndex(s => s._id === song._id);
        set({
            currentSong: song,
            isPlaying: true,
            currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
        });
    },
    togglePlay: () => {
        const willStartPlaying = !get().isPlaying;

        set({
            isPlaying:willStartPlaying,
        });
    },
    toggleShuffle: () => {
        set({ isShuffled: !get().isShuffled });
    },
    toggleLoop: () => {
        set({ isLooping: !get().isLooping });
    },
    playNext: () => {
        const { currentIndex, queue, isShuffled } = get()
        let nextIndex = currentIndex + 1;

        if (isShuffled) {
            nextIndex = Math.floor(Math.random() * queue.length);
        }

        if(nextIndex < queue.length){
            const nextSong = queue[nextIndex];
            set({
                currentSong: nextSong,
                currentIndex: nextIndex,
                isPlaying: true,
            });
        }
        else{
            set({isPlaying: false});
        }
    },
    playPrevious: () => {
        const { currentIndex, queue, isShuffled } = get()
        let prevIndex = currentIndex - 1;
        
        if (isShuffled) {
            prevIndex = Math.floor(Math.random() * queue.length);
        }

        if(prevIndex >= 0){
            const prevSong = queue[prevIndex];
            set({
                currentSong: prevSong,
                currentIndex: prevIndex,
                isPlaying: true,
            });
        }
        else{
            set({isPlaying: false});
        }
    },
    lyrics: {},
    isLoadingLyrics: false,
    fetchLyrics: async (songId: string) => {
        if (get().lyrics[songId] !== undefined) return;
        set({ isLoadingLyrics: true });
        try {
            const response = await axiosInstance.get(`/songs/${songId}/lyrics`);
            set((state) => ({
                lyrics: { ...state.lyrics, [songId]: response.data.lyrics },
            }));
        } catch (error) {
            console.error("Failed to fetch lyrics:", error);
            set((state) => ({
                lyrics: { ...state.lyrics, [songId]: null },
            }));
        } finally {
            set({ isLoadingLyrics: false });
        }
    },
    logPlay: async (payload: ListenEventMetaData) => {
        try {
            await axiosInstance.post("/users/play-history", payload);
        } catch (error) {
            console.error("Failed to log play history:", error);
        }
    },
}));