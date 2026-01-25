"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";

interface AuditLog {
  action: string;
  user: string;
  details: string;
  timestamp: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/audit/`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <a
          href={`${API_URL}/audit/export/`}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
        >
          Export CSV
        </a>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border p-2">Action</th>
            <th className="border p-2">User</th>
            <th className="border p-2">Details</th>
            <th className="border p-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              <td className="border p-2">{log.action}</td>
              <td className="border p-2">{log.user}</td>
              <td className="border p-2">{log.details}</td>
              <td className="border p-2">{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
