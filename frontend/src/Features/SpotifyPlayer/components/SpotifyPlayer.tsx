import React, { useState } from "react";
import { useStore } from "../store/PlayerStore";
import { getStoredToken, redirectToSpotify, clearTokens } from "../services/Auth";
import { SpotifyLogo } from "../atom/Icons";
import {
  HomeView,
  SearchView,
  LibraryView,
  PlaylistView,
  QueueView,
} from "./View";
import type { ViewId } from "../utils/types";
import NowPlayingPanel from "../atom/NowPlayingPanel";
import { Home, Search, Library, Disc, LogOut, LayoutList, Sparkles, Heart, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export { SpotifyCallback } from "./SpotifyCallback";

// ─── Login screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => (
  <div className="relative min-h-[calc(100vh-140px)] w-full overflow-y-auto bg-[#040807] flex flex-col p-6 sm:p-10 select-none no-horizontal-scroll rounded-3xl border border-white/5 shadow-2xl">
    {/* Background Noise and Glow Effects */}
    <div className="absolute inset-0 bg-noise pointer-events-none opacity-40 z-0" />
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

    <div className="relative z-10 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between space-y-12">
      
      {/* 1. Header / Branding */}
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/5">
          <SpotifyLogo size={22} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-emerald-400 tracking-[0.2em] uppercase">SociTune Integration</span>
          <h2 className="text-sm font-black text-white tracking-tight">Spotify Connection</h2>
        </div>
      </div>

      {/* 2. Device Pairing / Dynamic Connection Hub */}
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Pairing Animation */}
        <div className="flex items-center justify-center gap-6 md:gap-8">
          {/* SociTune Badge */}
          <motion.div
            animate={{ 
              y: [0, -6, 0],
              boxShadow: ["0 10px 30px -10px rgba(16,185,129,0.1)", "0 20px 40px -10px rgba(16,185,129,0.25)", "0 10px 30px -10px rgba(16,185,129,0.1)"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative size-20 md:size-24 rounded-[24px] bg-zinc-950 border border-white/10 flex items-center justify-center"
          >
            <img src="/logo.png" alt="SociTune" className="size-11 md:size-14 object-contain" />
            <div className="absolute inset-0 rounded-[24px] bg-emerald-500/5 blur-xl pointer-events-none" />
          </motion.div>

          {/* Connection Pulse Wave */}
          <div className="flex items-center gap-1 px-4 sm:px-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [12, 36, 12],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
                className="w-1 rounded-full bg-emerald-400/60"
              />
            ))}
          </div>

          {/* Spotify Badge */}
          <motion.div
            animate={{ 
              y: [-6, 0, -6],
              boxShadow: ["0 20px 40px -10px rgba(29,185,84,0.25)", "0 10px 30px -10px rgba(29,185,84,0.1)", "0 20px 40px -10px rgba(29,185,84,0.25)"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative size-20 md:size-24 rounded-[24px] bg-[#121212] border border-white/10 flex items-center justify-center"
          >
            <div className="text-[#1db954]">
              <SpotifyLogo size={36} />
            </div>
            <div className="absolute inset-0 rounded-[24px] bg-[#1db954]/5 blur-xl pointer-events-none" />
          </motion.div>
        </div>

        {/* Hero Copy */}
        <div className="space-y-4 max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Import Your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Audio DNA</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
            Connect your Spotify account to analyze your acoustic fingerprint. We'll map your vibe curves and match you with musical soulmates. No dry algorithms, just pure sonic alignment.
          </p>
        </div>

        {/* Auth CTA */}
        <div className="w-full max-w-md pt-2">
          <button
            onClick={redirectToSpotify}
            className="w-full bg-[#1db954] hover:bg-[#1ed760] text-black font-black text-xs py-4 px-6 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(29,185,84,0.2)] hover:shadow-[0_0_35px_rgba(29,185,84,0.35)] transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <SpotifyLogo size={18} />
            <span>AUTHORIZE & SYNC MUSIC</span>
          </button>
        </div>
      </div>

      {/* 3. Taste Import Protocol Horizontal Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">The Taste Import Protocol</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-[#080d0c]/40 border border-white/[0.04] backdrop-blur-md p-5 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group">
            <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">Acoustic Fingerprinting</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              We read your actual Spotify history. Don't worry, we'll keep your 10,000 plays of the same guilty pleasure track between us.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#080d0c]/40 border border-white/[0.04] backdrop-blur-md p-5 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group">
            <div className="size-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-105 transition-transform">
              <Heart className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">Soulmate Matching</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Our backend calculates overlaps in genre density, tempo sync, and mood quadrants to identify your musical twins.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#080d0c]/40 border border-white/[0.04] backdrop-blur-md p-5 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group">
            <div className="size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="size-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">Real-Time Syncing</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Listen in perfect unison with your matches. (Requires Spotify Premium, or Spotify's SDK restricts playback—blame them, not us!)
            </p>
          </div>
        </div>
      </div>

      {/* 4. Humorous Disclaimer Banner */}
      <div className="flex gap-3 bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl max-w-2xl mx-auto w-full items-center">
        <AlertCircle className="size-4.5 text-amber-400/80 shrink-0" />
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          <strong className="text-zinc-300">Disclaimer for your ears:</strong> Syncing may expose your secret love for 90s pop ballads. We don't judge, but your matched soulmates might.
        </p>
      </div>

    </div>
  </div>
);

// ─── Main player ──────────────────────────────────────────────────────────────

const SpotifyPlayer: React.FC = () => {
  const store = useStore();
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(true);

  const switchView = (v: ViewId) => {
    store.setView(v);
  };

  const handleLogout = () => {
    clearTokens();
    window.location.href = "/player";
  };

  const navItems: { id: ViewId; label: string; icon: any }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Library", icon: Library },
    { id: "queue", label: "Queue", icon: LayoutList },
  ];

  const views: Record<ViewId, React.ReactNode> = {
    home: <HomeView />,
    search: <SearchView />,
    library: <LibraryView />,
    playlist: <PlaylistView />,
    queue: <QueueView />,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full overflow-hidden bg-black/40 rounded-3xl border border-white/5 shadow-2xl relative">
      {/* Ambient background blur */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Top Header tab bar */}
      <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-zinc-950/20 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="text-emerald-400 relative">
              <SpotifyLogo size={20} />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <span className="text-sm font-extrabold text-white tracking-tight uppercase">
              Spotify Sync
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5">
            {navItems.map((item) => {
              const active = store.view === item.id || (item.id === "library" && store.view === "playlist");
              return (
                <button
                  key={item.id}
                  onClick={() => switchView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                    active
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <item.icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls & User Info */}
        <div className="flex items-center gap-4">
          {store.user && (
            <div className="hidden md:flex items-center gap-2.5 bg-white/[0.02] border border-white/5 pl-2.5 pr-3.5 py-1 rounded-full text-xs font-medium text-zinc-300">
              {store.user.images?.[0]?.url ? (
                <img
                  src={store.user.images[0].url}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">
                  {store.user.display_name?.charAt(0) || "U"}
                </div>
              )}
              <span>{store.user.display_name}</span>
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={() => setIsNowPlayingOpen(!isNowPlayingOpen)}
            title="Toggle details panel"
            className={`p-2 rounded-xl border border-white/5 transition-all duration-300 ${
              isNowPlayingOpen
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-white"
            }`}
          >
            <Disc className="size-4 animate-spin-slow" />
          </button>

          <button
            onClick={handleLogout}
            title="Logout from Spotify"
            className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Main body content area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Track views */}
        <main className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {views[store.view]}
        </main>

        {/* Right side Now Playing panel */}
        {isNowPlayingOpen && (
          <aside className="w-68 border-l border-white/5 flex-shrink-0 bg-zinc-950/10 backdrop-blur-md overflow-y-auto">
            <NowPlayingPanel />
          </aside>
        )}
      </div>
    </div>
  );
};

// ─── Auth gate ────────────────────────────────────────────────────────────────

const SpotifyPlayerPage: React.FC = () => {
  const isAuthenticated = !!getStoredToken();
  return isAuthenticated ? <SpotifyPlayer /> : <LoginScreen />;
};

export default SpotifyPlayerPage;
