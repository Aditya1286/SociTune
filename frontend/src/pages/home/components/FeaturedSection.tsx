import { useMusicStore } from "@/stores/useMusicStore";
import FeaturedGridSkeleton from "@/components/skeletons/FeaturedGridSkeleton";
import PlayButton from "./PlayButton";

const FeaturedSection = () => {
	const { isLoading, featuredSongs, error } = useMusicStore();

	if (isLoading) return <FeaturedGridSkeleton />;

	if (error) return <p className='text-red-500 mb-4 text-lg'>{error}</p>;

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
			{featuredSongs.map((song) => (
				<div
					key={song._id}
					className='flex items-center bg-white/5 backdrop-blur-md rounded-xl overflow-hidden
         hover:bg-white/10 hover:-translate-y-1 border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer relative'
				>
					<div className="relative w-16 sm:w-20 h-16 sm:h-20 overflow-hidden flex-shrink-0">
						<img
							src={song.imageUrl}
							alt={song.title}
							className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
						/>
						<div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
					</div>
					<div className='flex-1 p-4'>
						<p className='font-semibold text-white/90 group-hover:text-white transition-colors truncate'>{song.title}</p>
						<p className='text-sm text-zinc-400/80 group-hover:text-zinc-300 transition-colors truncate'>{song.artist}</p>
					</div>
					<PlayButton song={song} />
				</div>
				
			))}
		</div>
	);
};
export default FeaturedSection;