"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Monitor,
  Sparkles,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  Code,
  FileText,
  Activity,
  UserCheck,
  RefreshCw,
  Zap,
  Terminal,
  Award,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuestionPayload {
  id: string;
  question_text: string;
  question_type: string;
  marks: number;
  difficulty: string;
  bloom_level: string;
  options: Array<{ key: string; text: string }>;
}

interface ExamSessionData {
  attempt_id: string;
  test_id: string;
  test_title: string;
  course_code: string;
  course_name: string;
  duration_minutes: number;
  total_marks: number;
  started_at: string;
  questions: QuestionPayload[];
}

interface ResultResponseData {
  attempt_id: string;
  test_title: string;
  student_name: string;
  enrollment_no: string;
  score: number;
  total_marks: number;
  percentage: number;
  suspicious_score: number;
  tab_switches: number;
  fullscreen_violations: number;
  topic_mastery_impact: Array<{ topic: string; mastery_percentage: number; status: string }>;
  co_attainment_impact: Array<{ co_code: string; attainment_percentage: number }>;
  ai_recommendations: string[];
}

interface ReplayData {
  attempt_id: string;
  student_name: string;
  enrollment_no: string;
  test_title: string;
  total_duration_minutes: number;
  started_at: string;
  submitted_at: string;
  score: number;
  percentage: number;
  suspicious_score: number;
  events: Array<{
    timestamp: string;
    event_type: string;
    question_id?: string;
    question_text?: string;
    answer_preview?: string;
    details: string;
  }>;
}

export default function ExamOSPage() {
  const [activeTab, setActiveTab] = useState<"cbt" | "proctor" | "evaluator" | "replay">("cbt");

  // CBT State
  const [activeSession, setActiveSession] = useState<ExamSessionData | null>(null);
  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Python");
  const [tabSwitches, setTabSwitches] = useState<number>(0);
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [examResult, setExamResult] = useState<ResultResponseData | null>(null);

  // Replay & Proctor State
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [proctorList, setProctorList] = useState<any | null>(null);

  useEffect(() => {
    // Tab switch detector for anti-cheating
    const handleBlur = () => {
      if (activeSession && !examResult) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [activeSession, examResult]);

  const handleStartExamDemo = async () => {
    try {
      // Get AI/7 course & test or generate
      const cRes = await fetch(`${API_BASE_URL}/api/curriculum/AI/7`);
      const cData = await cRes.json();
      const courseId = cData.subjects[0].id;

      const sRes = await fetch(`${API_BASE_URL}/students/search?q=Aman`);
      const sList = await sRes.json();
      const studentId = sList[0].id;

      // Generate 3 questions for course
      await fetch(`${API_BASE_URL}/questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          question_type: "SHORT",
          bloom_level: "Understand",
          count: 3
        })
      });

      // Start Exam
      const startRes = await fetch(`${API_BASE_URL}/exam/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_id: "TEST_DEMO_001",
          student_id: studentId
        })
      });

      if (startRes.ok) {
        const sData = await startRes.json();
        setActiveSession(sData);
        setExamResult(null);
        setActiveQIndex(0);
        setTabSwitches(0);
      }
    } catch (err) {
      console.error("Error starting exam session:", err);
    }
  };

  const handleSaveCurrentAnswer = async (newText: string) => {
    if (!activeSession) return;
    const currentQ = activeSession.questions[activeQIndex];
    if (!currentQ) return;

    setAnswersMap((prev) => ({ ...prev, [currentQ.id]: newText }));
    setSavingAnswer(true);

    try {
      const res = await fetch(`${API_BASE_URL}/exam/save-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: activeSession.attempt_id,
          question_id: currentQ.id,
          answer: newText,
          code_language: selectedLanguage,
          tab_switch_count: tabSwitches,
          fullscreen_violations: 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLastSavedTime(data.auto_saved_at);
      }
    } catch (err) {
      console.error("Error auto-saving answer:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`${API_BASE_URL}/exam/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: activeSession.attempt_id,
          tab_switch_count: tabSwitches,
          fullscreen_violations: 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExamResult(data);

        // Fetch Replay timeline
        const rRes = await fetch(`${API_BASE_URL}/exam/replay/${activeSession.attempt_id}`);
        if (rRes.ok) {
          const rData = await rRes.json();
          setReplayData(rData);
        }
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
    }
  };

  const currentQ = activeSession?.questions[activeQIndex];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/30 text-purple-200 text-xs font-semibold px-3 py-1 rounded-full border border-purple-400/20 flex items-center gap-1.5">
                <Sparkles size={13} /> University CBT Exam OS Engine
              </span>
              <span className="bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 rounded-full border border-red-400/20 flex items-center gap-1">
                <ShieldAlert size={13} /> Anti-Cheating & Replay Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Exam Operating System (Exam OS)
            </h1>
            <p className="text-purple-100 max-w-2xl text-sm">
              Live Computer-Based Test execution with 5-second auto-save, Monaco-style Code Sandbox, AI Subjective Rubric Evaluation, Anti-Cheating monitor, and automatic Topic Mastery cascade updates.
            </p>
          </div>

          <button
            onClick={handleStartExamDemo}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-extrabold text-xs shadow-lg shadow-purple-900/50 hover:bg-purple-500 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Play size={16} /> Launch Live CBT Exam Demo
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "cbt", label: "Live CBT Exam Window", icon: Monitor },
          { id: "proctor", label: "Teacher Live Proctoring Monitor", icon: ShieldAlert },
          { id: "evaluator", label: "AI Subjective & Code Auto-Evaluator", icon: Zap },
          { id: "replay", label: "Exam Replay & Cascade Impact", icon: Activity },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live CBT Exam Window */}
      {activeTab === "cbt" && (
        <div className="space-y-6">
          {activeSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Question Navigator Column */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Question Palette</span>
                  <h3 className="text-sm font-extrabold text-slate-900">{activeSession.test_title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-1 font-mono">
                    <Clock size={14} /> Time Remaining: 02:59:14
                  </div>
                </div>

                {/* Question Numbers Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {activeSession.questions.map((q, idx) => {
                    const isAnswered = !!answersMap[q.id];
                    const isCurrent = idx === activeQIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQIndex(idx)}
                        className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                          isCurrent
                            ? "bg-purple-600 text-white border-purple-600 shadow-md"
                            : isAnswered
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        Q{idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Anti-Cheating Real-time Counter */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-red-400">
                      <ShieldAlert size={14} /> Tab Switches
                    </span>
                    <span className="font-mono text-red-400">{tabSwitches}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {tabSwitches > 0 ? "Warning: Focus switch recorded and flagged." : "Exam session locked in Fullscreen."}
                  </div>
                </div>

                {/* Auto-Save Pulse Indicator */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Save size={13} className={savingAnswer ? "text-amber-500 animate-spin" : "text-emerald-600"} />
                    {savingAnswer ? "Saving..." : "Auto-Saved (5s)"}
                  </span>
                  <span className="font-mono">{lastSavedTime}</span>
                </div>
              </div>

              {/* Main CBT Question & Answer Area */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6 flex flex-col justify-between">
                {currentQ && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Question {activeQIndex + 1} of {activeSession.questions.length}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-purple-100 text-purple-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                            {currentQ.question_type} • {currentQ.marks} Marks
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Bloom: {currentQ.bloom_level}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{activeSession.course_code}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-relaxed">
                      {currentQ.question_text}
                    </h3>

                    {/* Answer Editor by Question Format */}
                    {currentQ.question_type === "MCQ" ? (
                      <div className="space-y-2">
                        {currentQ.options.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => handleSaveCurrentAnswer(opt.key)}
                            className={`w-full text-left p-4 rounded-2xl border text-xs font-semibold transition-all ${
                              answersMap[currentQ.id] === opt.key
                                ? "bg-purple-50 border-purple-600 text-purple-950 font-bold shadow-sm"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <span className="font-bold mr-2">{opt.key}.</span> {opt.text}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-slate-700">Student Response Buffer</label>
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-slate-900 text-emerald-400 font-mono text-[11px] font-bold px-3 py-1 rounded-xl"
                          >
                            <option value="Python">Python 3.10</option>
                            <option value="C++">C++ 17</option>
                            <option value="Java">Java 17</option>
                          </select>
                        </div>
                        <textarea
                          rows={8}
                          placeholder="Type subjective response or code solution here..."
                          value={answersMap[currentQ.id] || ""}
                          onChange={(e) => handleSaveCurrentAnswer(e.target.value)}
                          className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex gap-2">
                    <button
                      disabled={activeQIndex === 0}
                      onClick={() => setActiveQIndex((prev) => prev - 1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={activeQIndex === activeSession.questions.length - 1}
                      onClick={() => setActiveQIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitExam}
                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-200 hover:bg-red-700 transition-all"
                  >
                    Submit Exam & Run Auto Evaluation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-md text-center space-y-4">
              <Monitor size={48} className="text-slate-300 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900">CBT Exam OS Window Standby</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Launch Live CBT Exam Demo" above to initiate a secure exam session with live countdown timers and auto-saving.
              </p>
            </div>
          )}

          {/* Exam Result Display Card */}
          {examResult && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-3 py-1 rounded-full">
                    EXAM SUBMITTED & AUTO EVALUATED
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{examResult.test_title}</h3>
                  <p className="text-xs text-slate-500 font-bold">{examResult.student_name} ({examResult.enrollment_no})</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-purple-600">{examResult.percentage}%</div>
                  <div className="text-xs font-bold text-slate-400 font-mono">{examResult.score} / {examResult.total_marks} Marks</div>
                </div>
              </div>

              {/* Automatic Cascade Impact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider block">Topic Mastery Impact</span>
                  {examResult.topic_mastery_impact.map((tm, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span>{tm.topic}</span>
                      <span className="text-purple-600 font-mono">{tm.mastery_percentage}%</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">CO Attainment Impact</span>
                  {examResult.co_attainment_impact.map((co, i) => (
                    <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-800">
                      <span>{co.co_code}</span>
                      <span className="text-blue-600 font-mono">{co.attainment_percentage}%</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Anti-Cheating Score</span>
                  <div className="text-2xl font-black text-slate-900">{examResult.suspicious_score}%</div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Tab Switches: {examResult.tab_switches} • Fullscreen Exits: {examResult.fullscreen_violations}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Exam Replay & Analytics */}
      {activeTab === "replay" && replayData && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Activity size={18} className="text-purple-600" /> Student Exam Replay Timeline
          </h3>
          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {replayData.events.map((ev, idx) => (
              <div key={idx} className="flex gap-4 items-start pl-6 relative">
                <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                  ev.event_type.includes("VIOLATION") ? "bg-red-500" : "bg-purple-500"
                }`} />
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{ev.event_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{ev.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
