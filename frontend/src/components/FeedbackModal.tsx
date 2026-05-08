import { useState } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const FeedbackModal = () => {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return toast.error("Please enter feedback");
        
        try {
            setIsSubmitting(true);
            await axiosInstance.post("/testimonials", { rating, content });
            
            // Close modal and reset form
            setOpen(false);
            setContent("");
            setRating(5);
            
            toast.success("Thank you for your feedback!");

            // Epic confetti blast
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

            // Tell the founder page to refresh its list
            window.dispatchEvent(new Event("testimonial-added"));
            
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button 
                    className="fixed bottom-28 left-6 sm:left-8 text-zinc-500 hover:text-white transition-colors duration-200 z-50 p-2"
                    aria-label="Provide Feedback"
                >
                    <MessageSquareHeart className="h-7 w-7" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl p-0 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-70" />
                <div className="p-6 sm:p-8">
                    <DialogHeader className="mb-6 space-y-1.5">
                        <DialogTitle className="text-2xl text-center font-bold tracking-tight text-zinc-100">
                            Share your thoughts
                        </DialogTitle>
                        <p className="text-center text-sm text-zinc-400 font-light">
                            Help us improve your SociTune experience
                        </p>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-center space-x-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-125"
                                >
                                    <Star 
                                        className={`h-9 w-9 transition-colors duration-200 ${star <= rating ? 'fill-emerald-400 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-zinc-700 hover:text-zinc-500'}`} 
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <textarea 
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 min-h-[120px] resize-none transition-all"
                                placeholder="What do you love? What can we do better?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold h-11 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FeedbackModal;
