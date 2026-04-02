"use client";

import { useEffect, useState } from "react";
import { getResultById, getExamById } from "@/lib/db";
import ResultClient from "./ResultClient";
import { Exam, ExamResult } from "@/lib/types";

export default function ResultWrapper({ resultId }: { resultId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const resData = await getResultById(resultId);
        if (!resData) {
          setErrorMsg("Result could not be found.");
          setLoading(false);
          return;
        }
        setResult(resData);
        
        const exData = await getExamById(resData.examId);
        if (!exData) {
          setErrorMsg("The original exam protocol was deleted. Result diagnostic cannot be rendered.");
          setLoading(false);
          return;
        }
        setExam(exData);
      } catch (err: any) {
        console.error("Result load error:", err);
        setErrorMsg(err.message || "Database connection failed.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono space-y-4">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
        <p>RECONSTRUCTING EXAM MEMORY...</p>
      </div>
    );
  }

  if (errorMsg || !exam || !result) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="bg-[#ef4444]/10 text-[#ef4444] p-6 rounded-lg border-l-4 border-[#ef4444] font-mono shadow-[0_0_15px_rgba(255,51,51,0.2)]">
          <p className="font-black uppercase tracking-widest mb-2">[SYSTEM ERROR THROWN]</p>
          <p className="text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return <ResultClient exam={exam} result={result} />;
}
