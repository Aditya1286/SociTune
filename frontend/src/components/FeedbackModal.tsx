import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const FeedbackModal = () => {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handleOpen = () => setOpen(true);
        document.addEventListener("open-feedback", handleOpen);
        return () => document.removeEventListener("open-feedback", handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return toast.error("Please enter feedback");
        
        try {
            setIsSubmitting(true);
            await axiosInstance.post("/testimonials", { rating, content });
            
            setOpen(false);
            setContent("");
            setRating(5);
            
            toast.success("Feedback submitted");

            // Epic side-popping confetti blast
            const end = Date.now() + 2 * 1000;
            const colors = ["#10b981", "#34d399", "#ffffff", "#06b6d4"];

            (function frame() {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors,
                    zIndex: 1000,
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors,
                    zIndex: 1000,
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            })();

            window.dispatchEvent(new Event("testimonial-added"));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRating = hoveredRating || rating;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px] bg-[#09090b] border border-zinc-800 p-0 shadow-xl rounded-xl">
                <div className="p-6">
                    <DialogHeader className="mb-5 space-y-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                                <MessageSquare className="w-5 h-5 text-zinc-300" />
                            </div>
                            <DialogTitle className="text-lg font-medium text-zinc-100">
                                Send feedback
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-zinc-400">
                            Let us know what's on your mind. We read every submission.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none p-1 transition-transform active:scale-95"
                                >
                                    <Star 
                                        className={`h-6 w-6 transition-all duration-200 ${
                                            star <= displayRating 
                                                ? 'fill-emerald-500 text-emerald-500' 
                                                : 'fill-transparent text-zinc-700 hover:text-zinc-500'
                                        }`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <div>
                            <textarea 
                                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 min-h-[100px] resize-none transition-colors"
                                placeholder="Your thoughts..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        
                        <div className="flex justify-end pt-2">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !content.trim()}
                                className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium h-9 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Submit"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FeedbackModal;
