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
        {items.map((item, idx) => (
          <li
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-zinc-800 px-8 py-6 md:w-[450px] bg-zinc-900/50 backdrop-blur-sm"
            key={item._id}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <div className="flex justify-between items-start mb-4">
                  <span className="relative z-20 text-sm leading-[1.6] text-zinc-300 font-normal italic">
                    "{item.content}"
                  </span>
                  {isAdmin && onDelete && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onDelete(item._id)}
                        className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 ml-2 shrink-0 z-50 relative pointer-events-auto"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </div>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <div className="flex items-center gap-3">
                  {item.user?.imageUrl ? (
                      <img src={item.user.imageUrl} className="w-10 h-10 rounded-full object-cover" alt={item.user.fullName} />
                  ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold">
                          {item.user?.fullName?.charAt(0) || "U"}
                      </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm leading-[1.6] text-white font-medium">
                      {item.user?.fullName || "Anonymous User"}
                    </span>
                    <span className="text-xs leading-[1.6] text-emerald-500 font-normal">
                      {"★".repeat(item.rating)}{"☆".repeat(5-item.rating)}
                    </span>
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
