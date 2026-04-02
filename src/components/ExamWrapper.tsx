"use client";

import { useEffect, useState } from "react";
import { getExamById } from "@/lib/db";
import ExamClient from "./ExamClient";
import { Exam } from "@/lib/types";

export default function ExamWrapper({ examId }: { examId: string }) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadExam() {
      try {
        const data = await getExamById(examId);
        if (data) {
          setExam(data);
        } else {
          setErrorMsg("Exam could not be found. It may have been deleted by the instructor.");
        }
      } catch (err: any) {
        console.error("Exam load error:", err);
        setErrorMsg(err.message || "Database connection failed.");
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono space-y-4">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
        <p>INITIALIZING EXAM PROTOCOL...</p>
      </div>
    );
  }

  if (errorMsg || !exam) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="bg-[#ef4444]/10 text-[#ef4444] p-6 rounded-lg border-l-4 border-[#ef4444] font-mono shadow-[0_0_15px_rgba(255,51,51,0.2)]">
          <p className="font-black uppercase tracking-widest mb-2">[SYSTEM ERROR THROWN]</p>
          <p className="text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return <ExamClient exam={exam} />;
}
