import { useEffect, useRef } from "react";
import { Music, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

const tiers = [
  {
    name: "1 Month",
    price: "99",
    duration: "month",
    features: ["Discover non-followers' activity", "Music taste matching"],
    popular: false,
  },
  {
    name: "3 Months",
    price: "250",
    duration: "quarter",
    features: ["Discover non-followers' activity", "Music taste matching", "Priority connections"],
    popular: true,
  },
  {
    name: "1 Year",
    price: "800",
    duration: "year",
    features: ["Discover non-followers' activity", "Music taste matching", "Priority connections", "Exclusive early access"],
    popular: false,
  },
];

export default function PremiumPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Bebas+Neue&display=swap";
    document.head.appendChild(link);

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(".hero-badge", { opacity: 1, y: 0, duration: 0.6 }, 0.2)
      .to(".hero-title", { opacity: 1, y: 0, duration: 0.8 }, 0.4)
      .to(".hero-sub", { opacity: 1, y: 0, duration: 0.6 }, 0.6)
      .to(".tier-card", { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, 0.8);

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      gsap.to(glowRef.current, { x, y, duration: 1.5, ease: "power1.out" });
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      tl.kill();
    };
  }, []);

  return (
    <div ref={pageRef} className="bg-[#060a0a] text-[#f0faf7] min-h-screen overflow-y-auto relative font-sans w-full">
      {/* Background Noise */}
      <div className="fixed inset-0 pointer-events-none z-0" />
      <div
        className="fixed inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-20 min-h-screen flex flex-col items-center justify-center">
        <div
          ref={glowRef}
          className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_60%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        />

        <div className="text-center w-full max-w-3xl mx-auto mb-16 relative">
          <div className="hero-badge opacity-0 translate-y-4 inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-xs font-bold tracking-[0.2em] px-4 py-1.5 rounded-full mb-8 uppercase">
            <Sparkles size={14} className="animate-pulse" /> Coming Soon
          </div>

          <h1 className="hero-title opacity-0 translate-y-8 font-['Bebas_Neue'] text-[clamp(48px,8vw,96px)] leading-[0.9] tracking-tight mb-6">
            SociTune <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Premium</span>
            <span className="block font-['Caveat'] text-[clamp(24px,4vw,36px)] text-emerald-500/80 -mt-2 tracking-normal font-normal">
              unleash the music connection
            </span>
          </h1>

          <p className="hero-sub opacity-0 translate-y-6 text-[#9aada8] text-[clamp(14px,2vw,18px)] leading-relaxed max-w-2xl mx-auto font-light">
            Curious about what the world is listening to? Discover live music activities of users you don't follow and connect with entirely new people based purely on your identical music taste.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "tier-card opacity-0 translate-y-10 relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col group",
                tier.popular
                  ? "bg-gradient-to-b from-[#111816] to-[#0d1211] border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                  : "bg-[#0d1211] border border-[#1e2422]"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-[#060a0a] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-medium text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-['Bebas_Neue'] text-emerald-500 tracking-wide">₹</span>
                  <span className="text-6xl font-['Bebas_Neue'] text-white tracking-wide">{tier.price}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500/70 shrink-0 mt-0.5" />
                    <span className="text-sm text-[#9aada8] leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 rounded-xl font-medium text-sm transition-all duration-300 bg-[#1e2422] text-[#6b7c78] cursor-not-allowed border border-[#2a3330]">
                Coming Soon
              </button>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-24 max-w-4xl w-full mx-auto border-t border-[#1e2422] pt-16">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h4 className="text-white font-medium mb-2">Global Activity Radar</h4>
                    <p className="text-sm text-[#9aada8] leading-relaxed">See what anyone is playing right now, even if you don't follow them. Break out of your bubble.</p>
                </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <h4 className="text-white font-medium mb-2">Taste Matchmaking</h4>
                    <p className="text-sm text-[#9aada8] leading-relaxed">Our algorithm finds users with identical music taste and introduces you. Find your music soulmates.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
