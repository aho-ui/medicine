"use client";
import { Users } from "lucide-react";
import { roleStyles, type Role } from "@/lib/styles";

// Placeholder data - replace with real data later
const stats = {
  totalUsers: 24,
  activeUsers: 18,
};

const roleBreakdown: { role: Role; label: string; count: number; percent: number }[] = [
  { role: "ADMIN", label: "Admins", count: 4, percent: 17 },
  { role: "MANUFACTURER", label: "Manufacturers", count: 6, percent: 25 },
  { role: "DISTRIBUTOR", label: "Distributors", count: 8, percent: 33 },
  { role: "PHARMACY", label: "Pharmacies", count: 6, percent: 25 },
];

const usersData: { username: string; email: string; role: Role; org: string }[] = [
  { username: "john_admin", email: "john@example.com", role: "ADMIN", org: "PharmaCorp" },
  { username: "sarah_mfg", email: "sarah@factory.com", role: "MANUFACTURER", org: "MedFactory Inc" },
  { username: "mike_dist", email: "mike@logistics.com", role: "DISTRIBUTOR", org: "FastMed Logistics" },
  { username: "rx_pharmacy", email: "rx@pharmacy.com", role: "PHARMACY", org: "City Pharmacy" },
];

// Card view - shows on dashboard
export function UsersCard() {
  return (
    <div className="space-y-3 h-full">
      {/* Stats */}
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalUsers}</div>
          <div className="text-xs text-slate-500">Total Users</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">{stats.activeUsers}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
      </div>

      {/* Role breakdown */}
      <div className="space-y-2">
        {roleBreakdown.map((item) => (
          <div key={item.role}>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span className={roleStyles[item.role].text}>{item.count}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className={`${roleStyles[item.role].bg} h-1.5 rounded-full`}
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expanded view - shows in modal
export function UsersExpanded() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search users..."
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors">
          [+ ADD]
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cyan-400 border-b border-slate-700">
              <th className="pb-3">USER</th>
              <th className="pb-3">EMAIL</th>
              <th className="pb-3">ROLE</th>
              <th className="pb-3">ORGANIZATION</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {usersData.map((user) => (
              <tr key={user.username} className="border-b border-slate-800 hover:bg-cyan-500/5">
                <td className="py-3">{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={roleStyles[user.role].text}>[{user.role}]</span>
                </td>
                <td>{user.org}</td>
                <td className="text-cyan-400 cursor-pointer">[edit]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Export config for page.tsx
export const usersConfig = {
  id: "users",
  title: "USERS",
  icon: Users,
};
