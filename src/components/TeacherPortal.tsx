"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Exam, Question, ExamResult } from "@/lib/types";
import { saveExam, getTeacherExams, deleteExam, updateExam, getAllResults, deleteResult } from "@/lib/db";
import { FileUp, Save, X, PlusCircle, Trash2, Edit, Activity, User, Award, Calendar, Image as ImageIcon } from "lucide-react";

const getEmptyExam = (email: string): Omit<Exam, "id"> => ({
  examTitle: "",
  examDescription: "",
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
      <div className="flex justify-between items-center pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
            Teacher Dashboard
          </h2>
          <p className="text-sm text-slate-500 font-medium">Manage your exams and see how your students are doing.</p>
        </div>
        {!isCreating && (
          <button
            onClick={handleCreateNew}
            className="btn-primary"
          >
            <PlusCircle className="w-5 h-5" />
            New Assessment
          </button>
        )}
      </div>

      {isCreating && examData && (
        <div className="bg-[#1e293b] border border-[#6366f1]/50 shadow-[0_0_20px_rgba(99,102,241,0.1)] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-2xl font-bold text-[#6366f1] uppercase tracking-wider">
              {editingId ? "Edit Exam" : "Build New Exam"}
            </h3>
            <button onClick={resetForm} className="text-[#ef4444] hover:text-white bg-[#ef4444]/10 hover:bg-[#ef4444] p-1.5 rounded transition font-bold uppercase text-sm tracking-wide flex items-center">
              <X className="w-4 h-4 mr-1" /> Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            
            {/* VISUAL BUILDER (LEFT) */}
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
              <div className="bg-slate-900 p-5 rounded-lg border border-slate-800">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#6366f1] mb-2 uppercase tracking-wide">Exam Title</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#0f172a] text-white border border-slate-700 rounded p-2 focus:border-[#6366f1] focus:outline-none transition-colors"
                      value={examData.examTitle}
                      onChange={(e) => handleExamFieldChange("examTitle", e.target.value)}
                      placeholder="e.g. Midterm Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#6366f1] mb-2 uppercase tracking-wide">Description</label>
                    <textarea 
                      className="w-full bg-[#0f172a] text-white border border-slate-700 rounded p-2 focus:border-[#6366f1] focus:outline-none transition-colors h-24"
                      value={examData.examDescription}
                      onChange={(e) => handleExamFieldChange("examDescription", e.target.value)}
                      placeholder="Brief instructions for the students..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-lg uppercase tracking-wide">Questions ({examData.questions.length})</h4>
                  <button 
                    onClick={handleAddQuestion}
                    className="flex items-center px-4 py-2 bg-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1] hover:text-white rounded text-sm font-bold uppercase transition-all"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add MCQ
                  </button>
                </div>

                {examData.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-slate-900 p-5 rounded-lg border border-slate-700 relative group">
                    <button 
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-[#ef4444] transition"
                      title="Remove Question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <h5 className="text-[#f59e0b] font-bold mb-4">Question {qIdx + 1}</h5>
                    
                    <div className="space-y-4">
                      <div>
                        <input 
                          type="text" 
                          className="w-full bg-[#0f172a] text-white border border-slate-700 rounded p-2 focus:border-[#6366f1] focus:outline-none"
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIdx, "questionText", e.target.value)}
                          placeholder="What is the capital of..."
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <input 
                          type="text" 
                          className="flex-1 bg-[#0f172a] text-white border border-slate-700 rounded p-2 text-sm focus:border-[#6366f1] focus:outline-none"
                          value={q.imageUrl || ""}
                          onChange={(e) => handleQuestionChange(qIdx, "imageUrl", e.target.value)}
                          placeholder="Optional: Image URL (e.g. https://example.com/image.png)"
                        />
                      </div>

                      <div className="pt-2">
                        <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Options (Select the correct one)</p>
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center space-x-3">
                              <input 
                                type="radio" 
                                name={`correct-${q.id}`}
                                className="w-5 h-5 text-[#6366f1] focus:ring-[#6366f1] bg-slate-900 border-slate-600 cursor-pointer"
                                checked={opt !== "" && q.correctAnswer === opt}
                                onChange={() => handleQuestionChange(qIdx, "correctAnswer", opt)}
                                title="Mark as correct answer"
                              />
                              <input 
                                type="text" 
                                className={`flex-1 bg-[#0f172a] text-white border rounded p-2 text-sm focus:outline-none transition-colors ${q.correctAnswer === opt && opt !== "" ? 'border-[#6366f1] ring-1 ring-[#6366f1]' : 'border-slate-700 focus:border-slate-500'}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${["A", "B", "C", "D"][oIdx]}`}
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
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded border border-slate-800">
                <label className="text-sm font-bold text-[#f59e0b] uppercase tracking-wide">JSON Code Editor</label>
                <label className="flex items-center px-3 py-1.5 bg-[#0f172a] border border-slate-700 hover:border-[#6366f1]/50 hover:text-[#6366f1] rounded cursor-pointer transition text-xs font-bold text-slate-400">
                  <FileUp className="w-3.5 h-3.5 mr-1.5" />
                  Upload .json
                  <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <textarea 
                className="w-full flex-1 min-h-[500px] p-4 border border-slate-700 bg-[#0f172a] text-[#6366f1] rounded-md text-sm font-mono focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1] focus:outline-none placeholder-slate-800 custom-scrollbar leading-relaxed" 
                value={jsonInput} 
                onChange={handleJsonChange}
                spellCheck={false}
              />
              
              {jsonError ? (
                <p className="text-sm text-white bg-[#ef4444] p-3 rounded font-mono font-bold uppercase tracking-wider">{jsonError}</p>
              ) : (
                <p className="text-xs text-[#6366f1] font-mono select-none opacity-50">✓ JSON is valid and synced automatically.</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end bg-[#0f172a] p-4 rounded-lg border border-slate-800">
            <button
              onClick={handleSaveExam}
              disabled={loading || !!jsonError}
              className="flex items-center px-10 py-3 bg-[#6366f1] text-white font-black rounded hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] focus:outline-none transition uppercase tracking-widest disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-3" />
              {loading ? "Saving..." : (editingId ? "Save Changes" : "Publish Exam")}
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
          <section className="mb-20">
            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] mb-8 pb-3 border-b border-white/5 inline-block">Your Created Exams ({exams.length})</h3>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {exams.length === 0 ? (
                <p className="text-slate-500 col-span-full italic">You have not created any exams yet.</p>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="card p-8 h-full flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-transform group:scale-110">
                          Curriculum
                        </div>
                        <div className="flex space-x-1 transition-opacity">
                          <button 
                            onClick={() => handleEdit(exam)}
                            className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 leading-snug transition-colors uppercase tracking-tight">{exam.examTitle}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 italic">"{exam.examDescription}"</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {exam.questions.length} Question Units
                      </div>
                      <button 
                        onClick={() => handleDelete(exam.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* STUDENT ACTIVITY FEED */}
          <section>
            <div className="pb-8 border-b border-white/5 mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase">
                Student Activity
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-medium tracking-wide">Monitor recent exam submissions and scores from your students.</p>
            </div>

            <div className="glass-panel border-white/5 overflow-hidden shadow-2xl">
              {results.length === 0 ? (
                <div className="p-12 text-center text-slate-600 font-mono text-sm uppercase font-bold">
                  <Activity className="w-10 h-10 mx-auto mb-4 opacity-50" />
                  <p>No student results submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-900/50 border-b border-white/5 tracking-[0.2em] font-black">
                      <tr>
                        <th scope="col" className="px-8 py-5">Student Identity</th>
                        <th scope="col" className="px-8 py-5">Assessment Unit</th>
                        <th scope="col" className="px-8 py-5">Performance</th>
                        <th scope="col" className="px-8 py-5">Timestamp</th>
                        <th scope="col" className="px-8 py-5 text-right">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, index) => {
                        const p = Math.round((res.score / res.totalQuestions) * 100);
                        let badgeClass = "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30";
                        if (p < 50) badgeClass = "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30";
                        else if (p < 80) badgeClass = "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30";

                        return (
                          <tr key={index} onClick={() => window.location.href = `/result/${res.id}`} className="border-b border-slate-800/50 cursor-pointer transition-colors group">
                            <td className="px-6 py-5 font-mono">
                              <div className="flex items-center text-slate-200 truncate font-bold">
                                <User className="w-4 h-4 mr-2 text-slate-500" />
                                {res.studentEmail}
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold line-clamp-2 min-w-[200px] text-slate-100 mt-1">{res.examTitle}</td>
                            <td className="px-6 py-5">
                              <div className="flex items-center">
                                <div className={`px-2.5 py-1 rounded border font-mono tracking-widest text-xs font-bold mr-3 ${badgeClass}`}>
                                  {p}%
                                </div>
                                <span className="text-slate-400 font-mono whitespace-nowrap">{res.score}/{res.totalQuestions}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-mono text-xs whitespace-nowrap text-slate-400">
                              {new Date(res.submittedAt).toLocaleDateString()} {new Date(res.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-6 py-5 text-right">
                                <button 
                                   onClick={(e) => handleDeleteResult(res.id as string, e)}
                                   className="p-2 text-[#ef4444] hover:bg-[#ef4444] hover:text-white rounded transition"
                                   title="Delete Record"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
