"use client";

import React, { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Users,
  Layers,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

interface DuplicateItem {
  row: number;
  enrollment_no: string;
  name: string;
  reason: string;
}

interface FailedItem {
  row: number;
  error: string;
}

interface ImportSummary {
  total_rows: number;
  imported_count: number;
  duplicate_count: number;
  failed_count: number;
  duplicates: DuplicateItem[];
  failed_rows: FailedItem[];
}

export default function ImportCenterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE_URL}/students/import`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      } else {
        setErrorMsg(data.detail || "Failed to process student import.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!summary) return;
    const jsonStr = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student_import_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-400/20 flex items-center gap-1.5">
              <ShieldCheck size={13} /> Automated Student & Batch Resolver
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Bulk Excel Import Center
          </h1>
          <p className="text-indigo-200 max-w-2xl text-sm">
            Import 193 to 5000+ student records in seconds via Excel (.xlsx) or CSV. Auto-detects columns, derives Batch (e.g. 2023), Program (AI, CSF, FSD), and Current Semester (1-8), with duplicate detection.
          </p>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud size={22} className="text-indigo-600" /> Upload Student Roster File
            </h3>
            <p className="text-xs text-slate-500">
              Supports .xlsx, .xls, and .csv files. Required headers: Enrollment No, Student Name.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            <FileSpreadsheet size={15} className="text-emerald-600" /> Auto Column Detection Enabled
          </div>
        </div>

        <form onSubmit={handleImportSubmit} className="space-y-5">
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-3xl p-10 text-center transition-all bg-slate-50/50">
            <input
              type="file"
              id="excel-upload"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="excel-upload" className="cursor-pointer space-y-3 block">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud size={32} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-slate-800">
                  {selectedFile ? (
                    <span className="text-indigo-600 font-mono">{selectedFile.name}</span>
                  ) : (
                    "Click to Browse or Drag & Drop Excel Roster File"
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Auto-resolves enrollment codes like <span className="font-mono text-slate-600">23BTA3ARI10038</span> to Batch 2023, Program AI, Semester 7
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 font-medium">
              Supported columns: <span className="font-bold text-slate-700">Enrollment No, Name, Scholar No, Email, Mobile, Parent Mobile</span>
            </div>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className={`px-8 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                !selectedFile || uploading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              {uploading ? (
                <>Processing & Resolving Batches...</>
              ) : (
                <>Import Roster Now <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-3">
            <XCircle size={18} className="text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Summary Report Section */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-600" /> Import Summary Execution Report
            </h3>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
            >
              <Download size={14} /> Download Report (JSON)
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Layers size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{summary.total_rows}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rows</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">{summary.imported_count}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Successfully Imported</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600">{summary.duplicate_count}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicates Filtered</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
                <XCircle size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-red-600">{summary.failed_count}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Failed Rows</div>
              </div>
            </div>
          </div>

          {/* Duplicates Table */}
          {summary.duplicates && summary.duplicates.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-4">
              <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" /> Duplicates Detected & Isolated ({summary.duplicates.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Excel Row</th>
                      <th className="p-3">Enrollment No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Conflict Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {summary.duplicates.map((d, i) => (
                      <tr key={i} className="hover:bg-amber-50/50">
                        <td className="p-3 font-mono font-bold text-slate-500">Row #{d.row}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{d.enrollment_no}</td>
                        <td className="p-3 font-bold">{d.name}</td>
                        <td className="p-3 text-amber-700 font-semibold">{d.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
