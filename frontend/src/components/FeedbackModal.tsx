import { useState, useEffect } from "react";
import { Star, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

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
            
            toast.success("Feedback sent");

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
    const ratingLabels = ["", "Terrible", "Could be better", "It's okay", "Pretty good", "Absolutely love it!"];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md bg-[rgba(24,24,24,0.82)] backdrop-blur-2xl border border-white/10 text-white shadow-2xl p-0 overflow-hidden rounded-[28px] focus:outline-none">
                {/* Custom Mac-style circular close button that shows on hover */}
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all focus:outline-none"
                    aria-label="Close"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                <div className="p-8 sm:p-10 flex flex-col items-center">
                    <DialogHeader className="mb-8 space-y-3 text-center items-center">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center shadow-inner mb-2">
                            <MessageCircle className="w-6 h-6 text-zinc-300" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                            Share Feedback
                        </DialogTitle>
                        <DialogDescription className="text-sm text-zinc-400 max-w-xs font-normal leading-relaxed">
                            Your thoughts help us build a better music experience.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="w-full space-y-8">
                        {/* Rating Stars - Apple Style */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex justify-center gap-2.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <motion.button
                                        key={star}
                                        type="button"
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.95 }}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                        className="focus:outline-none"
                                    >
                                        <Star 
                                            className={`h-8 w-8 transition-colors duration-200 ${
                                                star <= displayRating 
                                                    ? 'fill-[#F59E0B] text-[#F59E0B] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                                                    : 'fill-transparent text-zinc-600 hover:text-zinc-400'
                                            }`} 
                                        />
                                    </motion.button>
                                ))}
                            </div>
                            <div className="h-4">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={displayRating}
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        transition={{ duration: 0.15 }}
                                        className="text-xs font-semibold text-[#F59E0B]"
                                    >
                                        {ratingLabels[displayRating]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Input Field - Notes / Search Style */}
                        <div className="relative">
                            <textarea 
                                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#1ED760]/30 focus:border-[#1ED760]/40 min-h-[130px] resize-none transition-all duration-300 shadow-inner"
                                placeholder="Tell us what you enjoyed or what we could improve…"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                        
                        {/* Apple-style Action Buttons */}
                        <div className="flex flex-col gap-3 pt-2">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !content.trim()}
                                className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-12 rounded-full transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending..." : "Send Feedback"}
                            </Button>
                            
                            <button 
                                type="button"
                                onClick={() => setOpen(false)}
                                className="w-full text-zinc-400 hover:text-white font-medium text-sm h-10 rounded-full hover:bg-white/[0.02] active:bg-white/[0.04] transition-all"
                            >
                                Not Now
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FeedbackModal;
