"use client";

import { Exam, ExamResult } from "@/lib/types";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

type ExplanationState = { text: string; loading: boolean; error?: string };

export default function ResultClient({
  exam,
  result,
}: {
  exam: Exam;
  result: ExamResult;
}) {
  const [explanations, setExplanations] = useState<Record<string, ExplanationState>>({});
  const answers = result.studentAnswers || {};
  const pct = Math.round((result.score / result.totalQuestions) * 100);



  const handleExplain = async (
    qId: string | number,
    questionText: string,
    correctAnswer: string
  ) => {
    const key = String(qId);
    setExplanations((prev) => ({ ...prev, [key]: { text: "", loading: true } }));
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, correctAnswer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load explanation.");
      setExplanations((prev) => ({
        ...prev,
        [key]: { text: data.explanation, loading: false },
      }));
    } catch (err: any) {
      setExplanations((prev) => ({
        ...prev,
        [key]: { text: "", loading: false, error: err.message },
      }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-reveal">
      {/* ── Header ── */}
      <div className="mb-8 overflow-hidden">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
          {exam.examTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Analytics for: <span className="text-indigo-300">{result.studentEmail}</span>
        </p>
      </div>

      {/* ── Score card ── */}
      <div className="card p-10 mb-10 text-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">
          Your Result
        </p>
        <div className="relative inline-block mb-4">
          <p className="text-8xl font-black text-white">
            {pct}<span className="text-3xl text-slate-500">%</span>
          </p>
        </div>
        <p className="text-slate-400 text-lg mb-8 font-medium">
          Result: <span className="text-white font-bold">{result.score}</span> / <span className="text-white font-bold">{result.totalQuestions}</span> Correct
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-primary w-full sm:w-auto px-10 py-3.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* ── Questions ── */}
      <div className="space-y-8">
        {exam.questions.map((q, idx) => {
          const qId = String(q.id);
          const selectedAnswer = answers[qId];
          const explanation = explanations[qId];

          return (
            <div key={qId} className="card overflow-hidden group/q">
              <div className="p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-white mb-6 leading-relaxed flex gap-3">
                      <span className="text-indigo-400 opacity-60">Q{idx + 1}.</span>
                      <MarkdownRenderer content={q.questionText} />
                    </div>

                    {q.imageUrl && (
                      <div className="mb-6 rounded-2xl overflow-hidden border border-white/5 bg-slate-900/50 p-4 transition-all">
                        <img
                          src={q.imageUrl}
                          alt={`Visual aid for Q${idx+1}`}
                          className="max-w-full h-auto max-h-80 object-contain rounded-xl mx-auto"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {q.options.map((opt, oIdx) => {
                        let state = "default";
                        if (opt === q.correctAnswer) state = "correct";
                        else if (opt === selectedAnswer && selectedAnswer !== q.correctAnswer)
                          state = "incorrect";

                        return (
                          <div
                            key={oIdx}
                            className={clsx(
                              "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300",
                              {
                                "border-white/5 bg-slate-900/30 opacity-60":
                                  state === "default",
                                "border-emerald-500/50 bg-emerald-500/10":
                                  state === "correct",
                                "border-rose-500/50 bg-rose-500/10":
                                  state === "incorrect",
                              }
                            )}
                          >
                            <div
                              className={clsx(
                                "flex-1 text-sm font-bold tracking-tight",
                                {
                                  "text-slate-500": state === "default",
                                  "text-emerald-400": state === "correct",
                                  "text-rose-400": state === "incorrect",
                                }
                              )}
                            >
                              <MarkdownRenderer content={opt} />
                            </div>
                            {state === "correct" && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            {state === "incorrect" && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Explain section ── */}
                <div className="mt-10 pt-8 border-t border-white/5">
                  {!explanation?.text && !explanation?.loading && (
                    <button
                      onClick={() =>
                        handleExplain(qId, q.questionText, q.correctAnswer)
                      }
                      className="btn-secondary text-[11px] font-black uppercase tracking-widest text-amber-400 border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Check Explanation
                    </button>
                  )}

                  {explanation?.loading && (
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Loading explanation...
                    </div>
                  )}

                  {explanation?.error && (
                    <div className="text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 p-4 rounded-xl">
                      Could not load explanation. Please try again.
                    </div>
                  )}

                  {explanation?.text && (
                    <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/40" />
                      <div className="flex items-center gap-2 mb-4 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Lightbulb className="w-3 h-3" />
                        Explanation
                      </div>
                      <div className="text-slate-300 text-sm leading-relaxed">
                        <MarkdownRenderer content={explanation.text} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
