import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader, Terminal } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSignIn, useUser } from "@clerk/clerk-react";

// Continuous elegant background waveform
const Waveform: React.FC<{ prefersReducedMotion: boolean }> = ({ prefersReducedMotion }) => {
  return (
    <div className="absolute inset-x-0 bottom-12 w-full h-32 overflow-hidden pointer-events-none opacity-40">
      <svg className="w-full h-full text-white/[0.03]" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
        <motion.path
          d="M0,60 Q180,90 360,60 T720,60 T1080,60 T1440,60"
          stroke="currentColor"
          strokeWidth="1"
          animate={prefersReducedMotion ? {} : {
            d: [
              "M0,60 Q180,90 360,60 T720,60 T1080,60 T1440,60",
              "M0,60 Q180,30 360,60 T720,60 T1080,60 T1440,60",
              "M0,60 Q180,90 360,60 T720,60 T1080,60 T1440,60"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut"
          }}
        />
        <motion.path
          d="M0,70 Q240,40 480,70 T960,70 T1440,70"
          stroke="currentColor"
          strokeWidth="0.75"
          animate={prefersReducedMotion ? {} : {
            d: [
              "M0,70 Q240,40 480,70 T960,70 T1440,70",
              "M0,70 Q240,100 480,70 T960,70 T1440,70",
              "M0,70 Q240,40 480,70 T960,70 T1440,70"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 14,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </svg>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const { isSignedIn, isLoaded, login, register, googleLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const { signIn, isLoaded: clerkLoaded } = useSignIn();
  const { isLoaded: userLoaded, isSignedIn: clerkSignedIn } = useUser();

  // Tab state: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  
  // Local error state
  const [localError, setLocalError] = useState<string | null>(null);

  // Hidden Developer Entry Modal State
  const [showDevModal, setShowDevModal] = useState(false);

  // Check prefers-reduced-motion media query
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Parallax cursor tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (prefersReducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReducedMotion]);

  // Inject Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Keyboard shortcut listener for Dev Bypass (⌘+D or Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setShowDevModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clerk auto-sync session redirect
  useEffect(() => {
    if (isLoaded && !isSignedIn && userLoaded && clerkSignedIn) {
      navigate("/auth-callback");
    }
  }, [isLoaded, isSignedIn, userLoaded, clerkSignedIn, navigate]);

  // Clerk Google OAuth Flow
  const handleGoogleSignIn = async () => {
    if (!clerkLoaded) {
      toast.error("Clerk is still loading. Please try again in a moment.");
      return;
    }
    if (clerkSignedIn) {
      navigate("/auth-callback");
      return;
    }
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth-callback",
      });
    } catch (err: any) {
      console.error("Clerk OAuth redirect failed:", err);
      toast.error(err.message || "Failed to start Google sign in");
    }
  };

  const handleMockLogin = async (profile: string) => {
    try {
      toast.loading(`Logging in as ${profile}...`, { id: "mock-login" });
      await googleLogin(`mock_credential_${profile}`);
      toast.success(`Logged in as ${profile}!`, { id: "mock-login" });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Mock login failed", { id: "mock-login" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Email and password are required");
      return;
    }

    if (activeTab === "signup" && !fullName) {
      setLocalError("Full name is required");
      return;
    }

    try {
      if (activeTab === "signin") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(email, password, fullName, username || undefined);
        toast.success("Account created successfully!");
      }
      navigate("/", { replace: true });
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0B0B0D] text-[#f4f4f6] flex flex-col justify-between p-6 md:p-12 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] select-none">
      
      {/* 1. Ambient background glows */}
      <motion.div 
        animate={prefersReducedMotion ? {} : {
          x: [0, 40, -20, 0],
          y: [0, -30, 40, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 70,
          ease: "easeInOut"
        }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(30,215,96,0.025)_0%,transparent_75%)] pointer-events-none filter blur-[120px]"
      />

      {/* 2. Header */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SociTune"
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-bold tracking-tight text-white">
            SociTune
          </span>
        </div>
        <nav className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-[#8b8b8b] font-semibold">
          <a href="#" className="hover:text-white transition-colors duration-200">About</a>
          <a href="#" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#" className="hover:text-white transition-colors duration-200">Privacy</a>
        </nav>
      </header>

      {/* 3. Main Grid Layout (60% / 40%) */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 relative z-20 items-center my-auto py-8">
        
        {/* Left Column: Hero Space (≈60% / 7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-12">
          
          <div className="space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-bold tracking-[0.25em] text-[#1ED760] uppercase"
            >
              Music made social
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-white leading-[1.1]"
            >
              Your sound.
              <br />
              Your people.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-sm sm:text-base text-[#8b8b8b] font-normal max-w-md leading-relaxed"
            >
              Discover people through the songs they're listening to right now.
            </motion.p>
          </div>

          {/* Floating artwork module */}
          <div className="relative w-full max-w-md h-[240px] flex items-center justify-start select-none">
            <Waveform prefersReducedMotion={prefersReducedMotion} />

            {/* Depth staggered covers */}
            <motion.div
              style={prefersReducedMotion ? {} : {
                transform: `translate3d(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px, 0)`
              }}
              animate={prefersReducedMotion ? {} : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute left-4 top-2 size-20 rounded-lg overflow-hidden shadow-lg border border-white/[0.04] opacity-50 pointer-events-none"
            >
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=240&auto=format&fit=crop" className="w-full h-full object-cover" alt="Art 1" />
            </motion.div>

            <motion.div
              style={prefersReducedMotion ? {} : {
                transform: `translate3d(${mousePos.x * 0.7}px, ${mousePos.y * 0.7}px, 0)`
              }}
              animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.4 }}
              className="absolute left-24 bottom-6 size-24 rounded-xl overflow-hidden shadow-xl border border-white/[0.05] opacity-70 pointer-events-none"
            >
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=240&auto=format&fit=crop" className="w-full h-full object-cover" alt="Art 2" />
            </motion.div>

            <motion.div
              style={prefersReducedMotion ? {} : {
                transform: `translate3d(${mousePos.x * 1.1}px, ${mousePos.y * 1.1}px, 0)`
              }}
              animate={prefersReducedMotion ? {} : { y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.8 }}
              className="absolute left-[170px] top-6 size-28 rounded-xl overflow-hidden shadow-2xl border border-white/[0.06] pointer-events-none"
            >
              <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=240&auto=format&fit=crop" className="w-full h-full object-cover" alt="Art 3" />
            </motion.div>

            <motion.div
              style={prefersReducedMotion ? {} : {
                transform: `translate3d(${mousePos.x * 1.4}px, ${mousePos.y * 1.4}px, 0)`
              }}
              animate={prefersReducedMotion ? {} : { y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1.2 }}
              className="absolute left-[280px] bottom-4 size-20 rounded-lg overflow-hidden shadow-2xl border border-white/[0.08] pointer-events-none opacity-85"
            >
              <img src="https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=240&auto=format&fit=crop" className="w-full h-full object-cover" alt="Art 4" />
            </motion.div>
          </div>

          {/* Social validation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                className="size-6 rounded-full object-cover ring-2 ring-[#0B0B0D]"
                alt="User A"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                className="size-6 rounded-full object-cover ring-2 ring-[#0B0B0D]"
                alt="User B"
              />
              <div className="relative size-6 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center ring-2 ring-[#0B0B0D]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ED760]/75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1ED760]"></span>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#8b8b8b] uppercase tracking-[0.2em]">
              1,204 people listening nearby
            </span>
          </div>

        </div>

        {/* Right Column: Premium Recessed Auth Card (≈40% / 5 Cols) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="lg:col-span-5 flex flex-col"
        >
          <div className="w-full bg-[#111214]/40 border border-white/[0.03] backdrop-blur-[16px] rounded-2xl p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden">
            
            {/* Top glass reflection line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="space-y-1.5 mb-8">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {activeTab === "signin" ? "Sign in to SociTune" : "Create your profile"}
              </h2>
              <p className="text-xs text-[#8b8b8b] font-light">
                {activeTab === "signin" ? "Continue where the music left off" : "Join the social music network"}
              </p>
            </div>

            {/* Error alerts */}
            {(localError || error) && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs mb-6"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span className="font-medium">{localError || error}</span>
              </motion.div>
            )}

            {/* Recessed Filled Input Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="popLayout" initial={false}>
                {activeTab === "signup" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#8b8b8b] tracking-[0.15em] uppercase">Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#0B0B0D]/80 border border-white/[0.04] focus:border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-[#1ED760]/5 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#8b8b8b] tracking-[0.15em] uppercase">Username (Optional)</label>
                      <input
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#0B0B0D]/80 border border-white/[0.04] focus:border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-[#1ED760]/5 transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8b8b8b] tracking-[0.15em] uppercase">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0B0D]/80 border border-white/[0.04] focus:border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-[#1ED760]/5 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8b8b8b] tracking-[0.15em] uppercase">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0B0D]/80 border border-white/[0.04] focus:border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-[#1ED760]/5 transition-all duration-200"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1ED760] disabled:opacity-50 text-black font-semibold text-xs tracking-wider py-3.5 px-6 rounded-xl shadow-lg active:scale-[0.98] transition-all hover:bg-[#22eb69] duration-150 cursor-pointer flex items-center justify-center mt-6"
              >
                {isLoading ? (
                  <Loader className="size-4 animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.04]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em]">
                <span className="bg-[#111214] px-4 text-[#8b8b8b]">or</span>
              </div>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!clerkLoaded}
              className="w-full flex items-center justify-center gap-3 bg-transparent hover:bg-white/[0.02] border border-white/10 hover:border-white/20 text-white font-semibold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] duration-150 cursor-pointer tracking-wider"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.59 5.59 0 0 1 8.4 12.928a5.59 5.59 0 0 1 5.591-5.59c1.508 0 2.87.56 3.93 1.487l3.147-3.14A9.954 9.954 0 0 0 13.99 2.4c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.787 0 9.625-4.068 9.625-9.792 0-.6-.051-1.178-.148-1.723H12.24Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Footer switcher toggles */}
            <div className="text-center mt-8 pt-4 border-t border-white/[0.02]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(activeTab === "signin" ? "signup" : "signin");
                  setLocalError(null);
                }}
                className="text-xs text-[#8b8b8b] hover:text-white transition-colors duration-200"
              >
                {activeTab === "signin" ? (
                  <>
                    <span>Don't have an account? </span>
                    <span className="text-[#1ED760] font-semibold">Create one →</span>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <span className="text-[#1ED760] font-semibold">Sign In →</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#8b8b8b] z-30 pt-8 border-t border-white/[0.02] gap-4">
        <p>© 2026 SociTune. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
        </div>
      </footer>

      {/* Hidden VIP Developer Entry Dialog (Triggered via ⌘+D / Ctrl+D) */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            onClick={() => setShowDevModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="bg-[#111214] border border-white/[0.06] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="size-4 text-[#1ED760]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">VIP Developer Shortcut</h3>
              </div>
              <p className="text-xs text-[#8b8b8b] mb-6 font-light leading-relaxed">
                You opened the hidden developer gateway. Choose a profile below to instantly simulate a local session bypass:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["alice", "bob", "charlie", "dave"].map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => {
                      handleMockLogin(profile);
                      setShowDevModal(false);
                    }}
                    className="bg-[#1a1b1f] hover:bg-[#23242a] border border-white/[0.04] py-3.5 px-4 rounded-xl text-center text-xs font-bold text-zinc-300 hover:text-[#1ED760] capitalize transition-all cursor-pointer"
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LoginPage;
