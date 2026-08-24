"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Building2,
  Sparkles,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  FileCheck,
  ShieldCheck,
  Zap,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
  TrendingUp,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveKPI {
  id: string;
  kpi_name: string;
  category: string;
  target_value: number;
  current_value: number;
  status: string;
}

interface UniversityCommandData {
  institution_name: string;
  academic_year: string;
  total_students: number;
  active_faculty: number;
  overall_attendance_pct: number;
  overall_pass_rate_pct: number;
  co_attainment_pct: number;
  average_prs_score: number;
  at_risk_students_count: number;
  live_kpis: LiveKPI[];
  executive_ai_insights: string[];
}

interface DeanData {
  title: string;
  school_name: string;
  total_departments: number;
  program_comparisons: Array<{ program_code: string; name: string; students: number; attendance: number; pass_rate: number; co_attainment: number; prs_avg: number }>;
}

interface CandidateShortlist {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  program_code: string;
  prs_score: number;
  technical: number;
  coding: number;
  readiness_tier: string;
}

interface PlacementData {
  total_eligible: number;
  product_ready_count: number;
  service_ready_count: number;
  upskilling_count: number;
  average_prs: number;
  top_candidate_shortlist: CandidateShortlist[];
}

interface DigitalTwinData {
  university_scenario: string;
  action_simulated: string;
  predicted_pass_rate_impact: string;
  predicted_co_attainment_impact: string;
  executive_recommendation: string;
}

export default function InstitutionalIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"command" | "deans" | "placement" | "accreditation" | "scheduler">("command");

  const [commandData, setCommandData] = useState<UniversityCommandData | null>(null);
  const [deanData, setDeanData] = useState<DeanData | null>(null);
  const [placementData, setPlacementData] = useState<PlacementData | null>(null);
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinData | null>(null);

  const [nbaResult, setNbaResult] = useState<any | null>(null);
  const [naacResult, setNaacResult] = useState<any | null>(null);
  const [isGeneratingNba, setIsGeneratingNba] = useState<boolean>(false);
  const [isGeneratingNaac, setIsGeneratingNaac] = useState<boolean>(false);

  useEffect(() => {
    fetchUniversityData();
  }, []);

  const fetchUniversityData = async () => {
    try {
      const cRes = await fetch(`${API_BASE_URL}/institution/kpis`);
      if (cRes.ok) setCommandData(await cRes.json());

      const dRes = await fetch(`${API_BASE_URL}/institution/dean`);
      if (dRes.ok) setDeanData(await dRes.json());

      const pRes = await fetch(`${API_BASE_URL}/institution/placement`);
      if (pRes.ok) setPlacementData(await pRes.json());

      const dtRes = await fetch(`${API_BASE_URL}/institution/digital-twin`);
      if (dtRes.ok) setDigitalTwin(await dtRes.json());
    } catch (err) {
      console.error("Error fetching institutional data:", err);
    }
  };

  const handleGenerateNBA = async () => {
    setIsGeneratingNba(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/nba`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program_code: "AI", academic_year: "2025-2026" })
      });
      if (res.ok) setNbaResult(await res.json());
    } catch (err) {
      console.error("Error generating NBA report:", err);
    } finally {
      setIsGeneratingNba(false);
    }
  };

  const handleGenerateNAAC = async () => {
    setIsGeneratingNaac(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/naac`, { method: "POST" });
      if (res.ok) setNaacResult(await res.json());
    } catch (err) {
      console.error("Error generating NAAC evidence:", err);
    } finally {
      setIsGeneratingNaac(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/20 flex items-center gap-1.5">
                <Building2 size={13} /> Institutional Command & Accreditation Center
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
                <ShieldCheck size={13} /> 90% Automated Evidence Builder Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Institutional Intelligence Command Center (IIACC)
            </h1>
            <p className="text-indigo-100 max-w-2xl text-sm">
              Executive University Command Center, Dean cross-department benchmarking, Placement candidate shortlists, 1-Click NBA & NAAC Accreditation Evidence generator, and Institution Digital Twin Simulator.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleGenerateNBA}
              disabled={isGeneratingNba}
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <Printer size={15} /> Export NBA Report
            </button>
            <button
              onClick={handleGenerateNAAC}
              disabled={isGeneratingNaac}
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg hover:bg-emerald-500 transition-all flex items-center gap-2"
            >
              <FileCheck size={15} /> Build NAAC Evidence
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "command", label: "University Command & Digital Twin", icon: Building2 },
          { id: "deans", label: "HOD & Dean Benchmarking", icon: BarChart3 },
          { id: "placement", label: "Placement Cell Intelligence", icon: Briefcase },
          { id: "accreditation", label: "NBA / NAAC Evidence Center", icon: Award },
          { id: "scheduler", label: "Automated Report Scheduler", icon: Calendar },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: University Command & Digital Twin */}
      {activeTab === "command" && commandData && (
        <div className="space-y-6">
          {/* Executive KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-indigo-600">{commandData.overall_attendance_pct}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase">University Attendance</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-emerald-600">{commandData.co_attainment_pct}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase">CO Attainment Compliance</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-blue-600">{commandData.overall_pass_rate_pct}%</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Semester Pass Percentage</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md">
              <div className="text-3xl font-black text-purple-600">{commandData.average_prs_score}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Placement Readiness Index</div>
            </div>
          </div>

          {/* Institution Digital Twin Simulator Card */}
          {digitalTwin && (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-indigo-500/30 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase">
                <Cpu size={16} /> Institution Digital Twin Simulator
              </div>
              <h3 className="text-lg font-black">{digitalTwin.university_scenario}</h3>
              <p className="text-xs text-indigo-100">{digitalTwin.action_simulated}</p>

              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-mono font-bold">
                <div className="text-emerald-400">{digitalTwin.predicted_pass_rate_impact}</div>
                <div className="text-blue-400">{digitalTwin.predicted_co_attainment_impact}</div>
              </div>
            </div>
          )}

          {/* Executive AI Insights */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" /> Executive AI Decision Support Insights
            </h3>
            <div className="space-y-2">
              {commandData.executive_ai_insights.map((insight, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs font-semibold text-slate-800 flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: HOD & Dean Benchmarking */}
      {activeTab === "deans" && deanData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">{deanData.title}</h3>
              <p className="text-xs text-slate-500 font-bold">{deanData.school_name} ({deanData.total_departments} Departments)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b text-slate-700 font-extrabold uppercase">
                <tr>
                  <th className="p-3.5">Program</th>
                  <th className="p-3.5">Students</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Pass Rate</th>
                  <th className="p-3.5">CO Attainment</th>
                  <th className="p-3.5">Placement PRS</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-900">
                {deanData.program_comparisons.map((p) => (
                  <tr key={p.program_code} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold font-mono text-indigo-600">{p.program_code} - {p.name}</td>
                    <td className="p-3.5">{p.students}</td>
                    <td className="p-3.5 font-mono">{p.attendance}%</td>
                    <td className="p-3.5 font-mono text-emerald-600">{p.pass_rate}%</td>
                    <td className="p-3.5 font-mono text-blue-600">{p.co_attainment}%</td>
                    <td className="p-3.5 font-mono text-purple-600">{p.prs_avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Placement Cell */}
      {activeTab === "placement" && placementData && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Placement Cell Recruiter Candidate Shortlist</h3>
              <p className="text-xs text-slate-500 font-bold">Total Eligible: {placementData.total_eligible} | Product Ready: {placementData.product_ready_count}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b text-slate-700 font-extrabold uppercase">
                <tr>
                  <th className="p-3.5">Candidate Name</th>
                  <th className="p-3.5">Enrollment No</th>
                  <th className="p-3.5">Program</th>
                  <th className="p-3.5">PRS Score</th>
                  <th className="p-3.5">Technical</th>
                  <th className="p-3.5">Coding</th>
                  <th className="p-3.5">Readiness Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-slate-900">
                {placementData.top_candidate_shortlist.map((c) => (
                  <tr key={c.student_id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold">{c.student_name}</td>
                    <td className="p-3.5 font-mono">{c.enrollment_no}</td>
                    <td className="p-3.5 font-mono text-indigo-600">{c.program_code}</td>
                    <td className="p-3.5 font-mono text-blue-600 font-bold">{c.prs_score}</td>
                    <td className="p-3.5 font-mono">{c.technical}%</td>
                    <td className="p-3.5 font-mono">{c.coding}%</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">
                        {c.readiness_tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: NBA / NAAC Evidence Center */}
      {activeTab === "accreditation" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NBA Report Generator Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-indigo-600" /> NBA Accreditation Report Generator
              </h3>
              <p className="text-xs text-slate-600">Generates Tier-1 NBA Criterion 3 & 4 documentation automatically.</p>
              <button
                onClick={handleGenerateNBA}
                disabled={isGeneratingNba}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-md"
              >
                {isGeneratingNba ? "Generating..." : "Generate NBA PDF Report"}
              </button>

              {nbaResult && (
                <div className="bg-slate-50 p-4 rounded-2xl border text-xs space-y-2">
                  <div className="font-bold text-indigo-900">{nbaResult.nba_tier}</div>
                  <div className="font-mono text-slate-600">Package: {nbaResult.evidence_file_package}</div>
                </div>
              )}
            </div>

            {/* NAAC Evidence Bundle Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> NAAC A++ Grade Evidence Bundle
              </h3>
              <p className="text-xs text-slate-600">Collects teaching-learning and evaluation audit files for NAAC inspection.</p>
              <button
                onClick={handleGenerateNAAC}
                disabled={isGeneratingNaac}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
              >
                {isGeneratingNaac ? "Building Bundle..." : "Build NAAC Evidence Package"}
              </button>

              {naacResult && (
                <div className="bg-slate-50 p-4 rounded-2xl border text-xs space-y-2">
                  <div className="font-bold text-emerald-900">{naacResult.evidence_title}</div>
                  <div className="font-mono text-slate-600">Generated: {naacResult.generated_at}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Automated Scheduler */}
      {activeTab === "scheduler" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" /> Automated Report Scheduler
            </h3>
            <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-3 py-1 rounded-full">
              CELERY + REDIS CRON ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            {[
              { name: "HOD Weekly Academic Audit", freq: "WEEKLY", role: "HOD", fmt: "PDF" },
              { name: "Dean Monthly Cross-Dept Audit", freq: "MONTHLY", role: "DEAN", fmt: "EXCEL" },
              { name: "Placement Cell Candidate Shortlist", freq: "WEEKLY", role: "PLACEMENT", fmt: "EXCEL" },
            ].map((sch, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{sch.name}</div>
                  <span className="text-[10px] font-bold text-slate-400">Recipient: {sch.role} • Frequency: {sch.freq}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  {sch.fmt} ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
