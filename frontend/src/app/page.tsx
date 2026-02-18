"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useStatus } from "@/hooks/useStatus";
import { statusStyles } from "@/lib/styles";
import { type VerificationResult } from "@/lib/api";
import { useAuth } from "@/lib/auth";

import { VerifyExpanded, verifyConfig } from "@/components/verify";
import { LotsExpanded, lotsConfig } from "@/components/lots";
import { DistributionExpanded, distributionConfig } from "@/components/distribution";
import { RegisterExpanded, registerConfig } from "@/components/register";
import { UsersExpanded, usersConfig } from "@/components/users";
import { AuditExpanded, auditConfig } from "@/components/audit";

interface TabConfig {
  id: string;
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  component: React.FC<any>;
  roles: string[];
}

const tabs: TabConfig[] = [
  { ...verifyConfig, component: VerifyExpanded, roles: ["ADMIN", "MANUFACTURER", "DISTRIBUTOR", "PHARMACY", "CONSUMER"] },
  { ...lotsConfig, component: LotsExpanded, roles: ["ADMIN", "MANUFACTURER", "DISTRIBUTOR"] },
  { ...distributionConfig, component: DistributionExpanded, roles: ["ADMIN", "DISTRIBUTOR"] },
  { ...registerConfig, component: RegisterExpanded, roles: ["ADMIN", "MANUFACTURER"] },
  { ...usersConfig, component: UsersExpanded, roles: ["ADMIN"] },
  { ...auditConfig, component: AuditExpanded, roles: ["ADMIN"] },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { system, blockchain, lastSyncLabel, isRefreshing, refresh } = useStatus();

  const visibleTabs = user
    ? tabs.filter((t) => t.roles.includes(user.role))
    : tabs.filter((t) => t.id === "verify");

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "verify");
  const [refreshKey, setRefreshKey] = useState(0);

  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [verifyImageUrl, setVerifyImageUrl] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const current = visibleTabs.find((t) => t.id === activeTab) || visibleTabs[0];

  return (
    <div className="flex h-[calc(100vh-65px)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-slate-800 bg-slate-950/50 flex flex-col shrink-0">
        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setRefreshKey((k) => k + 1);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon size={18} />
                {tab.title}
              </button>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="border-t border-slate-800 px-4 py-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">System</span>
            <span className={statusStyles[isRefreshing ? "checking" : system].text}>
              {statusStyles[isRefreshing ? "checking" : system].label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Blockchain</span>
            <span className={statusStyles[isRefreshing ? "checking" : blockchain].text}>
              {statusStyles[isRefreshing ? "checking" : blockchain].label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Synced</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{lastSyncLabel}</span>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {current && (
          current.id === "verify" ? (
            <VerifyExpanded
              result={verifyResult}
              setResult={setVerifyResult}
              imageUrl={verifyImageUrl}
              setImageUrl={setVerifyImageUrl}
              error={verifyError}
              setError={setVerifyError}
            />
          ) : (
            <current.component refreshKey={refreshKey} />
          )
        )}
      </main>
    </div>
  );
}
