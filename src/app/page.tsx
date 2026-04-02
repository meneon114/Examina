"use client";

import { useAuth } from "@/components/AuthProvider";
import TeacherPortal from "@/components/TeacherPortal";
import StudentPortal from "@/components/StudentPortal";
import { GraduationCap } from "lucide-react";

export default function Home() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 gap-4">
        <div className="w-10 h-10 border-[3px] border-[#6366f1]/30 border-t-[#6366f1] rounded-full animate-spin" />
        <p className="text-[#8b90a8] text-sm">Getting things ready…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-24 px-4 animate-fade-in-up">
        {/* Icon badge */}
        <div className="w-20 h-20 rounded-3xl bg-[#6366f1]/15 flex items-center justify-center mb-8 ring-1 ring-[#6366f1]/30 shadow-xl shadow-indigo-500/10">
          <GraduationCap className="w-10 h-10 text-[#818cf8]" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-[#e2e4f0] tracking-tight mb-3">
          Welcome to{" "}
          <span className="text-[#818cf8]">Examina</span>
        </h1>

        <p className="max-w-md text-[#8b90a8] text-base sm:text-lg leading-relaxed mb-10">
          A simple, stress-free way to take and review your exams.
          Sign in to access your dashboard.
        </p>

        {/* Credit */}
        <p className="text-[#555a72] text-sm">
          Built by{" "}
          <a
            href="https://github.com/meneon114"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8b90a8] transition-colors underline underline-offset-4"
          >
            Md. Rijun Islam Neon
          </a>
        </p>
      </div>
    );
  }

  if (role === "teacher") {
    return <TeacherPortal />;
  }

  return <StudentPortal />;
}
