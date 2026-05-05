import type { Song } from "@/types"
import SectionGridSkeleton from "@/components/skeletons/SectionGridSkeleton"
import { Button } from "@/components/ui/button";
import PlayButton from "./PlayButton";
type SectionGridProps = {
  title: string;        
  songs: Song[];
  isLoading: boolean;
} 
const SectionGrid = ({ title, songs, isLoading }: SectionGridProps) => {
    if(isLoading) return <SectionGridSkeleton/>
    return (
    <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
            <Button variant='link' className="text-sm text-zinc-400 hover:text-white">
                Show ALL
            </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {songs.map((song) => (
					<div
						key={song._id}
						className='bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer'
					>
						<div className='relative mb-4'>
							<div className='aspect-square rounded-lg shadow-lg overflow-hidden'>
								<img
									src={song.imageUrl}
									alt={song.title}
									className='w-full h-full object-cover transition-transform duration-500 
									group-hover:scale-110'
								/>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
							</div>
							<PlayButton song={song} />
						</div>
						<h3 className='font-semibold text-white/90 group-hover:text-white mb-2 truncate transition-colors'>{song.title}</h3>
						<p className='text-sm text-zinc-400/80 group-hover:text-zinc-300 truncate transition-colors'>{song.artist}</p>
					</div>
				))}
        </div>
    </div>
  )
}

export default SectionGrid