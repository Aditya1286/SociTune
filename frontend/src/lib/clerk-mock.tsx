import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut } from "lucide-react";

export const useAuth = () => {
  const { currentUser, isLoaded, isAuthenticated, logout } = useAuthStore();
  return {
    isSignedIn: isAuthenticated,
    isLoaded,
    userId: currentUser?.clerkId || null,
    signOut: async () => logout(),
    getToken: async () => localStorage.getItem("access_token"),
  };
};

export const useUser = () => {
  const { currentUser, isLoaded, isAuthenticated } = useAuthStore();
  return {
    isSignedIn: isAuthenticated,
    isLoaded,
    user: currentUser
      ? {
          id: currentUser.clerkId,
          fullName: currentUser.fullName,
          firstName: currentUser.fullName ? currentUser.fullName.split(" ")[0] : "",
          lastName: currentUser.fullName ? currentUser.fullName.split(" ").slice(1).join(" ") : "",
          imageUrl: currentUser.imageUrl,
          username: currentUser.username,
          primaryEmailAddress: currentUser.email
            ? { emailAddress: currentUser.email }
            : null,
          setProfileImage: async ({ file }: { file: File }) => {
            console.log("Mock setProfileImage called with file:", file);
          },
        }
      : null,
  };
};

export const useClerk = () => {
  const { logout } = useAuthStore();
  return {
    signOut: async () => logout(),
  };
};

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : null;
};

export const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : null;
};

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const UserButton = () => {
  const { currentUser, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center size-9 rounded-full overflow-hidden border border-white/10 hover:border-white/20 transition-all focus:outline-none"
      >
        {currentUser.imageUrl ? (
          <img src={currentUser.imageUrl} alt={currentUser.fullName} className="size-full object-cover" />
        ) : (
          <div className="size-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-sm font-semibold">
            {currentUser.fullName?.charAt(0) || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-950 border border-white/10 p-2 shadow-2xl z-[999] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-white/5 mb-1.5">
            <p className="text-xs font-semibold text-white truncate">{currentUser.fullName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{currentUser.email || currentUser.username}</p>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-white/5 hover:text-red-300 transition-all text-left"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
