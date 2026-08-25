"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  FileText,
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Plus,
  Zap,
  Printer,
  ChevronRight,
  Filter,
  BarChart3,
  Award,
  Edit,
  Trash2,
  X,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CourseOption {
  id: string;
  course_code: string;
  course_name: string;
}

interface TopicOption {
  id: string;
  topic_name: string;
  unit_number: number;
}

interface Question {
  id: string;
  course_id: string;
  course_code: string;
  topic_name?: string;
  unit_number?: number;
  co_code?: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  bloom_level: string;
  marks: number;
  language: string;
  source_type: string;
  ai_generated: boolean;
  status: string;
  version: number;
  quality_score?: number;
  options: Array<{ id: string; option_key: string; option_text: string; is_correct: boolean }>;
  solution?: { solution_text: string; stepwise_explanation?: string; references_text?: string };
}

interface QuestionPaper {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  batch_year: number;
  semester: number;
  total_marks: number;
  duration_minutes: number;
  template_type: string;
  sections: Array<{
    section_title: string;
    questions: Array<{
      id: string;
      question_text: string;
      question_type: string;
      marks: number;
      bloom_level: string;
      co_code: string;
      options?: Array<{ key: string; text: string }>;
    }>;
  }>;
  bloom_distribution: Record<string, number>;
  co_distribution: Record<string, number>;
  created_at: string;
}

export default function AssessmentIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"generator" | "bank" | "builder" | "practice">("generator");

  // Filter Selectors
  const [selectedProgram, setSelectedProgram] = useState<string>("AI");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [topicsList, setTopicsList] = useState<TopicOption[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Generator State
  const [genQuestionType, setGenQuestionType] = useState<string>("SHORT");
  const [genBloomLevel, setGenBloomLevel] = useState<string>("Understand");
  const [genDifficulty, setGenDifficulty] = useState<string>("Medium");
  const [genMarks, setGenMarks] = useState<number>(5);
  const [genCount, setGenCount] = useState<number>(3);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedStagedQs, setGeneratedStagedQs] = useState<Question[]>([]);

  // Question Bank State
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [bankLoading, setBankLoading] = useState<boolean>(false);
  const [bankStatusFilter, setBankStatusFilter] = useState<string>("");

  // Paper Builder State
  const [paperTitle, setPaperTitle] = useState<string>("End Semester Examination 2026");
  const [paperTemplate, setPaperTemplate] = useState<string>("EndSem");
  const [buildingPaper, setBuildingPaper] = useState<boolean>(false);
  const [generatedPaper, setGeneratedPaper] = useState<QuestionPaper | null>(null);

  useEffect(() => {
    fetchCourses(selectedProgram, selectedSemester);
  }, [selectedProgram, selectedSemester]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSyllabusTopics(selectedCourseId);
      fetchQuestionBank(selectedCourseId, bankStatusFilter);
    }
  }, [selectedCourseId, bankStatusFilter]);

  const fetchCourses = async (prog: string, sem: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/curriculum/${prog}/${sem}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.subjects || []).map((s: any) => ({
          id: s.id,
          course_code: s.course_code,
          course_name: s.course_name
        }));
        setCoursesList(list);
        if (list.length > 0) setSelectedCourseId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchSyllabusTopics = async (cId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/syllabus/course/${cId}`);
      if (res.ok) {
        const data = await res.json();
        const tList: TopicOption[] = [];
        (data.units || []).forEach((u: any) => {
          (u.topics || []).forEach((t: any) => {
            tList.push({
              id: t.id,
              topic_name: t.topic_name,
              unit_number: u.unit_number
            });
          });
        });
        setTopicsList(tList);
        if (tList.length > 0) setSelectedTopicId(tList[0].id);
      }
    } catch (err) {
      console.error("Error fetching syllabus topics:", err);
    }
  };

  const fetchQuestionBank = async (cId: string, statusFilter: string) => {
    setBankLoading(true);
    try {
      let url = `${API_BASE_URL}/questions/bank?course_id=${cId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestionBank(data);
      }
    } catch (err) {
      console.error("Error fetching question bank:", err);
    } finally {
      setBankLoading(false);
    }
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourseId,
          topic_id: selectedTopicId || null,
          question_type: genQuestionType,
          bloom_level: genBloomLevel,
          difficulty: genDifficulty,
          marks: genMarks,
          count: genCount,
          source_type: "OFFICIAL"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedStagedQs(data);
        fetchQuestionBank(selectedCourseId, bankStatusFilter);
      }
    } catch (err) {
      console.error("Error generating questions:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReviewAction = async (qId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: qId,
          action: action
        })
      });
      if (res.ok) {
        fetchQuestionBank(selectedCourseId, bankStatusFilter);
        setGeneratedStagedQs((prev) => prev.filter((q) => q.id !== qId));
      }
    } catch (err) {
      console.error("Error reviewing question:", err);
    }
  };

  const handleBuildPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setBuildingPaper(true);
    try {
      const res = await fetch(`${API_BASE_URL}/question-paper/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paperTitle,
          course_id: selectedCourseId,
          batch_year: 2023,
          semester: selectedSemester,
          template_type: paperTemplate
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedPaper(data);
      }
    } catch (err) {
      console.error("Error building question paper:", err);
    } finally {
      setBuildingPaper(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/20 flex items-center gap-1.5">
                <Sparkles size={13} /> ExamSoft / Moodle Level QIE Platform
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/20 flex items-center gap-1">
                <ShieldCheck size={13} /> Cosine Similarity Filter Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              AI Question Intelligence Engine (QIE)
            </h1>
            <p className="text-blue-100 max-w-2xl text-sm">
              Syllabus-bound question generator, Bloom's Taxonomy Classifier, Difficulty Calibration Engine, Duplicate Similarity Rejection, and Dynamic University Paper Builder.
            </p>
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1 text-slate-500">Program Specialization</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["AI", "CSF", "FSD"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProgram(p)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    selectedProgram === p
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-slate-500">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-500">Course Subject</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {coursesList.length === 0 ? (
                <option value="">No subjects found (Start Backend)</option>
              ) : (
                coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} - {c.course_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-500">Syllabus Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
            >
              {topicsList.length === 0 ? (
                <option value="">No topics found (Start Backend)</option>
              ) : (
                topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    Unit {t.unit_number}: {t.topic_name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "generator", label: "AI Question Generator & Stager", icon: Zap },
          { id: "bank", label: `Enterprise Question Bank (${questionBank.length})`, icon: BookOpen },
          { id: "builder", label: "Dynamic Question Paper Builder", icon: FileText },
          { id: "practice", label: "Weak Topic Adaptive Practice", icon: Award },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Question Generator */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap size={18} className="text-blue-600" /> AI Generation Pipeline
            </h3>

            <form onSubmit={handleGenerateQuestions} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Question Format</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["MCQ", "SHORT", "LONG"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGenQuestionType(t)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        genQuestionType === t
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-500">Bloom's Taxonomy Level</label>
                <select
                  value={genBloomLevel}
                  onChange={(e) => setGenBloomLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Remember">Remember (Recall Facts)</option>
                  <option value="Understand">Understand (Explain Concepts)</option>
                  <option value="Apply">Apply (Solve Problems)</option>
                  <option value="Analyze">Analyze (Differentiate)</option>
                  <option value="Evaluate">Evaluate (Assess & Choose)</option>
                  <option value="Create">Create (Design Architecture)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-slate-500">Difficulty Calibration</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Marks Value</label>
                  <input
                    type="number"
                    value={genMarks}
                    onChange={(e) => setGenMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-500">Number of Questions</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {generating ? "Calibrating & Validating Quality..." : "Generate AI Questions"}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Questions Staging Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" /> Staged Questions Review Queue ({generatedStagedQs.length})
              </h3>
              <span className="text-xs font-semibold text-slate-400">Quality Verified & Similarity Filtered</span>
            </div>

            {generatedStagedQs.map((q) => (
              <div key={q.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                      {q.question_type} • {q.marks} Marks
                    </span>
                    <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Bloom: {q.bloom_level}
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {q.difficulty}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    Quality: {q.quality_score}%
                  </span>
                </div>

                <p className="text-sm font-bold text-slate-900 leading-relaxed">{q.question_text}</p>

                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.option_key}
                        className={`p-2.5 rounded-xl border text-xs font-semibold ${
                          opt.is_correct ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold" : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="font-bold mr-1.5">{opt.option_key}.</span> {opt.option_text}
                      </div>
                    ))}
                  </div>
                )}

                {q.solution && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Solution Breakdown</span>
                    <p className="whitespace-pre-line leading-relaxed">{q.solution.solution_text}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleReviewAction(q.id, "REJECT")}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReviewAction(q.id, "ACCEPT")}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    Approve to Question Bank
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === "bank" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" /> Filter Question Bank
            </h3>
            <select
              value={bankStatusFilter}
              onChange={(e) => setBankStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
            >
              <option value="">All Statuses (Approved & Staged)</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING_REVIEW">Pending Review Only</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionBank.map((q) => (
              <div key={q.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                      {q.question_type} • {q.marks}M
                    </span>
                    <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded">
                      {q.bloom_level}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    q.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-relaxed">{q.question_text}</p>
                <div className="text-[10px] text-slate-400 font-medium">
                  Topic: {q.topic_name} • Unit {q.unit_number} • {q.co_code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Question Paper Builder */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> Exam Paper Configuration
            </h3>

            <form onSubmit={handleBuildPaper} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Paper Title</label>
                <input
                  type="text"
                  required
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-500">University Exam Template</label>
                <select
                  value={paperTemplate}
                  onChange={(e) => setPaperTemplate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EndSem">End Semester Exam (100 Marks - 3 Hours)</option>
                  <option value="Sessional">Sessional Exam (50 Marks - 2 Hours)</option>
                  <option value="Midterm">Midterm Exam (30 Marks - 1.5 Hours)</option>
                  <option value="Quiz">Quick Class Quiz (20 Marks - 30 Mins)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={buildingPaper}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {buildingPaper ? "Constructing Exam Paper..." : "Build University Question Paper"}
                </button>
              </div>
            </form>
          </div>

          {/* Paper Preview Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
            {generatedPaper ? (
              <div className="space-y-6">
                <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">{generatedPaper.title}</h2>
                  <div className="text-xs font-bold text-slate-600">{generatedPaper.course_code} - {generatedPaper.course_name}</div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 pt-2 font-mono">
                    <span>Duration: {generatedPaper.duration_minutes} Mins</span>
                    <span>Max Marks: {generatedPaper.total_marks}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {generatedPaper.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-900 underline decoration-slate-300">{sec.section_title}</h4>
                      <div className="space-y-3">
                        {sec.questions.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-1 text-xs text-slate-900 font-medium">
                            <div className="flex justify-between">
                              <span><strong className="mr-1">Q{qIdx + 1}.</strong> {q.question_text}</span>
                              <span className="font-bold font-mono ml-4">[{q.marks}M]</span>
                            </div>
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 pl-4 pt-1 text-[11px]">
                                {q.options.map((o) => (
                                  <div key={o.key}>({o.key}) {o.text}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <FileText size={40} className="text-slate-300 mx-auto" />
                <h4 className="text-sm font-extrabold text-slate-800">Dynamic Paper Studio</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a template and click "Build University Question Paper" to dynamically balance Bloom levels and CO distribution.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
