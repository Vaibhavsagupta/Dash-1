"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  QrCode,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  BookOpen,
  ShieldCheck,
  Calendar,
  Search,
  Activity,
  Flame,
  Bell,
  RefreshCw,
  Zap,
  ChevronRight,
  TrendingDown
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

interface ActiveSession {
  session_id: string;
  qr_token: string;
  course_code: string;
  course_name: string;
  topic_name: string;
  faculty_name: string;
  batch_year: number;
  semester: number;
  expires_in_seconds: number;
}

interface StudentRiskProfile {
  student_id: string;
  student_name: string;
  enrollment_no: string;
  program_code: string;
  current_semester: number;
  total_lectures: number;
  attended_lectures: number;
  percentage: number;
  risk_score: number;
  risk_level: string;
  missed_topics: Array<{
    course_code: string;
    topic_name: string;
    unit_number: number;
    date: string;
  }>;
  replay_timeline: Array<{
    date: string;
    event_type: string;
    title: string;
    topic_name: string;
    unit_number: number;
    impact_summary: string;
  }>;
}

interface AlertItem {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_no: string;
  alert_type: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

interface HeatmapData {
  topic_heatmaps: Array<{
    topic_name: string;
    unit_number: number;
    total_students: number;
    attended_students: number;
    percentage: number;
  }>;
  student_calendar_heatmaps: Array<{
    date: string;
    present_count: number;
    absent_count: number;
  }>;
}

export default function AttendanceIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"session" | "risk" | "heatmaps" | "alerts">("session");

  // Session Launch State
  const [selectedProgram, setSelectedProgram] = useState<string>("AI");
  const [selectedSemester, setSelectedSemester] = useState<number>(7);
  const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [topicsList, setTopicsList] = useState<TopicOption[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedBatchYear, setSelectedBatchYear] = useState<number>(2023);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [launching, setLaunching] = useState<boolean>(false);
  const [checkInsFeed, setCheckInsFeed] = useState<Array<{ name: string; time: string; status: string }>>([]);

  // Student Risk State
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>("");
  const [studentRiskProfile, setStudentRiskProfile] = useState<StudentRiskProfile | null>(null);
  const [searchingStudent, setSearchingStudent] = useState<boolean>(false);

  // Heatmaps & Alerts State
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [alertsList, setAlertsList] = useState<AlertItem[]>([]);

  useEffect(() => {
    fetchCourses(selectedProgram, selectedSemester);
  }, [selectedProgram, selectedSemester]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSyllabusTopics(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (activeTab === "heatmaps") fetchHeatmaps();
    if (activeTab === "alerts") fetchAlerts();
  }, [activeTab]);

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

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setLaunching(true);
    try {
      // Get first faculty
      const fRes = await fetch(`${API_BASE_URL}/faculty`);
      const fList = await fRes.json();
      const facultyId = fList.length > 0 ? fList[0].id : "FAC_DEFAULT";

      const res = await fetch(`${API_BASE_URL}/attendance/start-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: facultyId,
          course_id: selectedCourseId,
          batch_year: selectedBatchYear,
          semester: selectedSemester,
          topic_id: selectedTopicId || null,
          title: "Topic-Wise Live Lecture"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActiveSession(data);
        setCheckInsFeed([]);
      }
    } catch (err) {
      console.error("Error starting lecture session:", err);
    } finally {
      setLaunching(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeSession.session_id })
      });
      if (res.ok) {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("Error ending session:", err);
    }
  };

  const handleStudentSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchStudentQuery) return;

    setSearchingStudent(true);
    try {
      const sRes = await fetch(`${API_BASE_URL}/students/search?q=${searchStudentQuery}`);
      const sList = await sRes.json();
      if (sList.length > 0) {
        const stId = sList[0].id;
        const pRes = await fetch(`${API_BASE_URL}/attendance/student/${stId}`);
        const pData = await pRes.json();
        setStudentRiskProfile(pData);
      }
    } catch (err) {
      console.error("Error searching student risk profile:", err);
    } finally {
      setSearchingStudent(false);
    }
  };

  const fetchHeatmaps = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/heatmaps`);
      if (res.ok) {
        const data = await res.json();
        setHeatmapData(data);
      }
    } catch (err) {
      console.error("Error fetching heatmaps:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlertsList(data);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1.5">
                <Sparkles size={13} /> Topic-Wise Attendance Engine
              </span>
              <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full border border-teal-400/20 flex items-center gap-1">
                <ShieldCheck size={13} /> Proxy Detection Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Attendance Intelligence Engine (AIE)
            </h1>
            <p className="text-emerald-100 max-w-2xl text-sm">
              Attendance linked directly to discrete syllabus topics (Unit → Topic → CO). Features Live QR Studio, AI Risk Scores, Missed Topic tracking, and Academic Replay Timelines.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "session", label: "Live QR Studio & Session", icon: QrCode },
          { id: "risk", label: "Student Risk & Replay Timeline", icon: Activity },
          { id: "heatmaps", label: "Topic & Calendar Heatmaps", icon: Flame },
          { id: "alerts", label: "Parent Alerts & Proxy Flags", icon: Bell },
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

      {/* Tab 1: Live QR Studio & Session Launch */}
      {activeTab === "session" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Zap size={18} className="text-emerald-600" /> Launch Live Lecture Session
            </h3>

            <form onSubmit={handleStartSession} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Specialization Program</label>
                <div className="grid grid-cols-3 gap-2">
                  {["AI", "CSF", "FSD"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedProgram(p)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        selectedProgram === p
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block mb-1 text-slate-500">Target Syllabus Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={launching}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {launching ? "Generating Expiring QR..." : "Launch QR Studio Session"}
                </button>
              </div>
            </form>
          </div>

          {/* QR Studio Display Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between space-y-6">
            {activeSession ? (
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="text-left">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      LIVE SESSION ACTIVE
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{activeSession.course_name}</h3>
                    <p className="text-xs text-slate-500 font-bold">{activeSession.topic_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400">QR Expiry Timer</div>
                    <div className="text-lg font-black text-emerald-600 font-mono">09:58</div>
                  </div>
                </div>

                {/* Animated QR Code Graphic Box */}
                <div className="w-56 h-56 mx-auto bg-slate-900 rounded-3xl p-4 shadow-xl border-4 border-emerald-500 flex flex-col items-center justify-center space-y-2 text-white">
                  <QrCode size={110} className="text-emerald-400 animate-pulse" />
                  <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400">
                    {activeSession.qr_token}
                  </span>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleEndSession}
                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-all shadow-md"
                  >
                    End Session & Calculate Absentees
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  <QrCode size={32} />
                </div>
                <h4 className="text-base font-extrabold text-slate-800">QR Studio Standby</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select specialization, course, and discrete topic on the left to generate an expiring live QR code for student check-ins.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Student Risk & Replay Timeline */}
      {activeTab === "risk" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
            <form onSubmit={handleStudentSearchSubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="Search Student Name or Enrollment No (e.g. Aman / 23BTA3ARI10038)..."
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
              >
                Analyze Risk & Replay Timeline
              </button>
            </form>
          </div>

          {studentRiskProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Profile Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">{studentRiskProfile.student_name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{studentRiskProfile.enrollment_no}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    studentRiskProfile.risk_level === "LOW"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {studentRiskProfile.risk_level} RISK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-2xl font-black text-slate-900">{studentRiskProfile.percentage}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Attendance</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-2xl font-black text-emerald-600">{studentRiskProfile.risk_score}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">AI Risk Score</div>
                  </div>
                </div>

                {/* Missed Topics List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-amber-600" /> Missed Syllabus Topics ({studentRiskProfile.missed_topics.length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {studentRiskProfile.missed_topics.map((mt, idx) => (
                      <div key={idx} className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-amber-900">{mt.course_code}</span> - <span className="font-bold text-slate-800">{mt.topic_name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Unit {mt.unit_number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Academic Replay Timeline */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" /> Academic Replay Timeline
                </h3>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {studentRiskProfile.replay_timeline.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start pl-6 relative">
                      <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                        item.event_type === "ABSENT" ? "bg-red-500" : "bg-emerald-500"
                      }`} />
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-900">{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">{item.topic_name}</p>
                        <p className="text-[11px] text-slate-400">{item.impact_summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Heatmaps */}
      {activeTab === "heatmaps" && heatmapData && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Flame size={18} className="text-orange-600" /> Topic Attendance Heatmap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heatmapData.topic_heatmaps.map((th, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase">Unit {th.unit_number}</span>
                    <span className="text-xs font-black text-slate-900">{th.percentage}%</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{th.topic_name}</h4>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        th.percentage > 85 ? "bg-emerald-500" : th.percentage > 70 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${th.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Parent Alerts */}
      {activeTab === "alerts" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Bell size={18} className="text-red-600" /> Automated Parent & Warning Alerts ({alertsList.length})
          </h3>
          <div className="space-y-3">
            {alertsList.map((a) => (
              <div key={a.id} className="bg-red-50/60 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {a.student_name} (<span className="font-mono">{a.enrollment_no}</span>)
                    </div>
                    <p className="text-xs text-red-950 font-medium">{a.message}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{a.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
