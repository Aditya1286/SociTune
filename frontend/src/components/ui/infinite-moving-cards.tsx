"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  onDelete,
  isAdmin = false,
}: {
  items: {
    content: string;
    user: { fullName: string; imageUrl: string } | null;
    rating: number;
    _id: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, [items]); // Re-run animation logic if items change
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      // Clean up previous duplicated items if re-rendering
      const scrollerContent = Array.from(scrollerRef.current.children);
      
      // We only duplicate once per render.
      // Aceternity UI duplicates the children to create the infinite scroll effect.
      // To avoid infinitely duplicating on hot reloads or state updates:
      const existingDuplicates = scrollerRef.current.querySelectorAll('.duplicate-item');
      existingDuplicates.forEach(el => el.remove());

      scrollerContent.forEach((item) => {
        // Skip elements that were already duplicated
        if (item.classList.contains('duplicate-item')) return;
        const duplicatedItem = item.cloneNode(true) as HTMLElement;
        duplicatedItem.classList.add('duplicate-item');
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          " flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll ",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item) => (
          <li
            className="group w-[350px] max-w-full relative rounded-2xl border border-white/[0.05] flex-shrink-0 px-8 py-6 md:w-[450px] bg-zinc-900/40 backdrop-blur-md hover:bg-zinc-900/60 transition-colors duration-300 shadow-xl overflow-hidden"
            key={item._id}
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <blockquote className="relative z-20 flex flex-col h-full justify-between gap-6">
              <div className="flex justify-between items-start">
                  <div className="relative">
                    <span className="absolute -top-3 -left-2 text-5xl text-emerald-500/20 font-serif leading-none">"</span>
                    <p className="relative z-10 text-[15px] leading-relaxed text-zinc-300/90 font-light pl-4 pt-1 italic">
                      {item.content}
                    </p>
                  </div>
                  {isAdmin && onDelete && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(item._id)}
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 ml-3 shrink-0 z-50 relative pointer-events-auto rounded-full transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>
              <div className="relative z-20 flex flex-row items-center pt-2 mt-auto border-t border-white/[0.05]">
                <div className="flex items-center gap-3 pt-4">
                  <div className="relative h-10 w-10">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-50 blur-[2px]" />
                    {item.user?.imageUrl ? (
                        <img src={item.user.imageUrl} className="relative z-10 w-full h-full rounded-full object-cover border border-zinc-800" alt={item.user.fullName} />
                    ) : (
                        <div className="relative z-10 w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-semibold border border-zinc-700">
                            {item.user?.fullName?.charAt(0) || "U"}
                        </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-zinc-100 font-medium tracking-wide">
                      {item.user?.fullName || "Anonymous User"}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3.5 h-3.5 ${i < item.rating ? 'text-emerald-400 fill-emerald-400' : 'text-zinc-700 fill-zinc-700'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
