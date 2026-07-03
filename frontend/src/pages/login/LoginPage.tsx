import React from "react";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music2, Sparkles, Flame, Headphones } from "lucide-react";

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
    <div className="relative min-h-screen w-full bg-[#040807] text-white flex items-center justify-center p-4 overflow-hidden font-sans select-none">
      {/* 1. Dynamic Moving Ambient Light Glows */}
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-50 z-10" />
      
      {/* Emerald Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1.1, 1],
          x: [0, 50, -30, 0],
          y: [0, -30, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-20%] left-[-15%] w-[80vw] h-[80vw] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"
      />

      {/* Indigo/Violet Glow */}
      <motion.div
        animate={{
          scale: [1.1, 0.9, 1.2, 1.1],
          x: [0, -40, 30, 0],
          y: [0, 40, -30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-20%] right-[-15%] w-[80vw] h-[80vw] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"
      />

      {/* 2. Main Visual Canvas */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-20 items-center">
        
        {/* Left Side: Editorial Platform Presentation (Spotify / Apple Music inspired) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          
          {/* Brand Logo & Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3.5"
          >
            <div className="relative">
              <img
                src="/logo.png"
                alt="SociTune"
                className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-white font-outfit">
                Soci<span className="text-emerald-400">Tune</span>
              </span>
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mt-0.5">
                Music Social Network
              </span>
            </div>
          </motion.div>

          {/* Heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-zinc-100 to-zinc-400"
            >
              The Soundtrack of Your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Social World</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-sm sm:text-base text-zinc-400 font-light max-w-xl leading-relaxed"
            >
              Discover and share what your friends are listening to in real-time. Analyze your acoustic fingerprint, match with musical soulmates, and sync your music vibe curves seamlessly.
            </motion.p>
          </div>

          {/* Grid Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 gap-4 max-w-lg pt-4"
          >
            <div className="flex gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl">
              <div className="text-emerald-400 mt-0.5">
                <Headphones className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Live Activity</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">See what matches are playing right now.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl">
              <div className="text-emerald-400 mt-0.5">
                <Flame className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Vibe Matching</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">Calculate overlaps in tempo and genres.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Elegant Glass Card + Floating Vinyl Graphic */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          
          {/* Floating Vinyl behind/beside the login box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.4 }}
            className="absolute -top-16 -right-16 size-48 rounded-full bg-zinc-950/80 border border-zinc-900 shadow-2xl flex items-center justify-center animate-spin-slow pointer-events-none hidden lg:flex"
          >
            <div className="absolute inset-4 border border-zinc-800/60 rounded-full" />
            <div className="absolute inset-8 border border-zinc-900/80 rounded-full" />
            <div className="absolute inset-12 border border-zinc-800/40 rounded-full" />
            <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center">
              <Music2 className="size-6 text-emerald-400" />
            </div>
            <div className="absolute size-3 bg-zinc-950 rounded-full border border-zinc-800" />
          </motion.div>

          {/* Premium Glassmorphic Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
            className="w-full bg-[#080d0c]/40 border border-white/[0.06] backdrop-blur-3xl rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-emerald-950/10 flex flex-col items-center relative overflow-hidden"
          >
            {/* Top glowing card border shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Join the Soundtrack</h2>
              <p className="text-xs text-zinc-500">Sign in to sync your Spotify profile and start discovery.</p>
            </div>

            {/* Google OAuth Call-to-Action */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!isSignInLoaded}
              className="w-full flex items-center justify-center gap-3.5 bg-white text-black font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl hover:shadow-white/10 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100"
            >
              {/* Google Premium Flat Icon */}
              <svg className="size-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.23-.67-.35-1.37-.35-2.09z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Sparkles visual annotation */}
            <div className="flex items-center gap-1.5 mt-8 text-zinc-500">
              <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] tracking-wide font-medium uppercase">Secured by Clerk & Google</span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
