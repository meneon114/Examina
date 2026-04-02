"use client";

import { useState, useEffect } from "react";
import { Exam, ExamResult } from "@/lib/types";
import { getAllExams, getStudentResults } from "@/lib/db";
import { useAuth } from "./AuthProvider";
import Link from "next/link";
import { BookOpen, ChevronRight, Award, Calendar, ClipboardList } from "lucide-react";

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

  return (
    <div className="space-y-16 animate-reveal">
      {/* ── Available Exams ── */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Exams</h2>
            <p className="text-sm text-slate-400">Ready to start?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {exams.length === 0 ? (
            <div className="col-span-full py-16 text-center card border-dashed">
              <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No exams are currently active.</p>
            </div>
          ) : (
            exams.map((exam, i) => (
              <Link 
                key={exam.id} 
                href={`/exam/${exam.id}`}
                className="animate-reveal"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="card p-6 h-full flex flex-col justify-between group cursor-pointer">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Exam
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
                    Start
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ── My Results ── */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Results</h2>
            <p className="text-sm text-slate-400">Your scores.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {results.length === 0 ? (
            <div className="col-span-full py-16 text-center card border-dashed">
              <Award className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">You haven't completed any exams yet.</p>
            </div>
          ) : (
            results.map((res, i) => {
              const p = Math.round((res.score / res.totalQuestions) * 100);
              const statusColor = p >= 80 ? "text-emerald-400" : p >= 50 ? "text-amber-400" : "text-rose-400";
              const bgColor = p >= 80 ? "bg-emerald-400/10" : p >= 50 ? "bg-amber-400/10" : "bg-rose-400/10";
              const borderColor = p >= 80 ? "border-emerald-400/20" : p >= 50 ? "border-amber-400/20" : "border-rose-400/20";

              return (
                <Link
                  key={res.id}
                  href={`/result/${res.id}`}
                  className="animate-reveal"
                  style={{ animationDelay: `${(i + exams.length) * 0.1}s` }}
                >
                  <div className="card p-6 flex flex-col group cursor-pointer relative">
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
                        <span className="flex items-center gap-1.5">
                          {res.score} / {res.totalQuestions} Correct
                        </span>
                        <span>
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
            })
          )}
        </div>
      </section>
    </div>
  );
}
