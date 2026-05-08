import { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";
import { Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const founders = [
    {
        name: "Aditya",
        role: "Backend Engineer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya&backgroundColor=b6e3f4",
        description:
            "Architecting scalable systems and robust APIs to keep SociTune running smoothly behind the scenes.",
        skills: ["Node.js", "MongoDB", "REST APIs", "Redis"],
    },
    {
        name: "Naaz Manhas",
        role: "DevOps Engineer",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naaz&backgroundColor=ffdfbf",
        description:
            "Ensuring seamless deployments and high availability — keeping the infrastructure rock-solid 24/7.",
        skills: ["Docker", "CI/CD", "Kubernetes", "AWS"],
    },
];

/* ─── Founder Card ─── */
function FounderCard({ founder }: { founder: (typeof founders)[0] }) {
    return (
        <Card
            className={cn(
                "group relative overflow-hidden",
                "bg-zinc-900/60 border border-zinc-800/60",
                "hover:border-emerald-500/30 hover:-translate-y-1",
                "transition-all duration-300 ease-out",
                "shadow-lg hover:shadow-emerald-950/40"
            )}
        >
            {/* Top shimmer line */}
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardContent className="flex flex-col items-center text-center gap-4 pt-8 pb-7 px-6">
                {/* Avatar with gradient ring */}
                <div className="relative">
                    <div className="rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-cyan-400">
                        <div className="rounded-full p-[2px] bg-zinc-900">
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={founder.image} alt={founder.name} />
                                <AvatarFallback className="bg-zinc-800 text-emerald-400 text-lg font-semibold">
                                    {founder.name[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    {/* Online indicator */}
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-zinc-900 shadow-[0_0_8px] shadow-emerald-400/60" />
                </div>

                {/* Name & Role */}
                <div className="space-y-1.5">
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                        {founder.name}
                    </h3>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="h-px w-8 bg-emerald-500/30" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                            {founder.role}
                        </span>
                        <span className="h-px w-8 bg-emerald-500/30" />
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed font-light max-w-xs">
                    {founder.description}
                </p>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {founder.skills.map((skill) => (
                        <Badge
                            key={skill}
                            variant="outline"
                            className="text-[11px] px-2.5 py-0.5 bg-zinc-800/50 border-zinc-700/60 text-zinc-400 font-normal tracking-wide"
                        >
                            {skill}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/* ─── Main Page ─── */
export default function FounderPage() {
    const [testimonials, setTestimonials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthStore();

    const fetchTestimonials = async () => {
        try {
            const res = await axiosInstance.get("/testimonials");
            setTestimonials(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch testimonials");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this testimonial?")) return;
        try {
            await axiosInstance.delete(`/testimonials/${id}`);
            toast.success("Testimonial deleted");
            setTestimonials((prev) => prev.filter((t: any) => t._id !== id));
        } catch {
            toast.error("Failed to delete testimonial");
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-black text-white">
            {/* Subtle radial glow at top */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-20"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 40% at 50% 0%, #10b981, transparent)",
                }}
            />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-20">

                {/* ── Header ── */}
                <header className="text-center space-y-5">
                    <Badge
                        variant="outline"
                        className="gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[11px] uppercase tracking-widest font-semibold px-3 py-1"
                    >
                        <Users className="w-3 h-3" />
                        The Team
                    </Badge>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-200 to-zinc-500 leading-tight">
                        Meet the Founders
                    </h1>

                    <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-light">
                        The minds behind SociTune, working tirelessly to bring you the best
                        social music experience.
                    </p>
                </header>

                {/* ── Founders Grid ── */}
                <section className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
                    {founders.map((f) => (
                        <FounderCard key={f.name} founder={f} />
                    ))}
                </section>

                {/* ── Testimonials ── */}
                <section className="space-y-10">
                    <Separator className="bg-zinc-800/60" />

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            What Our Users Say
                        </h2>
                        <p className="text-zinc-500 text-sm font-light">
                            Real feedback from the SociTune community
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : testimonials.length > 0 ? (
                        <div className="relative h-[22rem] flex flex-col items-center justify-center overflow-hidden">
                            {/* Edge fades */}
                            <div className="pointer-events-none absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-black to-transparent z-10" />
                            <div className="pointer-events-none absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-black to-transparent z-10" />

                            <InfiniteMovingCards
                                items={testimonials}
                                direction="right"
                                speed="slow"
                                onDelete={handleDelete}
                                isAdmin={isAdmin}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-14 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                            <p className="text-sm font-light">
                                No testimonials yet.{" "}
                                <span className="text-emerald-400">Be the first to share your thoughts!</span>
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}