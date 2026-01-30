"use client";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { logTypeStyles, type LogType } from "@/lib/styles";
import { getAuditLogs, type AuditLog, API_URL } from "@/lib/api";

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function AuditCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    getAuditLogs().then(setLogs).catch(() => {});
  }, [refreshKey]);

  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp).toDateString();
    return logDate === new Date().toDateString();
  }).length;

  return (
    <div className="space-y-3 h-full">
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{logs.length}</div>
          <div className="text-xs text-slate-500">Total Logs</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-300">{todayLogs}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        {logs.slice(0, 4).map((log, i) => {
          const style = logTypeStyles[log.action as LogType] || { text: "text-slate-400" };
          return (
            <div key={i} className="p-2 bg-slate-800/30 rounded flex items-center gap-2">
              <span className={style.text}>[{log.action}]</span>
              <span className="text-slate-400 truncate">{log.user} - {log.task}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AuditExpanded({ refreshKey = 0 }: { refreshKey?: number }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState("All Actions");

  useEffect(() => {
    getAuditLogs().then(setLogs).catch(() => {});
  }, [refreshKey]);

  const filteredLogs = filter === "All Actions"
    ? logs
    : logs.filter((log) => log.action === filter.toUpperCase());

  const handleExport = () => {
    window.open(`${API_URL}/audit/export/`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option>All Actions</option>
            <option>Create</option>
            <option>Verify</option>
            <option>Distribute</option>
          </select>
        </div>
        <button
          onClick={handleExport}
          className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors"
        >
          [EXPORT]
        </button>
      </div>
      <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
        {filteredLogs.map((log, i) => {
          const style = logTypeStyles[log.action as LogType] || { text: "text-slate-400" };
          return (
            <div key={i} className="bg-slate-800/30 rounded-lg p-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
              <div>
                <span className={style.text}>[{log.action}]</span>
                <span className="text-slate-600 mx-2">•</span>
                <span className="text-slate-300">{log.user || "system"}</span>
                <span className="text-slate-600 mx-2">•</span>
                <span className="text-slate-400">{log.task}</span>
              </div>
              <span className="text-slate-500">{timeAgo(log.timestamp)}</span>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-slate-500 text-center py-4">No logs found</div>
        )}
      </div>
    </div>
  );
}

export const auditConfig = {
  id: "audit",
  title: "AUDIT",
  icon: FileText,
};
