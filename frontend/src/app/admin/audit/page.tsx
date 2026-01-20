export default function AuditPage() {
  // TODO: fetch from API
  const logs = [
    { id: 1, action: "LOT_CREATED", user: "mfg@example.com", timestamp: "2025-01-15 10:00" },
    { id: 2, action: "VERIFICATION", user: "dist@example.com", timestamp: "2025-01-15 11:30" },
    { id: 3, action: "DISTRIBUTION", user: "dist@example.com", timestamp: "2025-01-15 14:00" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border p-2">Action</th>
            <th className="border p-2">User</th>
            <th className="border p-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="border p-2">{log.action}</td>
              <td className="border p-2">{log.user}</td>
              <td className="border p-2">{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
