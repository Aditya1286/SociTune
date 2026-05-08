import { useState } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

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
            toast.success("Thank you for your feedback!");
            setOpen(false);
            setContent("");
            setRating(5);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit feedback");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="fixed bottom-28 left-8 h-14 w-14 rounded-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-emerald-500 shadow-lg shadow-emerald-500/20 z-50 transition-all hover:scale-110"
                >
                    <MessageSquareHeart className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl text-center">Share your thoughts</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star 
                                    className={`h-8 w-8 ${star <= rating ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-600'}`} 
                                />
                            </button>
                        ))}
                    </div>
                    <textarea 
                        className="w-full bg-zinc-800 border-zinc-700 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-none"
                        placeholder="Tell us what you love or what we can improve..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <Button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FeedbackModal;
