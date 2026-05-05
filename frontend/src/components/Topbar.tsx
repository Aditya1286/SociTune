import { LayoutDashboardIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { SignedOut, UserButton } from "@clerk/clerk-react";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

const Topbar = () => {
  const { isAdmin } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.06]" />

      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

      <div className="relative flex items-center justify-between px-4 sm:px-6 py-3">
        {/* ── Logo ── */}
        <Link
          to="/"
          className="group flex items-center gap-3 select-none"
          aria-label="SociTune Home"
        >
          {/* logo.png with glow + ping dot */}
          <div className="relative transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="SociTune"
              className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(52,211,153,0.35)]"
            />
            {/* Live ping dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-zinc-950">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-white">
              Soci<span className="text-emerald-400">Tune</span>
            </span>
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-zinc-500">
              Music Platform
            </span>
          </div>
        </Link>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "relative overflow-hidden border-zinc-700/80 bg-zinc-900/60 text-zinc-300",
                "hover:text-white hover:border-emerald-500/60 hover:bg-emerald-950/40",
                "transition-all duration-200 gap-1.5 text-xs font-medium tracking-wide",
                "hidden sm:flex"
              )}
            >
              <LayoutDashboardIcon className="size-3.5 shrink-0" />
              <span>Admin</span>
            </Link>
          )}

          {/* Mobile admin icon only */}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "sm:hidden w-8 h-8 border-zinc-700/80 bg-zinc-900/60 text-zinc-300",
                "hover:text-white hover:border-emerald-500/60 hover:bg-emerald-950/40",
                "transition-all duration-200"
              )}
              aria-label="Admin Dashboard"
            >
              <LayoutDashboardIcon className="size-3.5" />
            </Link>
          )}

          <SignedOut>
            <SignInOAuthButtons />
          </SignedOut>

          {/* Subtle ring around UserButton */}
          <div className="ring-1 ring-white/10 rounded-full transition-shadow duration-200 hover:ring-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/30">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;