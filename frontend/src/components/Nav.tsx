"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Nav() {
  const { role, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!role) {
    return (
      <nav className="bg-gray-800 text-white p-4">
        <Link href="/login" className="hover:underline">Login</Link>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex gap-4 flex-wrap items-center">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/verify" className="hover:underline">Verify</Link>

        {(role === "manufacturer" || role === "distributor" || role === "admin") && (
          <Link href="/lots" className="hover:underline">Lots</Link>
        )}

        {(role === "manufacturer" || role === "admin") && (
          <Link href="/lots/register" className="hover:underline">Register Lot</Link>
        )}

        {(role === "manufacturer" || role === "distributor" || role === "admin") && (
          <Link href="/distribution" className="hover:underline">Distribution</Link>
        )}

        {role === "admin" && (
          <>
            <Link href="/admin/users" className="hover:underline">Users</Link>
            <Link href="/admin/audit" className="hover:underline">Audit</Link>
          </>
        )}

        <span className="ml-auto">Role: {role}</span>
        <button onClick={handleLogout} className="hover:underline">Logout</button>
      </div>
    </nav>
  );
}
