"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Mail,
  Phone,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Faculty {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  mobile?: string;
  designation: string;
  department: string;
  status: string;
}

interface CourseOption {
  id: string;
  course_code: string;
  course_name: string;
}

interface AssignedCourse {
  id: string;
  course_code: string;
  course_name: string;
  batch_year: number;
  semester: number;
}

export default function FacultyManagementPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Faculty Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFaculty, setNewFaculty] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    mobile: "",
    designation: "Assistant Professor",
    department: "CSE"
  });

  // Assign Course Modal State
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [assignProg, setAssignProg] = useState<string>("AI");
  const [assignSem, setAssignSem] = useState<number>(7);
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [assignBatchYear, setAssignBatchYear] = useState<number>(2023);

  const [assignedCourses, setAssignedCourses] = useState<AssignedCourse[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFacultyList();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      fetchAvailableCourses(assignProg, assignSem);
      fetchFacultyAssignedCourses(selectedFaculty.id);
    }
  }, [selectedFaculty, assignProg, assignSem]);

  const fetchFacultyList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/faculty`);
      if (res.ok) {
        const data = await res.json();
        setFacultyList(data);
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async (prog: string, sem: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/curriculum/${prog}/${sem}`);
      if (res.ok) {
        const data = await res.json();
        const list = (data.subjects || []).map((s: any) => ({
          id: s.id,
          course_code: s.course_code,
          course_name: s.course_name
        }));
        setAvailableCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching available courses:", err);
    }
  };

  const fetchFacultyAssignedCourses = async (fId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/faculty/${fId}/courses`);
      if (res.ok) {
        const data = await res.json();
        setAssignedCourses(data);
      }
    } catch (err) {
      console.error("Error fetching assigned courses:", err);
    }
  };

  const handleAddFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaculty)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewFaculty({ employee_code: "", full_name: "", email: "", mobile: "", designation: "Assistant Professor", department: "CSE" });
        fetchFacultyList();
      }
    } catch (err) {
      console.error("Error adding faculty:", err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty || !selectedCourseId) return;

    setAssignMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/faculty/assign-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: selectedFaculty.id,
          course_id: selectedCourseId,
          batch_year: assignBatchYear,
          semester: assignSem,
          session_name: "2025-26"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAssignMsg(`Successfully assigned '${data.course_name}' to ${selectedFaculty.full_name}.`);
        fetchFacultyAssignedCourses(selectedFaculty.id);
      }
    } catch (err: any) {
      setAssignMsg(`Failed to assign course: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={13} /> Curriculum Mapping Engine
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Faculty Directory & Subject Assignment
          </h1>
          <p className="text-xs text-slate-500">
            Assign professors to Curriculum OS subjects, batches, and semesters.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-200"
        >
          <Plus size={16} /> Add New Faculty Member
        </button>
      </div>

      {/* Faculty Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          <p className="text-slate-500 text-xs font-semibold">Loading Faculty Directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facultyList.map((f) => (
            <div key={f.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md hover:shadow-lg transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-50 text-indigo-600 font-mono font-bold text-xs px-2.5 py-1 rounded-xl">
                    {f.employee_code}
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    {f.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold text-lg">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{f.full_name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{f.designation} • {f.department}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1 font-medium">
                  <div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> {f.email}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setSelectedFaculty(f)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <BookOpen size={14} /> Assign Curriculum Subject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Faculty Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap size={20} className="text-indigo-600" /> Add Faculty Member
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddFacultySubmit} className="space-y-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500">Employee Code</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC101"
                    value={newFaculty.employee_code}
                    onChange={(e) => setNewFaculty({ ...newFaculty, employee_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Singh"
                    value={newFaculty.full_name}
                    onChange={(e) => setNewFaculty({ ...newFaculty, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="teacher@sage.edu"
                    value={newFaculty.email}
                    onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-500">Designation</label>
                    <input
                      type="text"
                      value={newFaculty.designation}
                      onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-500">Department</label>
                    <input
                      type="text"
                      value={newFaculty.department}
                      onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                  >
                    Save & Create Faculty Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Assign Subject Modal */}
      <AnimatePresence>
        {selectedFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Assign Course Subject to {selectedFaculty.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedFaculty.employee_code} • {selectedFaculty.department}</p>
                </div>
                <button onClick={() => setSelectedFaculty(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 text-slate-500">Specialization</label>
                    <select
                      value={assignProg}
                      onChange={(e) => setAssignProg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="AI">AI</option>
                      <option value="CSF">CSF</option>
                      <option value="FSD">FSD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500">Semester</label>
                    <select
                      value={assignSem}
                      onChange={(e) => setAssignSem(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500">Batch Year</label>
                    <select
                      value={assignBatchYear}
                      onChange={(e) => setAssignBatchYear(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value={2023}>Batch 2023</option>
                      <option value={2022}>Batch 2022</option>
                      <option value={2021}>Batch 2021</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500">Target Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} - {c.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                {assignMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{assignMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                >
                  Confirm & Assign Subject
                </button>
              </form>

              {/* Already Assigned Subjects */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900">Current Subject Assignments</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {assignedCourses.map((ac) => (
                    <div key={ac.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-600">{ac.course_code}</span> - <span className="font-bold text-slate-800">{ac.course_name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                        Batch {ac.batch_year} • Sem {ac.semester}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
