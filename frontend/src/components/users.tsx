"use client";
import { Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { roleStyles, type Role } from "@/lib/styles";
import { getUsers, createUser, type User } from "@/lib/api";

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const role = user.role as Role;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-cyan-400">{user.username}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Email</div>
              <div className="text-slate-300 font-medium">{user.email}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Role</div>
                <div className={roleStyles[role]?.text || "text-slate-300"}>{user.role}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">User ID</div>
                <div className="text-slate-300">{user.id}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Company</div>
              <div className="text-slate-300">{user.company_name || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UsersCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, [refreshKey]);

  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleBreakdown = Object.entries(roleCounts).map(([role, count]) => ({
    role: role as Role,
    label: role.charAt(0) + role.slice(1).toLowerCase() + "s",
    count,
    percent: users.length > 0 ? Math.round((count / users.length) * 100) : 0,
  }));

  return (
    <div className="space-y-3 h-full">
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{users.length}</div>
          <div className="text-xs text-slate-500">Total Users</div>
        </div>
      </div>

      <div className="space-y-2">
        {roleBreakdown.map((item) => (
          <div key={item.role}>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{item.label}</span>
              <span className={roleStyles[item.role]?.text || "text-slate-300"}>{item.count}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className={`${roleStyles[item.role]?.bg || "bg-slate-500"} h-1.5 rounded-full`}
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-xs pt-2">
        {users.slice(0, 3).map((user) => {
          const role = user.role as Role;
          return (
            <div
              key={user.id}
              onClick={() => setSelected(user)}
              className="p-2 bg-slate-800/30 rounded flex justify-between hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <span className="text-slate-300">{user.username}</span>
              <span className={roleStyles[role]?.text || "text-slate-400"}>{user.role}</span>
            </div>
          );
        })}
        {users.length === 0 && (
          <div className="text-slate-500 text-center py-2">No users</div>
        )}
      </div>

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export function UsersExpanded({ refreshKey = 0 }: { refreshKey?: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "", company_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, [refreshKey]);

  const filtered = search
    ? users.filter((user) =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.company_name.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password || !form.role) {
      setError("Username, email, password, and role are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createUser(form);
      setSuccess(`User ${result.username} created successfully`);
      setForm({ username: "", email: "", password: "", role: "", company_name: "" });
      getUsers().then(setUsers).catch(() => {});
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg px-4 py-2 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); }}
          className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors text-sm"
        >
          {showForm ? "CANCEL" : "+ ADD USER"}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => { setForm({ ...form, username: e.target.value }); setError(null); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(null); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(null); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={form.role}
              onChange={(e) => { setForm({ ...form, role: e.target.value }); setError(null); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Select role...</option>
              <option value="MANUFACTURER">Manufacturer</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="CONSUMER">Consumer</option>
              <option value="ADMIN">Admin</option>
            </select>
            <input
              type="text"
              placeholder="Company name (optional)"
              value={form.company_name}
              onChange={(e) => { setForm({ ...form, company_name: e.target.value }); }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none col-span-2"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full border border-cyan-500 text-cyan-400 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            {loading ? "CREATING..." : "CREATE USER"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cyan-400 border-b border-slate-700">
              <th className="pb-3">USER</th>
              <th className="pb-3">EMAIL</th>
              <th className="pb-3">ROLE</th>
              <th className="pb-3">COMPANY</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {filtered.map((user) => {
              const role = user.role as Role;
              return (
                <tr
                  key={user.id}
                  onClick={() => setSelected(user)}
                  className="border-b border-slate-800 hover:bg-cyan-500/5 cursor-pointer"
                >
                  <td className="py-3">{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={roleStyles[role]?.text || "text-slate-300"}>[{user.role}]</span>
                  </td>
                  <td>{user.company_name || "-"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-slate-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export const usersConfig = {
  id: "users",
  title: "USERS",
  icon: Users,
};
