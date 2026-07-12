import { SearchIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@/lib/clerk-mock";
import NotificationDropdown from "./NotificationDropdown";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { EditProfileDialog } from "./EditProfileDialog";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

const Topbar = () => {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { currentUser } = useAuthStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const avatarUrl = currentUser?.imageUrl || user?.imageUrl;
  const displayName = currentUser?.displayName || currentUser?.fullName || user?.fullName || "User";
  const emailAddress = user?.primaryEmailAddress?.emailAddress || "";

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
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <NotificationDropdown />
            
            {/* Custom User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative size-8 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-emerald-500/50 hover:shadow-md hover:shadow-emerald-900/30 transition-all duration-200 cursor-pointer flex items-center justify-center bg-zinc-900"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-450 bg-zinc-900 text-[10px] font-bold">
                    {displayName ? displayName.substring(0, 2).toUpperCase() : "U"}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-950/95 border border-white/[0.08] backdrop-blur-md rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2 border-b border-white/[0.04] space-y-0.5 select-text">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{displayName}</p>
                    {emailAddress && <p className="text-[9px] text-zinc-500 truncate">{emailAddress}</p>}
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      document.dispatchEvent(new CustomEvent("open-edit-profile"));
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.04] transition-colors flex items-center gap-2 border-t border-white/[0.04] cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2050/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
    </>
  );
};

export default Topbar;