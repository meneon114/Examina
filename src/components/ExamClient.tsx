"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Exam } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { saveExamResult } from "@/lib/db";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowLeft,
  Loader2,
  Clock,
  ChevronRight,
  Home
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import MarkdownRenderer from "./MarkdownRenderer";
import { useExamHeader } from "./ExamHeaderContext";

type ExplanationState = { text: string; loading: boolean; error?: string };

export default function ExamClient({ exam }: { exam: Exam }) {
  const { user } = useAuth();
  const { setHeaderData } = useExamHeader();
  const router = useRouter();
  const duration = exam.questions.length * 60; // 60s per question
  const storageKeyPrefix = `examina_exam_${exam.id}_${user?.email}`;
  const startTimeKey = `${storageKeyPrefix}_start`;
  const answersKey = `${storageKeyPrefix}_answers`;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [explanations, setExplanations] = useState<Record<string, ExplanationState>>({});
  const [timeLeft, setTimeLeft] = useState(duration);

  // ── Restore State ──
  useEffect(() => {
    if (!user?.email) return;

    // Restore answers
    const savedAnswers = localStorage.getItem(answersKey);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (e) {
        console.error("Failed to parse saved answers", e);
      }
    }

    // Restore timer logic
    let startTimeStr = localStorage.getItem(startTimeKey);
    let startTime: number;

    if (!startTimeStr) {
      startTime = Date.now();
      localStorage.setItem(startTimeKey, startTime.toString());
    } else {
      startTime = parseInt(startTimeStr);
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, duration - elapsed);
    
    setTimeLeft(remaining);
    
    // Check if it's already over
    if (remaining === 0 && !isSubmitted) {
      // Just to ensure we have the most up-to-date answers for immediate submission
      const latestAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};
      handleAutoSubmit(latestAnswers);
    }
  }, [user?.email, exam.id]);

  // ── Sync Answers ──
  useEffect(() => {
    if (Object.keys(answers).length > 0 && !isSubmitted) {
      localStorage.setItem(answersKey, JSON.stringify(answers));
    }
  }, [answers, isSubmitted]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: exam.questions.length,
    estimateSize: () => 350,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    overscan: 5,
  });

  const handleOptionSelect = (qId: string | number, option: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [String(qId)]: option }));
  };

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (isSubmitted) {
      workerRef.current?.terminate();
      workerRef.current = null;
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    // Initialize worker
    const worker = new Worker(new URL("../lib/timerWorker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data === "tick") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            worker.terminate();
            workerRef.current = null;
            if (prev === 1) handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    };

    worker.postMessage("start");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted]);

  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!isSubmitted) {
      setHeaderData({
        timeLeft: timeLeft,
        totalQuestions: exam.questions.length,
        answeredCount: answeredCount,
        examTitle: exam.examTitle,
      });
    } else {
      setHeaderData(null);
    }

    return () => setHeaderData(null);
  }, [timeLeft, answeredCount, isSubmitted, exam, setHeaderData]);

  // Special handler for immediate submission if timer was already up
  const handleAutoSubmit = async (activeAnswers: Record<string, string>) => {
    if (isSubmitted) return;
    let currentScore = 0;
    exam.questions.forEach((q) => {
      if (activeAnswers[String(q.id)] === q.correctAnswer) currentScore += 1;
    });
    setScore(currentScore);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Clear storage
    localStorage.removeItem(startTimeKey);
    localStorage.removeItem(answersKey);

    if (user?.email) {
      try {
        await saveExamResult({
          examId: exam.id,
          examTitle: exam.examTitle,
          studentEmail: user.email,
          score: currentScore,
          totalQuestions: exam.questions.length,
          submittedAt: Date.now(),
          studentAnswers: activeAnswers,
        });
      } catch (err) {
        console.error("Failed to save result", err);
      }
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    let currentScore = 0;
    exam.questions.forEach((q) => {
      if (answers[String(q.id)] === q.correctAnswer) currentScore += 1;
    });
    setScore(currentScore);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clear storage
    localStorage.removeItem(startTimeKey);
    localStorage.removeItem(answersKey);

    if (user?.email) {
      try {
        await saveExamResult({
          examId: exam.id,
          examTitle: exam.examTitle,
          studentEmail: user.email,
          score: currentScore,
          totalQuestions: exam.questions.length,
          submittedAt: Date.now(),
          studentAnswers: answers,
        });
      } catch (err) {
        console.error("Failed to save result", err);
      }
    }
  };

  /** Fetch a plain-language explanation for a question */
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
      setExplanations((prev) => ({ ...prev, [key]: { text: data.explanation, loading: false } }));
    } catch (err: any) {
      setExplanations((prev) => ({
        ...prev,
        [key]: { text: "", loading: false, error: err.message },
      }));
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-[#8b90a8] mb-4">You need to sign in to take this exam.</p>
        <Link href="/" className="text-[#818cf8]">
          Return to Home
        </Link>
      </div>
    );
  }

  const isComplete = answeredCount === exam.questions.length;
  const pct = Math.round((score / exam.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto pb-16 animate-reveal">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">{exam.examTitle}</h1>
        {exam.examDescription && (
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">{exam.examDescription}</p>
        )}
      </div>

      {/* ── Score card (after submit) ── */}
      {isSubmitted && (
        <div className="card p-10 mb-10 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          
          <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">
            Exam Finished!
          </p>
          <div className="relative inline-block mb-4">
            <p className="text-8xl font-black text-white">
              {pct}<span className="text-3xl text-slate-500">%</span>
            </p>
          </div>
          <p className="text-slate-400 text-lg mb-8 font-medium">
            You got <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{exam.questions.length}</span> correct!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="btn-primary w-full sm:w-auto px-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* ── Questions (Virtualized) ── */}
      <div 
        ref={parentRef} 
        style={{ 
          height: `${virtualizer.getTotalSize()}px`, 
          width: '100%', 
          position: 'relative' 
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const q = exam.questions[virtualRow.index];
          const qId = String(q.id);
          const selectedAnswer = answers[qId];
          const explanation = explanations[qId];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                paddingBottom: '24px' // Gap between cards
              }}
            >
              <div className="card overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="text-base sm:text-lg font-bold text-white mb-6 leading-relaxed flex gap-3">
                        <span className="text-indigo-400 opacity-60 shrink-0">Q{virtualRow.index + 1}.</span>
                        <MarkdownRenderer content={q.questionText} />
                      </div>

                      {/* Question image */}
                      {q.imageUrl && (
                        <div className="mb-5 rounded-xl overflow-hidden border border-[#2e3146] bg-[#252838] flex justify-center p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.imageUrl}
                            alt={`Question ${virtualRow.index + 1} image`}
                            className="max-w-full h-auto max-h-72 object-contain rounded-lg"
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-2.5">
                        {q.options.map((opt, oIdx) => {
                          let state = "default";
                          if (isSubmitted) {
                            if (opt === q.correctAnswer) state = "correct";
                            else if (opt === selectedAnswer && selectedAnswer !== q.correctAnswer)
                              state = "incorrect";
                          } else if (opt === selectedAnswer) {
                            state = "selected";
                          }

                          return (
                            <label
                              key={oIdx}
                              className={clsx(
                                "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group/opt",
                                {
                                  "border-white/5 bg-slate-900/30":
                                    state === "default" && !isSubmitted,
                                  "border-white/5 bg-slate-900/10 opacity-60 cursor-not-allowed":
                                    state === "default" && isSubmitted,
                                  "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]":
                                    state === "selected",
                                  "border-emerald-500/50 bg-emerald-500/10":
                                    state === "correct",
                                  "border-rose-500/50 bg-rose-500/10":
                                    state === "incorrect",
                                }
                              )}
                            >
                              <input
                                type="radio"
                                name={qId}
                                value={opt}
                                checked={selectedAnswer === opt}
                                onChange={() => handleOptionSelect(qId, opt)}
                                disabled={isSubmitted}
                                className="w-4 h-4 accent-[#6366f1] flex-shrink-0"
                              />
                              <div
                                className={clsx("flex-1 text-sm font-bold tracking-tight transition-colors", {
                                  "text-slate-400": state === "default",
                                  "text-indigo-300": state === "selected",
                                  "text-emerald-400": state === "correct",
                                  "text-rose-400": state === "incorrect",
                                })}
                              >
                                <MarkdownRenderer content={opt} />
                              </div>
                              {state === "correct" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                              {state === "incorrect" && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ── Explain section ── */}
                  {isSubmitted && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      {!explanation?.text && !explanation?.loading && (
                        <button
                          onClick={() => handleExplain(qId, q.questionText, q.correctAnswer)}
                          className="btn-secondary text-[11px] font-black uppercase tracking-widest text-amber-400 border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          Explanation
                        </button>
                      )}

                      {explanation?.loading && (
                        <div className="flex items-center gap-2.5 text-sm text-[#8b90a8] animate-pulse-soft">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading explanation…
                        </div>
                      )}

                      {explanation?.error && (
                        <p className="text-sm text-[#f87171] bg-[#f87171]/8 border border-[#f87171]/20 p-3 rounded-lg">
                          Something went wrong. Please try again.
                        </p>
                      )}

                      {explanation?.text && (
                        <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden mt-4">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/40" />
                          <div className="flex items-center gap-2 mb-4 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Lightbulb className="w-3 h-3" />
                            Explanation
                          </div>
                          <div className="text-[#c8ccd8] text-sm leading-relaxed pl-1">
                            <MarkdownRenderer content={explanation.text} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            onClick={isSubmitted ? () => router.push("/") : handleSubmit}
            className={clsx(
              "btn-primary w-full sm:w-auto px-12 py-4 text-lg shadow-indigo-500/40 transition-all",
              isSubmitted && "bg-slate-800 hover:bg-slate-700 hover:shadow-none translate-y-0"
            )}
          >
            {isSubmitted ? "Return to Home" : "Finish Exam"}
            {isSubmitted ? <Home className="w-5 h-5 ml-1" /> : <CheckCircle2 className="w-5 h-5 ml-1" />}
          </button>
          {!isComplete && !isSubmitted && (
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse-soft">
              You've skipped {exam.questions.length - answeredCount} questions. You can finish anyway!
            </p>
          )}
        </div>

    </div>
  );
}
