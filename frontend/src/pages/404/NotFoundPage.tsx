import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (waveformRef.current) {
      waveformRef.current.innerHTML = "";
      for (let i = 0; i < 28; i++) {
        const bar = document.createElement("div");
        bar.className = "wave-bar";
        const peak = Math.floor(Math.random() * 20 + 4);
        bar.style.cssText = `
          width: 3px; border-radius: 2px; background: #1f2937;
          animation: wave ${0.6 + Math.random() * 0.8}s ${Math.random() * 0.5}s ease-in-out infinite alternate;
          --peak: ${peak}px;
        `;
        waveformRef.current.appendChild(bar);
      }
    }
  }, []);

  return (
    <>
      <style>{`
        @keyframes spin404 { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes wave { from{height:4px} to{height:var(--peak,12px)} }
        @keyframes floatUp {
          0%{transform:translateY(0) translateX(0);opacity:0}
          10%{opacity:0.6} 90%{opacity:0.3}
          100%{transform:translateY(-120px) translateX(var(--drift,0px));opacity:0}
        }
      `}</style>

      <div className="relative h-screen bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden px-4">
        {/* Grid bg */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        {/* Radial glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />

        <div className="relative z-10 text-center max-w-[520px] w-full">
          {/* Vinyl record */}
          <div className="flex justify-center mb-10">
            <div style={{ animation: "spin404 4s linear infinite", width: 140, height: 140 }}>
              <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
                <circle cx="70" cy="70" r="68" fill="#111111" stroke="#1f2937" strokeWidth="1.5"/>
                {[58,50,44,38,32,26].map(r => (
                  <circle key={r} cx="70" cy="70" r={r} fill="none" stroke="#1e1e1e" strokeWidth="1"/>
                ))}
                <circle cx="70" cy="70" r="20" fill="#0d0d0d"/>
                <circle cx="70" cy="70" r="14" fill="#111111" stroke="#10b981" strokeWidth="1.5"/>
                <circle cx="70" cy="70" r="7" fill="#10b981"/>
                <circle cx="70" cy="70" r="3" fill="#0a0a0a"/>
                <path d="M 30 50 Q 70 20 110 50" stroke="#10b981" strokeWidth="1" fill="none" opacity="0.3"/>
              </svg>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-mono tracking-widest uppercase"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "blink 1.2s ease-in-out infinite" }} />
              Page not found
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[96px] font-extrabold text-white leading-none tracking-[-4px] mb-2">
            4<span className="text-emerald-400">0</span>4
          </h1>
          <h2 className="text-xl font-bold text-gray-200 mb-3 tracking-tight">
            Page not found
          </h2>
          <p className="text-sm text-zinc-500 font-mono leading-relaxed mb-10">
  somewhere between the silence and the synths,<br />
  this page disappeared.
</p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => navigate(-1)} variant="outline"
              className="bg-transparent border-[#374151] text-gray-400 hover:border-gray-500 hover:text-gray-200 font-bold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
            <Button onClick={() => navigate("/")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </div>

          {/* Waveform */}
          <div ref={waveformRef} className="flex items-end justify-center gap-[3px] h-7 mt-8" />
        </div>
      </div>
    </>
  );
}