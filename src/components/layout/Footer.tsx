import React from "react";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#0b1329] border-t border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-3 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto flex items-center justify-center text-xs font-light text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          Designed &amp; Developed by
          <span className="font-normal text-slate-600 dark:text-slate-300 inline-flex items-center">
            G
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline-block mx-0.5 animate-pulse" />
            kul
          </span>
        </span>
      </div>
    </footer>
  );
}
