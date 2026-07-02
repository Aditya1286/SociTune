import { SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import NotificationDropdown from "./NotificationDropdown";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { EditProfileDialog } from "./EditProfileDialog";

const Topbar = () => {
  const navigate = useNavigate();
  return (
    <>
      <EditProfileDialog />
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
          {/* Search Trigger */}
          <button
            onClick={() => navigate("/search")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "relative flex items-center justify-between w-full sm:w-64 px-4 py-2 text-sm text-zinc-400 bg-zinc-900/50 border-white/10 hover:bg-zinc-800/80 hover:text-white transition-all rounded-full hidden sm:flex"
            )}
          >
            <span className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4" />
              <span>Search songs...</span>
            </span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
 
          {/* Mobile Search Icon */}
          <button
            onClick={() => navigate("/search")}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "sm:hidden text-zinc-400 hover:text-white"
            )}
          >
            <SearchIcon className="w-5 h-5" />
          </button>


          <SignedOut>
            <Link
              to="/login"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-auto text-white border-zinc-200 h-9 sm:h-10 px-4 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
              )}
            >
              Continue with Google
            </Link>
          </SignedOut>

          <SignedIn>
            <NotificationDropdown />
          </SignedIn>

          {/* Subtle ring around UserButton */}
          <div className="ring-1 ring-white/10 rounded-full transition-shadow duration-200 hover:ring-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/30">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Action 
                  label="Edit Profile" 
                  labelIcon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} 
                  onClick={() => document.dispatchEvent(new CustomEvent("open-edit-profile"))} 
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Topbar;