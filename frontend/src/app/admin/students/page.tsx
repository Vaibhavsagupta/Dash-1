"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  X,
  ShieldCheck,
  User,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  enrollment_no: string;
  scholar_no?: string;
  full_name: string;
  gender?: string;
  email?: string;
  mobile?: string;
  parent_name?: string;
  parent_mobile?: string;
  program_code: string;
  batch_year: number;
  current_semester: number;
  status: string;
}

interface AcademicHistoryItem {
  session_name: string;
  semester: number;
  program_code: string;
  batch_year: number;
  promoted: boolean;
}

interface EnrolledCourse {
  course_id: string;
  course_code: string;
  course_name: string;
  total_marks: number;
}

interface StudentProfile {
  student: Student;
  parent_name?: string;
  parent_mobile?: string;
  address?: string;
  blood_group?: string;
  academic_history: AcademicHistoryItem[];
  enrolled_courses: EnrolledCourse[];
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Profile Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, selectedProgram, selectedBatch, selectedSemester]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentProfile(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedProgram) params.append("program_code", selectedProgram);
      if (selectedBatch) params.append("batch_year", selectedBatch);
      if (selectedSemester) params.append("semester", selectedSemester);

      const res = await fetch(`${API_BASE_URL}/students/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async (id: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/students/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentProfile(data);
      }
    } catch (err) {
      console.error("Error fetching student profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={13} /> Real Academic Identity Layer
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Student Management & Profiles
          </h1>
          <p className="text-xs text-slate-500">
            Linked to Curriculum OS batches, programs, and semester mappings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center gap-3 px-4 shadow-sm">
            <Users size={20} className="text-indigo-600" />
            <div>
              <div className="text-xs font-bold text-slate-400">Total Enrolled</div>
              <div className="text-base font-black text-slate-900">{students.length} Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="md:col-span-1 relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, Enrollment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Program Filter */}
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Specializations (AI, CSF, FSD)</option>
            <option value="AI">Artificial Intelligence (AI)</option>
            <option value="CSF">Cyber Security & Forensics (CSF)</option>
            <option value="FSD">Full Stack Development (FSD)</option>
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Batches (2020-2023)</option>
            <option value="2023">Batch 2023</option>
            <option value="2022">Batch 2022</option>
            <option value="2021">Batch 2021</option>
            <option value="2020">Batch 2020</option>
          </select>

          {/* Semester Filter */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Semesters (1-8)</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <p className="text-slate-500 text-xs font-semibold">Loading Student Records...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Enrollment No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Specialization</th>
                  <th className="p-4">Batch</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{s.enrollment_no}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{s.email || "No email"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${
                        s.program_code === "AI"
                          ? "bg-purple-100 text-purple-700"
                          : s.program_code === "CSF"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {s.program_code}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">Batch {s.batch_year}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-bold">
                        Sem {s.current_semester}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedStudentId(s.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-1 ml-auto shadow-sm"
                      >
                        View Profile <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {studentProfile?.student.full_name || "Student Profile"}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Enrollment: {studentProfile?.student.enrollment_no}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedStudentId(null);
                    setStudentProfile(null);
                  }}
                  className="w-9 h-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {profileLoading ? (
                <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                  Fetching Complete Academic Profile...
                </div>
              ) : studentProfile ? (
                <div className="space-y-6">
                  {/* Basic Info & Parent Contact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider text-indigo-600">
                        Academic Details
                      </h4>
                      <div className="space-y-1 text-slate-700">
                        <div><span className="text-slate-400 font-medium">Program:</span> <span className="font-bold">{studentProfile.student.program_code} Specialization</span></div>
                        <div><span className="text-slate-400 font-medium">Batch:</span> <span className="font-bold">{studentProfile.student.batch_year}</span></div>
                        <div><span className="text-slate-400 font-medium">Current Semester:</span> <span className="font-bold">Semester {studentProfile.student.current_semester}</span></div>
                        <div><span className="text-slate-400 font-medium">Scholar No:</span> <span className="font-mono">{studentProfile.student.scholar_no || "N/A"}</span></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider text-purple-600">
                        Parent Contact Integration
                      </h4>
                      <div className="space-y-1 text-slate-700">
                        <div><span className="text-slate-400 font-medium">Parent Name:</span> <span className="font-bold">{studentProfile.parent_name || "N/A"}</span></div>
                        <div><span className="text-slate-400 font-medium">Parent Mobile:</span> <span className="font-mono text-purple-700 font-bold">{studentProfile.parent_mobile || "N/A"}</span></div>
                        <div><span className="text-slate-400 font-medium">Student Mobile:</span> <span className="font-mono">{studentProfile.student.mobile || "N/A"}</span></div>
                        <div><span className="text-slate-400 font-medium">Email:</span> <span className="font-mono">{studentProfile.student.email || "N/A"}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Promotion History */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" /> Academic Promotion Tracking
                    </h4>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      {studentProfile.academic_history.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                          <span className="font-bold text-slate-800">Semester {h.semester} ({h.session_name})</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            Promoted
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enrolled Courses */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-600" /> Enrolled Subjects (Semester {studentProfile.student.current_semester})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studentProfile.enrolled_courses.map((c) => (
                        <div key={c.course_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 font-mono">{c.course_code}</span>
                            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                              {c.total_marks} Marks
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900">{c.course_name}</h5>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
