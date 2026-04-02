"use client";

import { useState, useEffect } from "react";
import { Exam, ExamResult } from "@/lib/types";
import { getAllExams, getStudentResults } from "@/lib/db";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { BookOpen, ChevronRight, Award, Calendar, ClipboardList, ArrowRight } from "lucide-react";
import clsx from "clsx";

export default function StudentPortal() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!user?.email) return;
      try {
        const [examsData, resultsData] = await Promise.all([
          getAllExams(),
          getStudentResults(user.email),
        ]);
        setExams(examsData);
        setResults(resultsData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Couldn't load your dashboard. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-[3px] border-[#6366f1]/25 border-t-[#6366f1] rounded-full animate-spin" />
        <p className="text-[#8b90a8] text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="text-center py-16">
        <p className="text-[#f87171] text-sm">{errorMsg}</p>
      </div>
    );
  }

  const completedIds = new Set(results.map(r => r.examId));

  // Sort available exams: unfinished first
  const sortedExams = [...exams].sort((a, b) => {
    const aDone = completedIds.has(a.id);
    const bDone = completedIds.has(b.id);
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });

  return (
    <div className="space-y-16 animate-reveal max-w-full overflow-hidden pb-10">
      {/* ── Available Exams ── */}
      <section>
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Available Exams</h2>
              <p className="text-sm text-slate-400">Ready to start?</p>
            </div>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="py-16 text-center card border-dashed">
            <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No exams are currently active.</p>
          </div>
        ) : (
          <div className="relative group/carousel">
            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x snap-mandatory px-1 scroll-smooth">
              {sortedExams.map((exam, i) => {
                const isDone = completedIds.has(exam.id);
                return (
                  <Link 
                    key={exam.id} 
                    href={`/exam/${exam.id}`}
                    className={clsx(
                      "animate-reveal flex-none w-[300px] sm:w-[350px] snap-start",
                      isDone && "grayscale opacity-60"
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="card p-6 h-full flex flex-col justify-between group cursor-pointer border-indigo-500/10 hover:border-indigo-500/40">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className={clsx(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            isDone ? "bg-slate-800 text-slate-500" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                          )}>
                            {isDone ? "Completed" : "Exam"}
                          </div>
                          <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-900/50 text-slate-400 border border-white/5">
                            {exam.questions.length} Questions
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-2 leading-tight">
                          {exam.examTitle}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                          {exam.examDescription}
                        </p>
                      </div>

                      <div className="mt-6 flex items-center text-sm font-bold text-indigo-400 group-hover:gap-2 transition-all">
                        {isDone ? "Retake" : "Start"}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Scroll gradients */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[#0a0c10] to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#0a0c10] to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
          </div>
        )}
      </section>

      {/* ── My Results ── */}
      <section>
        <div className="flex items-center gap-4 mb-8 px-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Previous Results</h2>
            <p className="text-sm text-slate-400">Review your past performance.</p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="py-16 text-center card border-dashed">
            <Award className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">You haven't completed any exams yet.</p>
          </div>
        ) : (
          <div className="relative group/carousel-results">
            <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x snap-mandatory px-1 scroll-smooth">
              {results.map((res, i) => {
                const p = Math.round((res.score / res.totalQuestions) * 100);
                const statusColor = p >= 80 ? "text-emerald-400" : p >= 50 ? "text-amber-400" : "text-rose-400";
                const bgColor = p >= 80 ? "bg-emerald-400/10" : p >= 50 ? "bg-amber-400/10" : "bg-rose-400/10";
                const borderColor = p >= 80 ? "border-emerald-400/20" : p >= 50 ? "border-amber-400/20" : "border-rose-400/20";

                return (
                  <Link
                    key={res.id}
                    href={`/result/${res.id}`}
                    className="flex-none w-[280px] sm:w-[320px] snap-start animate-reveal"
                    style={{ animationDelay: `${(i + exams.length) * 0.1}s` }}
                  >
                    <div className="card p-6 flex flex-col group cursor-pointer relative border-white/5 hover:border-indigo-500/40">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-white line-clamp-1 pr-4 group-hover:text-indigo-400 transition-colors text-sm">
                          {res.examTitle}
                        </h3>
                        <div className={`px-2 py-1 rounded-md border text-[11px] font-black tracking-widest ${bgColor} ${statusColor} ${borderColor}`}>
                          {p}%
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Score bar */}
                        <div className="w-full bg-slate-900/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                            style={{ width: `${p}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-tight text-slate-500">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            {res.score}/{res.totalQuestions} Correct
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3 h-3" />
                            {new Date(res.submittedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                          Review Detail
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Scroll gradients */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[#0a0c10] to-transparent pointer-events-none opacity-0 group-hover/carousel-results:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#0a0c10] to-transparent pointer-events-none opacity-0 group-hover/carousel-results:opacity-100 transition-opacity" />
          </div>
        )}
      </section>
    </div>
  );
}
