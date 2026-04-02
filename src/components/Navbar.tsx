"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LogIn, LogOut, User as UserIcon, GraduationCap, Clock, ClipboardList } from "lucide-react";
import { usePathname } from "next/navigation";
import { useExamHeader } from "./ExamHeaderContext";
import clsx from "clsx";

export default function Navbar() {
  const { user, loading, signIn, signOut } = useAuth();
  const { headerData } = useExamHeader();
  const pathname = usePathname();
  const isExamPage = pathname?.startsWith("/exam/");

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="glass-panel px-6 py-3 mt-4">
        <div className="flex justify-between items-center h-10">
          {/* Default Content: SHOWN OUTSIDE EXAM PAGE or if NO DATA */}
          {(!isExamPage || !headerData) && (
            <>
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 transition-transform duration-300">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white tracking-tight leading-none uppercase">
                    Examina
                  </span>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!loading && (
                  <>
                    {user ? (
                      <div className="flex items-center gap-1">
                        <Link
                          href="/profile"
                          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                          title="Profile"
                        >
                          <UserIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={signOut}
                          className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/20 transition-all flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="hidden sm:inline">Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <button onClick={signIn} className="btn-primary">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Exam Mode: SHOWN ON EXAM PAGE WITH ACTIVE DATA */}
          {isExamPage && headerData && (
            <div className="flex-1 grid grid-cols-3 items-center animate-reveal">
              {/* Exam Branding (Left) */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
                    Exam
                  </p>
                  <p className="text-sm font-bold text-white leading-none truncate max-w-[150px]">
                    {headerData.examTitle}
                  </p>
                </div>
              </div>

              {/* Live Telemetry (Center) */}
              <div className="flex items-center gap-4 sm:gap-6 justify-self-center">
                {/* Timer */}
                <div className={clsx(
                  "flex items-center gap-2.5 px-4 py-1.5 rounded-xl border-2 transition-all duration-700",
                  headerData.timeLeft < 60
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/25 animate-pulse-soft"
                    : "bg-slate-900/40 text-amber-400 border-white/5"
                )}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-base font-black tabular-nums tracking-tighter">
                    {formatTime(headerData.timeLeft)}
                  </span>
                </div>

                {/* Question Units */}
                <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-slate-900/40 border-2 border-white/5 text-slate-300">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-tight">
                    {headerData.totalQuestions - headerData.answeredCount} Remaining
                  </span>
                </div>
              </div>

              {/* Progress Pillar (Right) */}
              <div className="flex items-center justify-end gap-3 justify-self-end">
                <div className="hidden lg:block w-32">
                  <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${(headerData.answeredCount / headerData.totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
