import {create} from "zustand";
import type { Song } from "@/types";
import { axiosInstance } from "@/lib/axios";

const logPlay = async (songId: string) => {
    try {
        await axiosInstance.post("/users/play-history", { songId });
    } catch (error) {
        console.error("Failed to log play history:", error);
    }
};

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
        logPlay(song._id);
    },
    setCurrentSong: (song: Song | null) => {

        if(!song) return;
        const songIndex = get().queue.findIndex(s => s._id === song._id);
        set({
            currentSong: song,
            isPlaying: true,
            currentIndex: songIndex !== -1 ? songIndex : get().currentIndex,
        });
        logPlay(song._id);
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
            logPlay(nextSong._id);
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
            logPlay(prevSong._id);
        }
        else{
            set({isPlaying: false});
        }
    },
}));