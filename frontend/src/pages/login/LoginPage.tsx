import React from "react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Sparkles, Headphones } from "lucide-react";

const LoginPage: React.FC = () => {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();

  // If already authenticated, redirect to the main app homepage
  if (isAuthLoaded && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = () => {
    if (!isSignInLoaded) return;
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/auth-callback",
    });
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
              The soundtrack of your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">social world</span>.
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

        {/* Right Side: Clean Glass Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          
          <div className="w-full bg-zinc-950/35 border border-white/[0.05] backdrop-blur-[24px] rounded-2xl p-8 sm:p-10 shadow-2xl flex flex-col items-center relative overflow-hidden">
            {/* Top border shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-xl font-bold tracking-tight text-white font-outfit">Join the Soundtrack</h2>
              <p className="text-[11px] text-zinc-500">Sign in to sync your Spotify profile and start discovery.</p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!isSignInLoaded}
              className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl shadow-lg hover:bg-zinc-100 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.23-.67-.35-1.37-.35-2.09z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Subtitle Annotation */}
            <div className="flex items-center gap-1.5 mt-8 text-zinc-650">
              <Sparkles className="size-3.5 text-emerald-500/50" />
              <span className="text-[9px] tracking-widest font-semibold uppercase">Secured by Clerk & Google</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
