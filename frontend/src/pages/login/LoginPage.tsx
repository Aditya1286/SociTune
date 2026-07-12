import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkles, Headphones, Loader } from "lucide-react";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuth } from "@/lib/clerk-mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginPage: React.FC = () => {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { login, signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // If already authenticated, redirect to the main app homepage
  if (isAuthLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError("Please fill out all required fields.");
      return;
    }

    if (isSignUp && !fullName) {
      setValidationError("Please enter your full name.");
      return;
    }

    if (isSignUp) {
      const res = await signup(email, password, fullName, username || undefined);
      if (res.success) {
        navigate("/onboarding");
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        navigate("/");
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050606] text-white flex items-center justify-center p-6 md:p-12 overflow-hidden font-sans select-none">
      
      {/* 1. Subtle Premium Dot Grid (Matches senior UI/UX standard) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* 2. Soft Ambient Lighting Leak (Very subtle) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_35%,rgba(16,185,129,0.03)_0%,transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_75%_65%,rgba(99,102,241,0.02)_0%,transparent_60%)]" />

      {/* 3. Main Visual Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 relative z-20 items-center">
        
        {/* Left Side: Product Narrative & Interactive Showcase */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SociTune"
              className="h-9 w-auto object-contain drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]"
            />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-white font-outfit">
                Soci<span className="text-emerald-400">Tune</span>
              </span>
              <span className="text-[8px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mt-0.5">
                Music Social Network
              </span>
            </div>
          </div>

          {/* Editorial Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-100 to-zinc-400">
              The soundtrack of your{" "}
              <PointerHighlight
                rectangleClassName="border-emerald-500/50 bg-emerald-500/5 rounded-lg px-2 py-0.5"
                pointerClassName="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
              >
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  social world
                </span>
              </PointerHighlight>
              .
            </h1>
            <p className="text-xs sm:text-sm text-zinc-550 font-light max-w-lg leading-relaxed">
              Discover and share what your friends are listening to in real-time. Analyze your acoustic fingerprint, match with musical soulmates, and sync your music vibe curves.
            </p>
          </div>

          {/* Interactive Live Mock Feed */}
          <div className="space-y-3 max-w-md pt-4">
            <div className="flex items-center gap-2">
              <Headphones className="size-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Active Now</span>
            </div>
            
            {/* Mock Item 1 */}
            <div className="bg-zinc-950/45 border border-white/[0.04] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-emerald-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative size-11 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" 
                  className="w-full h-full object-cover rounded-xl border border-white/[0.05]" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full border-2 border-[#050606] flex items-center justify-center">
                  <span className="size-1 bg-white rounded-full animate-pulse" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Sarah Jenkins</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/10">96% Match</span>
                </div>
                
                {/* Live bouncing visualizer */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex gap-0.5 items-end h-2.5 w-3">
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite] h-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1.2s_infinite] h-1.5" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite] h-2.5" />
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">
                    listening to <span className="text-zinc-200 font-medium">Blinding Lights</span> — The Weeknd
                  </p>
                </div>
              </div>
            </div>

            {/* Mock Item 2 */}
            <div className="bg-zinc-950/45 border border-white/[0.04] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-md opacity-80">
              <div className="relative size-11 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                  className="w-full h-full object-cover rounded-xl border border-white/[0.05]" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-zinc-700 rounded-full border-2 border-[#050606]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Marcus Chen</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-450 font-medium border border-white/[0.03]">84% Match</span>
                </div>
                <p className="text-[10px] text-zinc-500 truncate mt-1">
                  listening to <span className="text-zinc-400">Get Lucky</span> — Daft Punk
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Credentials Auth Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full bg-zinc-950/35 border border-white/[0.05] backdrop-blur-[24px] rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col relative overflow-hidden">
            {/* Top border shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="text-center space-y-2 mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white font-outfit">
                {isSignUp ? "Create an Account" : "Welcome Back"}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isSignUp ? "Sign up to start sharing your soundtrack." : "Sign in to sync your Spotify profile and start discovery."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Full Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-zinc-900/40 border-zinc-850 focus:border-emerald-500/50 rounded-xl h-11 text-sm text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Username (Optional)</label>
                    <Input
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-zinc-900/40 border-zinc-850 focus:border-emerald-500/50 rounded-xl h-11 text-sm text-white"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/40 border-zinc-850 focus:border-emerald-500/50 rounded-xl h-11 text-sm text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-900/40 border-zinc-850 focus:border-emerald-500/50 rounded-xl h-11 text-sm text-white"
                  required
                />
              </div>

              {(validationError || error) && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-center font-medium">
                  {validationError || error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs tracking-wider uppercase h-11 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="size-4 animate-spin text-zinc-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                )}
              </Button>
            </form>

            {/* Switch Mode Link */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setValidationError(null);
                  useAuthStore.getState().reset();
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
              >
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </button>
            </div>

            {/* Subtitle Annotation */}
            <div className="flex items-center gap-1.5 mt-8 justify-center text-zinc-650">
              <Sparkles className="size-3.5 text-emerald-500/50" />
              <span className="text-[9px] tracking-widest font-semibold uppercase">Secured by Local JWT Auth</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
