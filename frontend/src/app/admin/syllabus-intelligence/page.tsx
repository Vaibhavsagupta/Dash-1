"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  BookOpen,
  Target,
  FileCheck,
  GitCompare,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  Share2,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Topic {
  id: string;
  unit_id: string;
  topic_order: number;
  topic_name: string;
  keywords?: string[];
  mapped_co_codes?: string[];
}

interface Unit {
  id: string;
  unit_number: number;
  unit_title: string;
  teaching_hours: number;
  display_order: number;
  topics: Topic[];
}

interface CourseOutcome {
  id: string;
  co_code: string;
  description: string;
}

interface RecommendedBook {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
}

interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string; // COURSE, UNIT, TOPIC, CO
  children?: KnowledgeGraphNode[];
}

interface SyllabusDetail {
  course_id: string;
  course_code: string;
  course_name: string;
  program_code: string;
  semester: number;
  active_syllabus_file?: {
    id: string;
    file_name: string;
    source_type: string;
    file_hash: string;
    upload_status: string;
    parser_confidence: number;
    created_at: string;
  };
  total_units: number;
  total_topics: number;
  total_cos: number;
  total_books: number;
  parser_confidence: number;
  units: Unit[];
  outcomes: CourseOutcome[];
  books: RecommendedBook[];
  knowledge_graph?: KnowledgeGraphNode;
}

interface CourseOption {
  id: string;
  course_code: string;
  course_name: string;
}

export default function SyllabusIntelligencePage() {
  const [selectedProgram, setSelectedProgram] = useState<string>("AI");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [syllabusDetail, setSyllabusDetail] = useState<SyllabusDetail | null>(null);
  
  // Upload State
  const [sourceType, setSourceType] = useState<"OFFICIAL" | "ADDITIONAL">("OFFICIAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{ status: string; message: string } | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"graph" | "units" | "outcomes" | "books" | "version">("graph");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCourses(selectedProgram, selectedSemester);
  }, [selectedProgram, selectedSemester]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSyllabusDetail(selectedCourseId);
    }
  }, [selectedCourseId]);

  const fetchCourses = async (prog: string, sem: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/curriculum/${prog}/${sem}`);
      if (res.ok) {
        const data = await res.json();
        const list: CourseOption[] = (data.subjects || []).map((s: any) => ({
          id: s.id,
          course_code: s.course_code,
          course_name: s.course_name
        }));
        setCoursesList(list);
        if (list.length > 0) {
          setSelectedCourseId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  const fetchSyllabusDetail = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/syllabus/course/${cId}`);
      if (res.ok) {
        const data: SyllabusDetail = await res.json();
        setSyllabusDetail(data);
      }
    } catch (err) {
      console.error("Error fetching syllabus detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCourseId) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("course_id", selectedCourseId);
    formData.append("source_type", sourceType);

    try {
      const res = await fetch(`${API_BASE_URL}/api/syllabus/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadResult({
          status: data.status,
          message: data.message || "File uploaded and parsed successfully."
        });
        fetchSyllabusDetail(selectedCourseId);
      } else {
        setUploadResult({
          status: "ERROR",
          message: data.detail || "Failed to parse syllabus file."
        });
      }
    } catch (err: any) {
      setUploadResult({
        status: "ERROR",
        message: err.message || "Network error during upload."
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/30 text-purple-200 text-xs font-semibold px-3 py-1 rounded-full border border-purple-400/20 backdrop-blur-sm flex items-center gap-1.5">
                <Sparkles size={13} /> Production Multi-Stage Syllabus Parser
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-1">
                <ShieldCheck size={13} /> Machine Readable
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Syllabus Intelligence Engine
            </h1>
            <p className="text-purple-200 max-w-2xl text-sm md:text-base">
              Automated PDF, DOCX, PPTX & Image syllabus parser. Extracts Units, Topics, Course Outcomes (COs), and Recommended Books into an interactive Knowledge Graph for AI Question Generators & Topic Mastery Engine.
            </p>
          </div>

          {syllabusDetail && (
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-2xl font-black text-white">{syllabusDetail.total_units}</div>
                <div className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Units</div>
              </div>
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-2xl font-black text-white">{syllabusDetail.total_topics}</div>
                <div className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Topics</div>
              </div>
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-2xl font-black text-emerald-400">{syllabusDetail.total_cos}</div>
                <div className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">COs</div>
              </div>
              <div className="text-center px-3">
                <div className="text-2xl font-black text-purple-300">{syllabusDetail.parser_confidence}%</div>
                <div className="text-[11px] font-medium text-purple-200 uppercase tracking-wider">Confidence</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selectors & Upload Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course Selector & Info */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" /> Select Target Course
          </h3>

          <div className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block mb-1.5 text-slate-500">Specialization Program</label>
              <div className="grid grid-cols-3 gap-2">
                {["AI", "CSF", "FSD"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedProgram(p)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedProgram === p
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-slate-500">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-slate-500">Target Course Subject</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>

          {syllabusDetail?.active_syllabus_file && (
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <span className="text-slate-400 font-medium block">Active Syllabus File</span>
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium">
                <FileText size={16} className="text-indigo-600 flex-shrink-0" />
                <span className="truncate font-mono text-[11px]">{syllabusDetail.active_syllabus_file.file_name}</span>
                <span className="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  {syllabusDetail.active_syllabus_file.source_type}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hybrid Drag and Drop Upload Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UploadCloud size={20} className="text-indigo-600" /> Hybrid Syllabus Upload Engine
              </h3>
              <p className="text-xs text-slate-500">
                Upload official syllabus or additional workshop/notes files (PDF, DOCX, PPTX, JPG).
              </p>
            </div>

            {/* Source Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSourceType("OFFICIAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sourceType === "OFFICIAL"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Official Master
              </button>
              <button
                type="button"
                onClick={() => setSourceType("ADDITIONAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sourceType === "ADDITIONAL"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Additional Content
              </button>
            </div>
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud size={24} />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedFile ? (
                    <span className="text-indigo-600 font-mono">{selectedFile.name}</span>
                  ) : (
                    "Click or Drag & Drop syllabus file here"
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Supports PDF, Word (.docx), PowerPoint (.pptx), Images (.png, .jpg)
                </p>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500 font-medium">
                Mode: <span className="font-bold text-slate-800">{sourceType} Syllabus</span>
              </div>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  !selectedFile || uploading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                }`}
              >
                {uploading ? "Parsing & Structuring..." : "Upload & Extract Knowledge Graph"}
              </button>
            </div>
          </form>

          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
                uploadResult.status === "SUCCESS"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : uploadResult.status === "DUPLICATE"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {uploadResult.status === "SUCCESS" ? (
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
              )}
              <span className="font-medium">{uploadResult.message}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Extracted Content Tabs */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <p className="text-slate-500 text-sm font-medium">Extracting Knowledge Graph & Units...</p>
        </div>
      ) : syllabusDetail ? (
        <div className="space-y-6">
          {/* Tabs Navbar */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            {[
              { id: "graph", label: "Knowledge Graph Tree", icon: Share2 },
              { id: "units", label: `Units & Topics (${syllabusDetail.total_units})`, icon: Layers },
              { id: "outcomes", label: `Course Outcomes (${syllabusDetail.total_cos})`, icon: Target },
              { id: "books", label: `Recommended Books (${syllabusDetail.total_books})`, icon: BookOpen },
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

          {/* Tab 1: Knowledge Graph Tree */}
          {activeTab === "graph" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Share2 size={18} className="text-indigo-600" /> Course Knowledge Graph Structure
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  Interactive Machine-Readable Curriculum Nodes
                </span>
              </div>

              {syllabusDetail.knowledge_graph && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 overflow-x-auto">
                  <KnowledgeTreeNode node={syllabusDetail.knowledge_graph} level={0} />
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Units & Topics */}
          {activeTab === "units" && (
            <div className="space-y-4">
              {syllabusDetail.units.map((unit) => (
                <div key={unit.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-600 text-white font-extrabold text-xs px-3 py-1 rounded-xl">
                        Unit {unit.unit_number}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{unit.unit_title}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock size={12} /> {unit.teaching_hours} Teaching Hours
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {unit.topics.map((t) => (
                      <div key={t.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">Topic #{t.topic_order}</span>
                          <div className="flex gap-1">
                            {t.mapped_co_codes?.map((co) => (
                              <span key={co} className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                                {co}
                              </span>
                            ))}
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{t.topic_name}</h4>
                        {t.keywords && t.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {t.keywords.map((kw, kIdx) => (
                              <span key={kIdx} className="bg-slate-200/60 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Course Outcomes */}
          {activeTab === "outcomes" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Target size={18} className="text-emerald-600" /> Extracted Course Outcomes (COs)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syllabusDetail.outcomes.map((co) => (
                  <div key={co.id} className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 flex gap-3">
                    <span className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl h-fit">
                      {co.co_code}
                    </span>
                    <p className="text-xs font-semibold text-emerald-950 leading-relaxed">
                      {co.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Recommended Books */}
          {activeTab === "books" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-purple-600" /> Recommended Textbooks & Reference Books
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syllabusDetail.books.map((b) => (
                  <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                    <p className="text-[11px] font-medium text-slate-600">Author: {b.author || "N/A"}</p>
                    {b.publisher && <p className="text-[10px] text-slate-400">Publisher: {b.publisher}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function KnowledgeTreeNode({ node, level }: { node: KnowledgeGraphNode; level: number }) {
  const [expanded, setExpanded] = useState<boolean>(true);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "COURSE": return "bg-indigo-600 text-white";
      case "UNIT": return "bg-purple-600 text-white";
      case "TOPIC": return "bg-slate-800 text-white";
      case "CO": return "bg-emerald-600 text-white";
      default: return "bg-slate-200 text-slate-800";
    }
  };

  return (
    <div className="space-y-2" style={{ marginLeft: `${level * 18}px` }}>
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-slate-200/50 transition-colors w-fit text-xs font-semibold text-slate-900"
      >
        {node.children && node.children.length > 0 ? (
          expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
        ) : (
          <span className="w-3.5" />
        )}
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getBadgeColor(node.type)}`}>
          {node.type}
        </span>
        <span className="font-bold">{node.label}</span>
      </div>

      {expanded && node.children && (
        <div className="space-y-1 border-l-2 border-slate-200/60 pl-2">
          {node.children.map((child) => (
            <KnowledgeTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
