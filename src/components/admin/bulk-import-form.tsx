"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, X, AlertCircle, Download } from "lucide-react";

interface MemberRow {
  full_name: string;
  email: string;
  username: string;
}

interface ImportResult {
  email: string;
  full_name: string;
  success: boolean;
  error?: string;
}

export function BulkImportForm() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<MemberRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [done, setDone] = useState(false);

  function parseCSV(text: string) {
    setParseError("");
    setResults([]);
    setDone(false);
    const lines = text
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    if (lines.length === 0) {
      setParsed([]);
      return;
    }

    // Detect if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("email") ||
      firstLine.includes("name") ||
      firstLine.includes("username");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: MemberRow[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, i) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) {
        errors.push(
          `Row ${i + 1}: expected 3 columns (full_name, email, username), got ${cols.length}`,
        );
        return;
      }
      const [full_name, email, username] = cols;
      if (!email.includes("@")) {
        errors.push(`Row ${i + 1}: invalid email "${email}"`);
        return;
      }
      rows.push({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase().replace(/\s/g, ""),
      });
    });

    if (errors.length > 0) {
      setParseError(errors.join("\n"));
    }
    setParsed(rows);
  }

  function handleTextChange(text: string) {
    setCsvText(text);
    parseCSV(text);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (parsed.length === 0) return;
    setImporting(true);
    setResults([]);
    setDone(false);

    const res = await fetch("/api/admin/bulk-import-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ members: parsed }),
    });

    const data = await res.json();
    setResults(data.results ?? []);
    setDone(true);
    setImporting(false);
    router.refresh();
  }

  function downloadTemplate() {
    const csv =
      "full_name,email,username\nJane Smith,jane@example.com,janesmith\nJohn Doe,john@example.com,johndoe";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-template.csv";
    a.click();
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-4">
      {/* Template download */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-700">CSV Format</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Columns:{" "}
            <code className="bg-gray-200 px-1 rounded">
              full_name, email, username
            </code>
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Download size={13} />
          Template
        </button>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Upload CSV File
        </label>
        <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <Upload size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            Click to upload .csv file
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Or paste */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Or Paste CSV Data
        </label>
        <textarea
          value={csvText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={
            "full_name,email,username\nJane Smith,jane@example.com,janesmith"
          }
          rows={6}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-700">Parse errors</p>
          </div>
          <pre className="text-xs text-red-600 whitespace-pre-wrap">
            {parseError}
          </pre>
        </div>
      )}

      {/* Preview */}
      {parsed.length > 0 && !done && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600">
              Preview — {parsed.length} member{parsed.length > 1 ? "s" : ""}{" "}
              ready to import
            </p>
            <p className="text-xs text-gray-400">
              Default password: DiscGolf2026!
            </p>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {parsed.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {m.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {m.full_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {m.email} · @{m.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {done && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {successCount > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
                <Check size={14} /> {successCount} imported
              </div>
            )}
            {failCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-lg">
                <X size={14} /> {failCount} failed
              </div>
            )}
          </div>
          {failCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl divide-y divide-red-100 overflow-hidden">
              {results
                .filter((r) => !r.success)
                .map((r, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-xs font-semibold text-red-700">
                      {r.email}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">{r.error}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Import button */}
      {!done && (
        <button
          onClick={handleImport}
          disabled={importing || parsed.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          <Upload size={15} />
          {importing
            ? `Importing... (this may take a moment)`
            : `Import ${parsed.length > 0 ? parsed.length : ""} Members`}
        </button>
      )}

      {done && successCount > 0 && (
        <button
          onClick={() => {
            setCsvText("");
            setParsed([]);
            setResults([]);
            setDone(false);
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
        >
          Import more members
        </button>
      )}
    </div>
  );
}
