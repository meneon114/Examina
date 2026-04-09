"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Exam, Question, ExamResult } from "@/lib/types";
import { saveExam, getTeacherExams, deleteExam, updateExam, getAllResults, deleteResult } from "@/lib/db";
import { FileUp, Save, X, PlusCircle, Trash2, Edit, Activity, User, Award, Calendar, Image as ImageIcon, BookOpen, ChevronRight, ClipboardList } from "lucide-react";

const getEmptyExam = (email: string): Omit<Exam, "id"> => ({
  examTitle: "",
  examDescription: "",
  duration: 60, // Default 1 hour
  questions: [],
  creatorEmail: email,
  createdAt: Date.now()
});

const getEmptyQuestion = (): Question => ({
  id: Date.now().toString(),
  questionText: "",
  imageUrl: "",
  options: ["", "", "", ""],
  correctAnswer: ""
});

export default function TeacherPortal() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // The master state for the exam currently being edited
  const [examData, setExamData] = useState<Omit<Exam, "id"> | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (user?.email) {
      loadData(user.email);
    }
  }, [user]);

  // Sync ExamData -> JSON Input
  useEffect(() => {
    if (examData && isCreating) {
      setJsonInput(JSON.stringify(examData, null, 2));
      setJsonError("");
    }
  }, [examData, isCreating]);

  async function loadData(email: string) {
    try {
      setLoadingExams(true);
      setGlobalError("");
      const [examsData, resultsData] = await Promise.all([
        getTeacherExams(email),
        getAllResults()
      ]);
      setExams(examsData);
      setResults(resultsData);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message);
    } finally {
      setLoadingExams(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      try {
        await deleteExam(id);
        await loadData(user!.email!);
      } catch (err: any) {
        setGlobalError("Failed to delete exam: " + err.message);
      }
    }
  };

  const handleDeleteResult = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click navigation
    if (confirm("Are you sure you want to delete this student's result record?")) {
      try {
        await deleteResult(id);
        await loadData(user!.email!);
      } catch (err: any) {
        setGlobalError("Failed to delete result: " + err.message);
      }
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id);
    const cleanJson = {
      examTitle: exam.examTitle,
      examDescription: exam.examDescription,
      duration: exam.duration || 60,
      questions: exam.questions || [],
      creatorEmail: exam.creatorEmail,
      createdAt: exam.createdAt
    };
    setExamData(cleanJson);
    setIsCreating(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setExamData(getEmptyExam(user!.email!));
    setIsCreating(true);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonInput(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed.examTitle !== undefined && parsed.questions !== undefined) {
        setExamData(parsed);
        setJsonError("");
      } else {
        setJsonError("Missing required structure (examTitle, questions)");
      }
    } catch (err) {
      setJsonError("Invalid JSON Syntax");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJsonError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      setJsonError("Please upload a valid JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.questions) parsed.questions = [];
        if (!parsed.creatorEmail) parsed.creatorEmail = user!.email!;
        if (!parsed.createdAt) parsed.createdAt = Date.now();
        if (!parsed.duration) parsed.duration = 60;
        setExamData(parsed);
      } catch (err) {
        setJsonError("Invalid JSON format in file.");
      }
    };
    reader.readAsText(file);
  };

  // GUI Builders Handlers
  const handleExamFieldChange = (field: keyof Exam, value: any) => {
    if (!examData) return;
    setExamData({ ...examData, [field]: value });
  };

  const handleAddQuestion = () => {
    if (!examData) return;
    setExamData({ 
      ...examData, 
      questions: [...examData.questions, getEmptyQuestion()] 
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    if (!examData) return;
    const newQ = [...examData.questions];
    newQ.splice(idx, 1);
    setExamData({ ...examData, questions: newQ });
  };

  const handleQuestionChange = (idx: number, field: keyof Question, value: any) => {
    if (!examData) return;
    const newQ = [...examData.questions];
    newQ[idx] = { ...newQ[idx], [field]: value };
    setExamData({ ...examData, questions: newQ });
  };

  const handleOptionChange = (qIdx: number, oIdx: number, value: string) => {
    if (!examData) return;
    const newQ = [...examData.questions];
    const newOpts = [...newQ[qIdx].options];
    newOpts[oIdx] = value;
    newQ[qIdx].options = newOpts;
    setExamData({ ...examData, questions: newQ });
  };

  const handleSaveExam = async () => {
    if (!examData) return;
    if (!examData.examTitle) return alert("Exam title is required.");
    
    // Validate
    for (let i = 0; i < examData.questions.length; i++) {
      const q = examData.questions[i];
      if (!q.questionText || !q.correctAnswer || q.options.some(o => !o)) {
        return alert(`Question ${i + 1} is incomplete. Ensure question text, all 4 options, and a correct answer are selected.`);
      }
      if (!q.options.includes(q.correctAnswer)) {
        return alert(`Question ${i + 1} has a correct answer that doesn't match any of its exactly typed options.`);
      }
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateExam(editingId, examData);
      } else {
        await saveExam(examData);
      }
      setExamData(null);
      setIsCreating(false);
      setEditingId(null);
      await loadData(user!.email!);
    } catch (err) {
      alert("Failed to save the exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setExamData(null);
    setJsonError("");
    setEditingId(null);
    setJsonInput("");
  };

  return (
    <div className="space-y-12 pb-12 animate-reveal">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-xl shadow-indigo-500/5 transition-all">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Teacher Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-400">Manage assessments and track student progress.</p>
          </div>
        </div>
        {!isCreating && (
          <button
            onClick={handleCreateNew}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Create Exam
          </button>
        )}
      </div>

      {isCreating && examData && (
        <div className="bg-[#1e293b]/50 border border-white/5 backdrop-blur-xl shadow-2xl rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {editingId ? "Edit Assessment" : "Build New Assessment"}
              </h3>
              <p className="text-sm text-slate-400 mt-1">Design your questions and publish them to students.</p>
            </div>
            <button 
              onClick={resetForm} 
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all font-bold text-sm"
            >
              <X className="w-4 h-4" /> Discard Changes
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            
            {/* VISUAL BUILDER (LEFT) */}
            <div className="space-y-8 max-h-[800px] overflow-y-auto pr-4 scrollbar-hide">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">Exam Identity</label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Title</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-900/50 text-white border border-white/5 rounded-xl p-4 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                          value={examData.examTitle}
                          onChange={(e) => handleExamFieldChange("examTitle", e.target.value)}
                          placeholder="e.g. Advanced Quantum Mechanics"
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Duration (Min)</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-900/50 text-white border border-white/5 rounded-xl p-4 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                          value={examData.duration || ""}
                          onChange={(e) => handleExamFieldChange("duration", parseInt(e.target.value) || 0)}
                          placeholder="Minutes"
                          min="1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        className="w-full bg-slate-900/50 text-white border border-white/5 rounded-xl p-4 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all h-32 placeholder:text-slate-600 font-medium resize-none"
                        value={examData.examDescription}
                        onChange={(e) => handleExamFieldChange("examDescription", e.target.value)}
                        placeholder="Provide brief instructions or context for the assessment..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h4 className="font-bold text-white tracking-tight">Question Pool ({examData.questions.length})</h4>
                  <button 
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-indigo-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Unit
                  </button>
                </div>

                {examData.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 relative group/q transition-all hover:border-indigo-500/20">
                    <button 
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-6 right-6 text-slate-600 hover:text-rose-500 transition-colors"
                      title="Remove Question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-black">
                        #{qIdx + 1}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Assessment Unit</span>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <input 
                          type="text" 
                          className="w-full bg-slate-900/50 text-white border border-white/5 rounded-xl p-4 focus:border-indigo-500/50 focus:outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIdx, "questionText", e.target.value)}
                          placeholder="Compose your question here..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center border border-white/5">
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 bg-slate-900/50 text-white border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500/50 focus:outline-none transition-all placeholder:text-slate-600"
                          value={q.imageUrl || ""}
                          onChange={(e) => handleQuestionChange(qIdx, "imageUrl", e.target.value)}
                          placeholder="Optional: Image URL (Reference material)"
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Options</p>
                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3">
                              <button
                                onClick={() => handleQuestionChange(qIdx, "correctAnswer", opt)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all font-black text-xs ${opt !== "" && q.correctAnswer === opt ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/80 border-white/5 text-slate-600 hover:border-white/10'}`}
                              >
                                {["A", "B", "C", "D"][oIdx]}
                              </button>
                              <input 
                                type="text" 
                                className={`flex-1 bg-slate-900/50 text-white border rounded-xl p-4 text-sm font-medium focus:outline-none transition-all placeholder:text-slate-600 ${q.correctAnswer === opt && opt !== "" ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/5 focus:border-white/10'}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${["A", "B", "C", "D"][oIdx]}...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {examData.questions.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-lg text-slate-500 uppercase tracking-widest text-sm font-bold">
                    No Questions Added.
                  </div>
                )}
              </div>
            </div>

            {/* JSON EDITOR (RIGHT) */}
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Source Code</label>
                <label className="flex items-center px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white rounded-xl cursor-pointer transition-all text-[10px] font-bold text-indigo-400">
                  <FileUp className="w-3.5 h-3.5 mr-1.5" />
                  Import JSON
                  <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <textarea 
                className="w-full flex-1 min-h-[500px] p-6 border border-white/5 bg-slate-950 text-indigo-400 rounded-2xl text-xs font-mono focus:ring-1 focus:ring-indigo-500/20 focus:outline-none placeholder-slate-800 scrollbar-hide leading-relaxed" 
                value={jsonInput} 
                onChange={handleJsonChange}
                spellCheck={false}
              />
              
              {jsonError ? (
                <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2">
                  <X className="w-3 h-3" /> {jsonError}
                </div>
              ) : (
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1 opacity-60">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sync Active
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <button
              onClick={handleSaveExam}
              disabled={loading || !!jsonError}
              className="flex items-center gap-3 px-12 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale"
            >
              <Save className="w-5 h-5" />
              {loading ? "Publishing…" : (editingId ? "Update Assessment" : "Publish Assessment")}
            </button>
          </div>
        </div>
      )}

      {globalError && (
        <div className="bg-[#ef4444] text-white p-4 rounded-md mb-6 font-mono font-bold uppercase">
          <p className="tracking-wider text-xl mb-1">System Error</p>
          <p className="text-sm">{globalError}</p>
        </div>
      )}

      {loadingExams ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-mono space-y-4">
          <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin"></div>
          <p>Loading Data...</p>
        </div>
      ) : (
        <>
          {/* MANAGE EXAMS SECTION */}
          <section>
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Your Exams</h2>
                  <p className="text-sm text-slate-400">Content you've published.</p>
                </div>
              </div>
            </div>

            {exams.length === 0 ? (
              <div className="py-16 text-center card border-dashed">
                <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">You haven't created any exams yet.</p>
              </div>
            ) : (
              <div className="relative group/carousel">
                <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x snap-mandatory px-1 scroll-smooth">
                  {exams.map((exam, i) => (
                    <div 
                      key={exam.id} 
                      className="animate-reveal flex-none w-[300px] sm:w-[350px] snap-start"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="card p-6 h-full flex flex-col justify-between group border-indigo-500/10">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                              Active
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEdit(exam)}
                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                                title="Edit Exam"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(exam.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                            {exam.examTitle}
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">
                            {exam.examDescription}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex gap-2">
                            <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-900/50 text-slate-400 border border-white/5">
                              {exam.questions.length} Qs
                            </span>
                            {exam.duration && (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                                {exam.duration} Min
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(exam.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* STUDENT ACTIVITY FEED */}
          <section>
            <div className="flex items-center gap-4 mb-8 px-1">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-xl shadow-violet-500/5">
                <Award className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Student Submissions</h2>
                <p className="text-sm text-slate-400">Recent performance across all exams.</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="py-16 text-center card border-dashed">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No students have submitted results yet.</p>
              </div>
            ) : (
              <div className="relative group/carousel-results">
                <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x snap-mandatory px-1 scroll-smooth">
                  {results.map((res, i) => {
                    const p = Math.round((res.score / res.totalQuestions) * 100);
                    const statusColor = p >= 80 ? "text-violet-400" : p >= 50 ? "text-amber-400" : "text-rose-400";
                    const bgColor = p >= 80 ? "bg-violet-400/10" : p >= 50 ? "bg-amber-400/10" : "bg-rose-400/10";
                    const borderColor = p >= 80 ? "border-violet-400/20" : p >= 50 ? "border-amber-400/20" : "border-rose-400/20";

                    return (
                      <div
                        key={res.id}
                        className="flex-none w-[280px] sm:w-[320px] snap-start animate-reveal"
                        style={{ animationDelay: `${(i + exams.length) * 0.1}s` }}
                      >
                        <div className="card p-6 flex flex-col group relative border-white/5">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1 pr-2">
                              <h3 className="font-bold text-white text-xs line-clamp-1">
                                {res.studentEmail}
                              </h3>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                                {res.examTitle}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-md border text-[11px] font-black tracking-widest ${bgColor} ${statusColor} ${borderColor}`}>
                              {p}%
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="w-full bg-slate-900/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${p >= 80 ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]" : p >= 50 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"}`}
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

                            <div className="pt-2 flex justify-between items-center">
                              <button 
                                onClick={() => window.location.href = `/result/${res.id}`}
                                className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                View Detailed
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              <button 
                                 onClick={(e) => handleDeleteResult(res.id as string, e)}
                                 className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                                 title="Delete Record"
                              >
                                 <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
