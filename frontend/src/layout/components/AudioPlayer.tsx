import { usePlayerStore } from "@/stores/usePlayerStore";
import { useEffect, useRef } from "react";

const AudioPlayer = () => {
   const audioRef = useRef<HTMLAudioElement>(null);
   const prevSongRef = useRef<string | null>(null);

   const {currentSong, isPlaying, playNext, isLooping} = usePlayerStore();
   const handleEnded = () => {
    playNext();
   }
    useEffect(() => {
        if(isPlaying) audioRef.current?.play();
        else audioRef.current?.pause();

    },[isPlaying])

    useEffect(() => {
        const audio = audioRef.current;
        audio?.addEventListener("ended",handleEnded);
        return () =>{
            audio?.removeEventListener("ended",handleEnded);
        }
    },[playNext])

    useEffect(() => {
        if(!audioRef.current|| !currentSong) return;
        const audio = audioRef.current;
        //checking for the new one !!
        const isSongChange = prevSongRef.current !== currentSong?.audioUrl;
        if(isSongChange){
            audio.src=currentSong?.audioUrl;
            //reset the playback posiyion
            audio.currentTime = 0;

            prevSongRef.current = currentSong?.audioUrl;
            if(isPlaying) audio.play();
        }

    },[currentSong,isPlaying])
  return <audio ref={audioRef} loop={isLooping} />;
} 

export default AudioPlayer