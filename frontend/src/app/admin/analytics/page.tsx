"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  BrainCircuit,
  Sparkles,
  Award,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Printer,
  Search,
  BookOpen,
  UserCheck,
  Zap,
  Activity,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AcademicDNA {
  concept_strength: number;
  application_skill: number;
  analytical_reasoning: number;
  consistency: number;
  learning_speed: number;
  overall_dna_rating: string;
}

interface TopicMasteryItem {
  topic_id: string;
  topic_name: string;
  unit_number: number;
  course_code: string;
  mastery_score: number;
  confidence: number;
  status: string;
}

interface StudentMasteryData {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  program_code: string;
  overall_mastery_percentage: number;
  academic_dna: AcademicDNA;
  topic_masteries: TopicMasteryItem[];
}

interface COItem {
  co_id: string;
  co_code: string;
  statement: string;
  attainment_percentage: number;
  target_threshold: number;
  status: string;
}

interface StudentCOData {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  course_code: string;
  co_attainments: COItem[];
}

interface TEIData {
  faculty_id: string;
  faculty_name: string;
  department: string;
  tei_score: number;
  topic_completion_weight: number;
  student_improvement_weight: number;
  attendance_weight: number;
  co_achievement_weight: number;
  engagement_weight: number;
  rating: string;
}

interface RecommendationItem {
  role: string;
  target_name: string;
  recommendation_text: string;
  priority: string;
  action_type: string;
}

interface AccreditationReport {
  report_title: string;
  academic_year: string;
  program_code: string;
  nba_status: string;
  naac_rating: string;
  co_attainment_summary: Array<{ co_code: string; description: string; target_pct: number; actual_pct: number; status: string }>;
  faculty_effectiveness_summary: Array<{ faculty_name: string; tei_score: number; rating: string }>;
  generated_at: string;
}

export default function LearningIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"mastery" | "co" | "bloom" | "tei" | "recommendations">("mastery");

  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("Aman");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [masteryData, setMasteryData] = useState<StudentMasteryData | null>(null);
  const [coData, setCoData] = useState<StudentCOData | null>(null);
  const [teiData, setTeiData] = useState<TEIData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [accreditationReport, setAccreditationReport] = useState<AccreditationReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  useEffect(() => {
    fetchStudentData(studentSearchQuery);
  }, []);

  const fetchStudentData = async (query: string) => {
    try {
      const sRes = await fetch(`${API_BASE_URL}/students/search?q=${query}`);
      const sList = await sRes.json();
      if (sList.length > 0) {
        const sId = sList[0].id;
        setSelectedStudentId(sId);

        // Fetch Mastery & DNA
        const mRes = await fetch(`${API_BASE_URL}/analytics/student/${sId}/mastery`);
        if (mRes.ok) setMasteryData(await mRes.json());

        // Fetch CO Attainment
        const cRes = await fetch(`${API_BASE_URL}/analytics/student/${sId}/co`);
        if (cRes.ok) setCoData(await cRes.json());

        // Fetch TEI
        const tRes = await fetch(`${API_BASE_URL}/analytics/faculty/FAC_001`);
        if (tRes.ok) setTeiData(await tRes.json());

        // Fetch Recommendations
        const rRes = await fetch(`${API_BASE_URL}/recommendations/student/${sId}`);
        if (rRes.ok) setRecommendations(await rRes.json());
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData(studentSearchQuery);
  };

  const handleFetchReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/accreditation`);
      if (res.ok) {
        setAccreditationReport(await res.json());
        setShowReportModal(true);
      }
    } catch (err) {
      console.error("Error fetching accreditation report:", err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1.5">
                <BrainCircuit size={13} /> NBA / NAAC Accreditation Intelligence
              </span>
              <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full border border-teal-400/20 flex items-center gap-1">
                <ShieldCheck size={13} /> Academic DNA Engine Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Learning Intelligence Engine (LIE)
            </h1>
            <p className="text-emerald-100 max-w-2xl text-sm">
              Live Academic DNA Knowledge Graph, Topic Mastery tracking, NBA Course Outcome (CO) Attainment, Bloom's Taxonomy Cognitive Profiling, and Teacher Effectiveness Intelligence (TEI).
            </p>
          </div>

          <button
            onClick={handleFetchReport}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Printer size={16} /> Export NBA/NAAC Report
          </button>
        </div>
      </div>

      {/* Student Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder="Search Student Name or Enrollment No (e.g. Aman / 23BTA3ARI10038)..."
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
          >
            Analyze Academic DNA
          </button>
        </form>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "mastery", label: "Topic Mastery & Academic DNA", icon: BrainCircuit },
          { id: "co", label: "CO Attainment & Accreditation", icon: Award },
          { id: "bloom", label: "Bloom's Cognitive Profiling", icon: Layers },
          { id: "tei", label: "Teacher Effectiveness (TEI)", icon: UserCheck },
          { id: "recommendations", label: "Personalized AI Paths", icon: Zap },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Topic Mastery & Academic DNA */}
      {activeTab === "mastery" && masteryData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic DNA Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                {masteryData.academic_dna.overall_dna_rating}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{masteryData.student_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{masteryData.enrollment_no}</p>
            </div>

            <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-3xl font-black text-emerald-600">{masteryData.overall_mastery_percentage}%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Overall Topic Mastery Score</div>
            </div>

            {/* Academic DNA Radar Trait Bars */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Academic DNA Traits</h4>
              {[
                { label: "Concept Strength", val: masteryData.academic_dna.concept_strength, color: "bg-emerald-500" },
                { label: "Application Skill", val: masteryData.academic_dna.application_skill, color: "bg-blue-500" },
                { label: "Analytical Reasoning", val: masteryData.academic_dna.analytical_reasoning, color: "bg-purple-500" },
                { label: "Learning Consistency", val: masteryData.academic_dna.consistency, color: "bg-teal-500" },
                { label: "Learning Speed", val: masteryData.academic_dna.learning_speed, color: "bg-indigo-500" },
              ].map((trait, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{trait.label}</span>
                    <span className="font-mono">{trait.val}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${trait.color}`} style={{ width: `${trait.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Mastery List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-600" /> Live Topic Mastery Breakdown ({masteryData.topic_masteries.length})
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {masteryData.topic_masteries.map((tm) => (
                <div key={tm.topic_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-800 mr-2">{tm.course_code}</span>
                      <span className="text-xs font-extrabold text-slate-900">{tm.topic_name}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      tm.status === "MASTERED"
                        ? "bg-emerald-100 text-emerald-700"
                        : tm.status === "NEED_PRACTICE"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {tm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Unit {tm.unit_number}</span>
                    <span className="font-mono font-bold text-slate-900">{tm.mastery_score}% Mastery (Conf: {tm.confidence}%)</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        tm.mastery_score >= 75 ? "bg-emerald-500" : tm.mastery_score >= 50 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${tm.mastery_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CO Attainment */}
      {activeTab === "co" && coData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">NBA / NAAC Course Outcome (CO) Attainment</h3>
              <p className="text-xs text-slate-500 font-bold">{coData.course_code} - {coData.student_name} ({coData.enrollment_no})</p>
            </div>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
              Target Threshold: 70.0%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coData.co_attainments.map((co) => (
              <div key={co.co_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full font-mono">
                    {co.co_code}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    co.status === "MET"
                      ? "bg-emerald-100 text-emerald-700"
                      : co.status === "NEAR_TARGET"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {co.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-relaxed">{co.statement}</p>
                <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-800">
                  <span>Attainment Rate:</span>
                  <span className="text-emerald-600 text-sm">{co.attainment_percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${co.attainment_percentage >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${co.attainment_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bloom's Cognitive Profiling */}
      {activeTab === "bloom" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-purple-600" /> Bloom's Taxonomy Cognitive Profiling
          </h3>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { level: "Create", pct: 22.0, color: "bg-purple-600", desc: "Design & Architect Solution" },
              { label: "Evaluate", pct: 31.0, color: "bg-indigo-600", desc: "Assess & Choose Deployment" },
              { label: "Analyze", pct: 39.0, color: "bg-blue-600", desc: "Compare & Differentiate" },
              { label: "Apply", pct: 71.0, color: "bg-teal-600", desc: "Solve & Execute Code" },
              { label: "Understand", pct: 82.0, color: "bg-emerald-600", desc: "Explain Concepts" },
              { label: "Remember", pct: 94.0, color: "bg-green-600", desc: "Recall Facts & Terminology" },
            ].map((b, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{b.label || b.level} ({b.desc})</span>
                  <span className="font-mono">{b.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: TEI */}
      {activeTab === "tei" && teiData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="bg-purple-100 text-purple-700 font-extrabold text-[10px] px-3 py-1 rounded-full">
                TEACHER EFFECTIVENESS INTELLIGENCE (TEI)
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{teiData.faculty_name}</h3>
              <p className="text-xs text-slate-500 font-bold">{teiData.department}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-600">{teiData.tei_score}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">{teiData.rating}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-lg font-black text-slate-900">{teiData.topic_completion_weight}%</div>
              <div className="text-[10px] font-bold text-slate-400">Topic Completion (20%)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-lg font-black text-emerald-600">{teiData.student_improvement_weight}%</div>
              <div className="text-[10px] font-bold text-slate-400">Student Growth (30%)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-lg font-black text-slate-900">{teiData.attendance_weight}%</div>
              <div className="text-[10px] font-bold text-slate-400">Attendance (10%)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-lg font-black text-blue-600">{teiData.co_achievement_weight}%</div>
              <div className="text-[10px] font-bold text-slate-400">CO Achievement (20%)</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-lg font-black text-purple-600">{teiData.engagement_weight}%</div>
              <div className="text-[10px] font-bold text-slate-400">Engagement (20%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Recommendations */}
      {activeTab === "recommendations" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" /> Personalized AI Action Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                    {r.role} • {r.priority}
                  </span>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{r.target_name}</div>
                    <p className="text-xs text-slate-600 font-medium">{r.recommendation_text}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">{r.action_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NBA/NAAC Report Modal */}
      {showReportModal && accreditationReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{accreditationReport.report_title}</h2>
                <p className="text-xs font-bold text-slate-500">{accreditationReport.program_code} • {accreditationReport.academic_year}</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800">NBA Status</div>
                <div className="text-base font-black text-emerald-950">{accreditationReport.nba_status}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <div className="text-xs font-bold text-blue-800">NAAC Rating</div>
                <div className="text-base font-black text-blue-950">{accreditationReport.naac_rating}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">CO Attainment Summary</h4>
              {accreditationReport.co_attainment_summary.map((co, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border text-xs font-semibold text-slate-800">
                  <div>
                    <span className="font-mono font-bold text-blue-600 mr-2">{co.co_code}</span> {co.description}
                  </div>
                  <span className="font-bold font-mono">{co.actual_pct}% ({co.status})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
