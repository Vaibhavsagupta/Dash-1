"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  LineChart,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Cpu,
  Zap,
  Briefcase,
  ShieldAlert,
  Layers,
  Search,
  CheckCircle2,
  ListTodo,
  Activity,
  Users,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface XAIFactor {
  factor_name: string;
  impact_level: string;
  description: string;
  contribution_weight: number;
}

interface DigitalTwinSim {
  scenario_title: string;
  action_required: string;
  predicted_cgpa_change: string;
  predicted_risk_change: string;
}

interface StudentPredictionData {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  overall_risk_score: number;
  risk_level: string;
  predicted_cgpa: number;
  cgpa_confidence: number;
  dropout_probability: number;
  subject_backlog_forecast: Array<{ subject_code: string; subject_name: string; backlog_probability: number }>;
  explainable_ai_factors: XAIFactor[];
  academic_digital_twin: DigitalTwinSim[];
}

interface PRSData {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  prs_score: number;
  technical: number;
  coding: number;
  aptitude: number;
  communication: number;
  projects: number;
  readiness_tier: string;
}

interface HODData {
  total_enrolled: number;
  critical_risk_count: number;
  moderate_risk_count: number;
  average_prs_score: number;
  batch_cohort_forecasts: Array<{ batch_year: number; program_code: string; total_students: number; predicted_pass_rate: number; predicted_at_risk_count: number }>;
  at_risk_leaderboard: Array<{ student_id: string; student_name: string; enrollment_no: string; program_code: string; risk_score: number; risk_level: string; top_reason: string }>;
}

interface InterventionPlan {
  id: string;
  student_id: string;
  student_name: string;
  intervention_type: string;
  priority: string;
  action_plan: Array<{ task: string; priority: string; deadline: string; status: string }>;
  completed: boolean;
  created_at: string;
}

export default function PredictiveAIPage() {
  const [activeTab, setActiveTab] = useState<"risk" | "prs" | "intervention" | "hod">("risk");

  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("Aman");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [predictionData, setPredictionData] = useState<StudentPredictionData | null>(null);
  const [prsData, setPrsData] = useState<PRSData | null>(null);
  const [hodData, setHodData] = useState<HODData | null>(null);
  const [interventionPlan, setInterventionPlan] = useState<InterventionPlan | null>(null);
  const [generatingIntervention, setGeneratingIntervention] = useState<boolean>(false);

  useEffect(() => {
    fetchPredictionData(studentSearchQuery);
  }, []);

  const fetchPredictionData = async (query: string) => {
    try {
      const sRes = await fetch(`${API_BASE_URL}/students/search?q=${query}`);
      const sList = await sRes.json();
      if (sList.length > 0) {
        const sId = sList[0].id;
        setSelectedStudentId(sId);

        // Fetch Student Prediction & Digital Twin
        const pRes = await fetch(`${API_BASE_URL}/predictions/student/${sId}`);
        if (pRes.ok) setPredictionData(await pRes.json());

        // Fetch PRS Score
        const prRes = await fetch(`${API_BASE_URL}/predictions/placement/${sId}`);
        if (prRes.ok) setPrsData(await prRes.json());

        // Fetch HOD Command Center
        const hRes = await fetch(`${API_BASE_URL}/predictions/department`);
        if (hRes.ok) setHodData(await hRes.json());
      }
    } catch (err) {
      console.error("Error fetching prediction data:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPredictionData(studentSearchQuery);
  };

  const handleGenerateIntervention = async () => {
    if (!selectedStudentId) return;
    setGeneratingIntervention(true);
    try {
      const res = await fetch(`${API_BASE_URL}/interventions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: selectedStudentId })
      });
      if (res.ok) {
        setInterventionPlan(await res.json());
      }
    } catch (err) {
      console.error("Error generating intervention:", err);
    } finally {
      setGeneratingIntervention(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-rose-500/30 text-rose-200 text-xs font-semibold px-3 py-1 rounded-full border border-rose-400/20 flex items-center gap-1.5">
                <Sparkles size={13} /> 30–90 Day Predictive AI Engine
              </span>
              <span className="bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 rounded-full border border-red-400/20 flex items-center gap-1">
                <Cpu size={13} /> Academic Digital Twin Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Predictive Academic Intelligence Engine (PAIE)
            </h1>
            <p className="text-rose-100 max-w-2xl text-sm">
              Hybrid prediction strategy (Rule-based Fallback + Statistical ML), Explainable AI (XAI) factor attributions, Academic Digital Twin scenario simulator, Placement Readiness Scores (PRS), and HOD Command Center.
            </p>
          </div>

          <button
            onClick={handleGenerateIntervention}
            disabled={generatingIntervention}
            className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-900/50 hover:bg-rose-500 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Zap size={16} /> Generate AI Intervention Plan
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
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-md"
          >
            Run Predictive Simulation
          </button>
        </form>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "risk", label: "Student Risk & Digital Twin", icon: LineChart },
          { id: "prs", label: "Placement Readiness (PRS)", icon: Briefcase },
          { id: "intervention", label: "AI Intervention Generator", icon: ListTodo },
          { id: "hod", label: "HOD Command & Parent Warnings", icon: ShieldAlert },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? "bg-rose-600 text-white shadow-md shadow-rose-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Student Risk & Digital Twin */}
      {activeTab === "risk" && predictionData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Risk Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{predictionData.student_name}</h3>
                <p className="text-xs text-slate-400 font-mono">{predictionData.enrollment_no}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                predictionData.risk_level === "CRITICAL"
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {predictionData.risk_level} RISK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="text-2xl font-black text-red-600">{predictionData.overall_risk_score}%</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">30-90 Day Risk</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="text-2xl font-black text-slate-900">{predictionData.predicted_cgpa}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted CGPA</div>
              </div>
            </div>

            {/* Subject Backlog Forecast */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Subject Backlog Probability</h4>
              <div className="space-y-2">
                {predictionData.subject_backlog_forecast.map((sb) => (
                  <div key={sb.subject_code} className="bg-slate-50 p-2.5 rounded-xl border text-xs flex justify-between items-center font-semibold">
                    <div>
                      <span className="font-mono text-purple-600 mr-2">{sb.subject_code}</span>
                      <span className="text-slate-800">{sb.subject_name}</span>
                    </div>
                    <span className="font-mono font-bold text-red-600">{sb.backlog_probability}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explainable AI Factors */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                <Cpu size={14} className="text-rose-600" /> Explainable AI (XAI) Factors
              </h4>
              <div className="space-y-2">
                {predictionData.explainable_ai_factors.map((xai, i) => (
                  <div key={i} className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/60 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-rose-950">{xai.factor_name}</span>
                      <span className="text-[10px] font-black text-rose-700">{xai.impact_level}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{xai.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Academic Digital Twin Simulator Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="bg-rose-100 text-rose-700 font-extrabold text-[10px] px-3 py-1 rounded-full">
                  ACADEMIC DIGITAL TWIN SIMULATOR
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">Future Improvement Scenario Simulator</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">Live Scenarios</span>
            </div>

            <div className="space-y-4">
              {predictionData.academic_digital_twin.map((sim, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900">{sim.scenario_title}</h4>
                  <p className="text-xs text-slate-600 font-medium">{sim.action_required}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold pt-2 border-t border-slate-200">
                    <div className="text-emerald-600">
                      <span>Predicted CGPA Impact:</span> {sim.predicted_cgpa_change}
                    </div>
                    <div className="text-blue-600">
                      <span>Risk Score Reduction:</span> {sim.predicted_risk_change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Placement Readiness (PRS) */}
      {activeTab === "prs" && prsData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-3 py-1 rounded-full">
                PLACEMENT READINESS ENGINE
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{prsData.student_name}</h3>
              <p className="text-xs text-slate-500 font-bold">{prsData.enrollment_no}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-600">{prsData.prs_score}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">{prsData.readiness_tier}</div>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { label: "Technical Concepts (35%)", val: prsData.technical, color: "bg-blue-600" },
              { label: "Coding Speed & Sandbox (25%)", val: prsData.coding, color: "bg-purple-600" },
              { label: "Aptitude & Logic (15%)", val: prsData.aptitude, color: "bg-emerald-600" },
              { label: "Communication Skill (15%)", val: prsData.communication, color: "bg-teal-600" },
              { label: "Project Portfolio (10%)", val: prsData.projects, color: "bg-indigo-600" },
            ].map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{p.label}</span>
                  <span className="font-mono">{p.val}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: AI Intervention Generator */}
      {activeTab === "intervention" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ListTodo size={18} className="text-rose-600" /> AI Academic Intervention Plan
            </h3>
            <button
              onClick={handleGenerateIntervention}
              disabled={generatingIntervention}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-md"
            >
              Generate Fresh Action Plan
            </button>
          </div>

          {interventionPlan ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-rose-100 text-rose-700 font-black text-xs px-3 py-1 rounded-full">
                  {interventionPlan.priority} PRIORITY INTERVENTION
                </span>
                <span className="text-xs text-slate-400 font-mono">Created: {interventionPlan.created_at}</span>
              </div>

              <div className="space-y-3">
                {interventionPlan.action_plan.map((task, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500" />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{task.task}</div>
                        <span className="text-[10px] font-bold text-slate-400">Deadline: {task.deadline}</span>
                      </div>
                    </div>
                    <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Click "Generate Fresh Action Plan" to produce prioritized intervention tasks.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: HOD Command & Parent Warnings */}
      {activeTab === "hod" && hodData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-slate-900">{hodData.total_enrolled}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Total Enrolled Students</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-red-600">{hodData.critical_risk_count}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Critical Risk Students</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-amber-600">{hodData.moderate_risk_count}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Moderate Risk Students</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-blue-600">{hodData.average_prs_score}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Average Placement PRS</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-600" /> At-Risk Student Leaderboard
            </h3>
            <div className="space-y-3">
              {hodData.at_risk_leaderboard.map((st) => (
                <div key={st.student_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {st.student_name} (<span className="font-mono">{st.enrollment_no}</span>)
                    </div>
                    <p className="text-xs text-red-950 font-medium">{st.top_reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    st.risk_level === "HIGH" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {st.risk_score}% RISK
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
