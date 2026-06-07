import { Heart } from "lucide-react";
import { useMusicStore } from "@/stores/useMusicStore";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
    songId: string;
    className?: string;
}

export const LikeButton = ({ songId, className }: LikeButtonProps) => {
    const { likedSongs, toggleLikeSong } = useMusicStore();
    
    // Check if songId exists in the likedSongs array
    // Our backend might return populated objects or just IDs, let's handle both
    const isLiked = likedSongs.some((song: any) => 
        (song._id === songId) || (song === songId)
    );

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent triggering parent clicks
        await toggleLikeSong(songId);
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLike}
            className={cn("hover:text-emerald-500 hover:bg-transparent", className)}
        >
            <Heart 
                className={cn(
                    "size-5 transition-all duration-300", 
                    isLiked ? "fill-emerald-500 text-emerald-500 scale-110" : "text-zinc-400"
                )} 
            />
        </Button>
    );
};
