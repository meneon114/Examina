"use client";

import { useAuth } from "@/components/AuthProvider";
import { User as UserIcon, ShieldAlert, Award, FileText, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getTeacherExams, getStudentResults } from "@/lib/db";

export default function ProfilePage() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [examCount, setExamCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setStatsLoading(false);
      return;
    }

    async function loadStats() {
      try {
        if (role === "teacher") {
          const exams = await getTeacherExams(user!.email!);
          setExamCount(exams.length);
        } else if (role === "student") {
          const results = await getStudentResults(user!.email!);
          setExamCount(results.length);
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setStatsLoading(false);
      }
    }
    
    if (role) {
      loadStats();
    }
  }, [user, role]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono space-y-4">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
        <p>Loading Profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-400 font-mono">
        <p>You must be signed in to view this page.</p>
        <Link href="/" className="text-[#6366f1] mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 flex items-center">
        <Link href="/" className="inline-flex items-center text-slate-400 transition-colors font-bold uppercase text-sm tracking-widest mr-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard
        </Link>
      </div>

      <div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="h-32 bg-slate-900 border-b border-slate-800 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[#6366f1]/5"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#6366f1]/50 to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-12 mb-8 gap-6">
            <div className="w-24 h-24 rounded-full bg-[#0f172a] border-4 border-[#1e293b] flex items-center justify-center relative">
              <UserIcon className="w-12 h-12 text-[#6366f1]" />
            </div>
            
            <div className="text-center sm:text-left flex-1 min-w-0 w-full">
              <h1 className="text-2xl font-black text-slate-100 mb-2 truncate max-w-full">{user.email}</h1>
              <div className="inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[#f59e0b]">
                <ShieldAlert className="w-3 h-3 mr-1.5" /> {role} Account
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-[#6366f1]" />
              </div>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">
                {role === "teacher" ? "Exams Hosted" : "Exams Attempted"}
              </p>
              {statsLoading ? (
                <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin mt-2" />
              ) : (
                <p className="text-3xl font-black text-slate-100">{examCount}</p>
              )}
            </div>
            
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-1">Member Since</p>
              <p className="text-xl font-bold text-slate-300 font-mono">2026</p>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex justify-center sm:justify-start">
            <button
              onClick={signOut}
              className="px-6 py-3 border-2 border-slate-700 text-sm font-bold uppercase tracking-wide rounded text-slate-300 hover:border-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors w-full sm:w-auto text-center"
            >
              Sign Out Securely
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
