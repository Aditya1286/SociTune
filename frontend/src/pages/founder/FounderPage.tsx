"use client";

import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import toast from "react-hot-toast";
import { Loader2, Users, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
    _id: string;
    content?: string;
    text?: string;
    name?: string;
    handle?: string;
    rating?: number;
    message?: string;
    user?: {
        fullName?: string;
        imageUrl?: string;
    };
}

const founders = [
    {
        name: "Aditya",
        role: "Backend Engineer",
        image: "/adi.png",
        description: "Architecting scalable systems and robust APIs to keep SociTune running smoothly behind the scenes.",
        skills: ["Node.js", "MongoDB", "REST APIs", "Redis"],
        tilt: "-1.5deg" as const,
        ringDir: "normal" as const,
    },
    {
        name: "Naaz Manhas",
        role: "DevOps Engineer",
        image: "/asa.jpeg",
        description: "My sleep schedule is basically a distributed system — unreliable, hard to monitor, and somehow still running in production. Powered by caffeine, late-night deployments, and bad decisions that start with “just one more commit.",
        skills: ["Docker", "CI/CD", "Kubernetes", "AWS"],
        tilt: "1.5deg" as const,
        ringDir: "reverse" as const,
    },
];

export default function FounderPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthStore();

    // Refs
    const pageRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const marqueeTrackRef = useRef<HTMLDivElement>(null);

    /* ── Fetch Testimonials ── */
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
        if (!confirm("Delete this testimonial?")) return;
        try {
            await axiosInstance.delete(`/testimonials/${id}`);
            toast.success("Testimonial deleted");
            setTestimonials((prev) => prev.filter((t) => t._id !== id));
        } catch {
            toast.error("Failed to delete testimonial");
        }
    };

    /* ── GSAP & Animations ── */
    useEffect(() => {
        // Load fonts
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Bebas+Neue&display=swap";
        document.head.appendChild(link);

        // Hero & Scroll Animations (cleaned)
        const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
        heroTl
            .to(".hero-badge", { opacity: 1, y: 0, duration: 0.7 }, 0.3)
            .to(".hero-title", { opacity: 1, y: 0, duration: 0.9 }, 0.55)
            .to(".hero-sub", { opacity: 1, y: 0, duration: 0.7 }, 0.85);

        // Scroll Triggers
        ScrollTrigger.create({
            trigger: ".founders-section",
            start: "top 80%",
            onEnter: () => {
                gsap.to(".founder-card", {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    ease: "power3.out",
                });
            },
        });

        ScrollTrigger.create({
            trigger: ".testimonials-section",
            start: "top 85%",
            onEnter: () => {
                gsap.to(".marquee-container", { opacity: 1, y: 0, duration: 0.8 });
            },
        });

        // Mouse parallax glow
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 35;
            const y = (e.clientY / window.innerHeight - 0.5) * 25;
            gsap.to(glowRef.current, { x, y, duration: 1.4, ease: "power1.out" });
        };

        document.addEventListener("mousemove", handleMouseMove);

        // Listen for new testimonials from FeedbackModal
        const onNewTestimonial = () => fetchTestimonials();
        window.addEventListener("testimonial-added", onNewTestimonial);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("testimonial-added", onNewTestimonial);
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, []);

    /* ── Global Styles ── */
    useEffect(() => {
        const styleId = "socitune-founder-styles";
        if (document.getElementById(styleId)) return;

        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
      @keyframes spin-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse-dot { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

      .avatar-ring-0 { animation: spin-ring 7s linear infinite; }
      .avatar-ring-1 { animation: spin-ring 7s linear infinite reverse; }
      .online-dot { animation: pulse-dot 2s ease-in-out infinite; }
      .marquee-track { animation: marquee 32s linear infinite; }
      .marquee-track:hover { animation-play-state: paused; }
    `;
        document.head.appendChild(style);
    }, []);

    const loopedTestimonials = [...testimonials, ...testimonials];

    return (
        <div ref={pageRef} className="bg-[#060a0a] text-[#f0faf7] min-h-screen overflow-x-hidden relative font-sans">
            {/* Particles & Noise */}
            <div className="fixed inset-0 pointer-events-none z-0" />
            <div className="fixed inset-0 opacity-40 pointer-events-none z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 max-w-[960px] mx-auto px-6 pb-20">
                {/* HERO */}
                <section className="min-h-screen flex flex-col items-center justify-center text-center relative py-20">
                    <div ref={glowRef} className="absolute w-[600px] h-[420px] bg-[radial-gradient(ellipse,rgba(16,185,129,0.15)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    <div className="hero-badge opacity-0 translate-y-5 inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-medium tracking-widest px-5 py-2 rounded-full mb-8">
                        <Users size={14} /> The SociTune Team
                    </div>

                    <h1 className="hero-title opacity-0 translate-y-10 font-['Bebas_Neue'] text-[clamp(62px,11vw,128px)] leading-none tracking-tight">
                        Meet the <span className="text-emerald-500">Founders</span>
                        <span className="block font-['Caveat'] text-[clamp(26px,4.5vw,42px)] text-emerald-500 -mt-2">
                            behind the music ♪
                        </span>
                    </h1>

                    <p className="hero-sub opacity-0 translate-y-6 max-w-md mt-8 text-[#6b7c78] text-[15px]">
                        The minds and caffeine-fueled dreams that power SociTune.
                    </p>
                </section>

                {/* FOUNDERS SECTION */}
                <section className="founders-section py-20">
                    <div className="mb-12">
                        <p className="font-['Caveat'] text-emerald-500 text-xl">→ the people</p>
                        <h2 className="font-['Bebas_Neue'] text-6xl tracking-wide">Core Team</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {founders.map((founder) => (
                            <FounderCard key={founder.name} founder={founder} />
                        ))}
                    </div>
                </section>

                {/* TESTIMONIALS */}
                <section className="testimonials-section py-20">
                    <div className="mb-12">
                        <p className="font-['Caveat'] text-emerald-500 text-xl">→ community love</p>
                        <h2 className="font-['Bebas_Neue'] text-6xl tracking-wide">What Users Say</h2>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                        </div>
                    ) : testimonials.length > 0 ? (
                        <div className="marquee-container opacity-0 overflow-hidden">
                            <div
                                ref={marqueeTrackRef}
                                className="marquee-track flex gap-4 w-max"
                            >
                                {loopedTestimonials.map((t, i) => (
                                    <TestiCard
                                        key={`${t._id}-${i}`}
                                        item={t}
                                        isAdmin={isAdmin}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-[#4a5955] py-20">No testimonials yet.</p>
                    )}
                </section>

                {/* FOOTER */}
                <div className="text-center pt-16 pb-10 border-t border-[#1e2422]">
                    <div className="font-['Bebas_Neue'] text-6xl bg-gradient-to-r from-white via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                        SociTune
                    </div>
                    <p className="text-xs tracking-widest text-[#4a5955] mt-2">SOCIAL MUSIC — MADE WITH ♥</p>
                </div>
            </div>
        </div>
    );
}

/* ── Reusable Components ── */
function FounderCard({ founder }: { founder: typeof founders[0] }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                y: -12,
                rotate: 0,
                boxShadow: "0 30px 70px rgba(0,0,0,0.6), 0 0 50px rgba(16,185,129,0.1)",
                duration: 0.4,
                ease: "power2.out",
            });
        }
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            gsap.to(cardRef.current, {
                y: 0,
                rotate: founder.tilt,
                boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                duration: 0.5,
                ease: "power2.inOut",
            });
        }
    };

    return (
        <div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "founder-card relative bg-[#0d1211] border border-[#1e2422] rounded-3xl p-8 transition-all duration-300",
                `rotate-[${founder.tilt}]`
            )}
            style={{ transform: `rotate(${founder.tilt})` }}
        >
            {/* Pushpin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-white/50 absolute top-1 left-1" />
                <div className="absolute -bottom-2 w-1.5 h-3 bg-black/60 blur-[1px] -z-10 rounded-full" />
            </div>

            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                    <div className="rounded-full p-[2px] bg-gradient-to-br from-emerald-400 to-cyan-400">
                        <div className="rounded-full p-[2px] bg-[#0d1211]">
                            <div className="w-24 h-24 rounded-full overflow-hidden relative bg-zinc-800">
                                <img src={founder.image} alt={founder.name} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0d1211] shadow-[0_0_8px] shadow-emerald-400/60" />
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-3xl tracking-wide text-white font-['Bebas_Neue'] m-0">
                        {founder.name}
                    </h3>
                    <div className="flex items-center gap-2 justify-center">
                        <span className="h-[1px] w-8 bg-emerald-500/30" />
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                            {founder.role}
                        </span>
                        <span className="h-[1px] w-8 bg-emerald-500/30" />
                    </div>
                </div>

                <p className="text-sm text-[#9aada8] leading-relaxed font-light max-w-[260px] m-0">
                    {founder.description}
                </p>

                <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {founder.skills.map((skill) => (
                        <span
                            key={skill}
                            className="text-[10px] px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/20 text-[#9aada8] rounded-full font-normal tracking-wide"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TestiCard({ item, isAdmin, onDelete }: { item: Testimonial; isAdmin: boolean; onDelete: (id: string) => void }) {
    return (
        <div className="bg-[#0d1211] border border-[#1e2422] rounded-2xl p-6 w-[320px] flex-shrink-0 hover:border-emerald-500/30 transition-colors flex flex-col justify-between min-h-[180px]">
            <div>
                <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${i < (item.rating || 5) ? 'text-emerald-400 fill-emerald-400' : 'text-[#2a3330] fill-[#2a3330]'}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    ))}
                </div>
                <div className="font-['Caveat'] text-3xl text-emerald-500 leading-none mb-1">"</div>
                <p className="text-[13px] text-[#9aada8] leading-[1.6] font-light mb-4">
                    {item.message ?? item.text ?? item.content}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 border border-[#2a3330]">
                    <AvatarImage src={item.user?.imageUrl} alt={item.user?.fullName ?? item.name} className="object-cover" />
                    <AvatarFallback className="bg-[#1e2422] text-emerald-400 font-['Bebas_Neue'] text-lg">
                        {(item.user?.fullName ?? item.name ?? "U")[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#f0faf7] truncate">
                        {item.user?.fullName ?? item.name}
                    </div>
                    {item.handle && (
                        <div className="text-[11px] text-[#4a5955] truncate">
                            {item.handle}
                        </div>
                    )}
                </div>
                {isAdmin && (
                    <button
                        onClick={() => onDelete(item._id)}
                        className="text-[#4a5955] hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}