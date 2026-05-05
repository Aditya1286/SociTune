import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Song } from "@/types";
import { Pause, Play } from "lucide-react";

const PlayButton = ({ song }: { song: Song }) => {
	const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();
	const isCurrentSong = currentSong?._id === song._id;

	const handlePlay = () => {
		if (isCurrentSong) togglePlay();
		else setCurrentSong(song);
	};

	return (
		<Button
			size={"icon"}
			onClick={handlePlay}
			className={`absolute bottom-3 right-2 bg-emerald-500 hover:bg-emerald-400 hover:scale-110 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 
				opacity-0 translate-y-2 group-hover:translate-y-0 z-10 ${
					isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
				}`}
		>
			{isCurrentSong && isPlaying ? (
				<Pause className='size-5 text-black' />
			) : (
				<Play className='size-5 text-black' />
			)}
		</Button>
	);
};
export default PlayButton;