"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"consumer" | "distributor" | "manufacturer" | "admin">("consumer");
  const { login } = useAuth();
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    login(selectedRole);
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleLogin} className="space-y-4 w-64">
        <h1 className="text-2xl font-bold">Login</h1>
        <div>
          <label className="block mb-1">Select Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as typeof selectedRole)}
            className="border w-full p-2 bg-gray-700 text-white"
          >
            <option value="consumer">Consumer</option>
            <option value="distributor">Distributor</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 w-full">
          Login
        </button>
      </form>
    </div>
  );
}
