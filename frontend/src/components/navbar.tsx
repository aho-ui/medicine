"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUsers, type User } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scanner", label: "Scanner", icon: QrCode },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading: authLoading, login, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  return (
    <header className="border-b border-slate-800 px-6 py-4">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-slate-900 font-bold text-sm">
              ℞
            </div>
            <h1 className="text-lg font-semibold tracking-wide">
              MedVerify<span className="text-cyan-400">Chain</span>
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4 text-sm">
          {authLoading ? (
            <span className="text-slate-500">Loading...</span>
          ) : user ? (
            <>
              <span className="text-slate-500">
                {user.username} <span className="text-cyan-400">[{user.role}]</span>
              </span>
              <button
                onClick={logout}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
              >
                [logout]
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-slate-500 hover:text-cyan-400 transition-colors"
              >
                Select User <ChevronDown size={14} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg py-1 min-w-48 z-50 max-h-64 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        login(u.id);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      <span>{u.username}</span>
                      <span className="text-slate-500 text-xs ml-2">[{u.role}]</span>
                    </button>
                  ))}
                  {users.length === 0 && (
                    <div className="px-4 py-2 text-slate-500">No users</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
