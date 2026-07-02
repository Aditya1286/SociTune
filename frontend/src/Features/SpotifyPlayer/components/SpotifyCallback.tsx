import React, { useEffect } from "react";
import { exchangeCode } from "../services/Auth";

export const SpotifyCallback: React.FC = () => {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    exchangeCode(code).then((ok) => {
      window.location.href = ok ? "/player" : "/?error=auth_failed";
    });
  }, []);

  return (
    <div className="w-full h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 text-center font-sans select-none">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">
        Connecting with Spotify…
      </p>
    </div>
  );
};
export default SpotifyCallback;