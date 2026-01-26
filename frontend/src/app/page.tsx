"use client";
import { useState } from "react";
import { Maximize2, X, RefreshCw } from "lucide-react";
import { useStatus } from "@/hooks/useStatus";
import { statusStyles } from "@/lib/styles";
import { type VerificationResult } from "@/lib/api";

import { VerifyCard, VerifyExpanded, verifyConfig } from "@/components/verify";
import { LotsCard, LotsExpanded, lotsConfig } from "@/components/lots";
import { DistributionCard, DistributionExpanded, distributionConfig } from "@/components/distribution";
import { RegisterCard, RegisterExpanded, registerConfig } from "@/components/register";
import { UsersCard, UsersExpanded, usersConfig } from "@/components/users";
import { AuditCard, AuditExpanded, auditConfig } from "@/components/audit";

// Card configuration - combines all component configs
const cards = [
  { ...verifyConfig, content: VerifyCard, expanded: VerifyExpanded },
  { ...lotsConfig, content: LotsCard, expanded: LotsExpanded },
  { ...distributionConfig, content: DistributionCard, expanded: DistributionExpanded },
  { ...registerConfig, content: RegisterCard, expanded: RegisterExpanded },
  { ...usersConfig, content: UsersCard, expanded: UsersExpanded },
  { ...auditConfig, content: AuditCard, expanded: AuditExpanded },
];

export default function DashboardPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { system, blockchain, lastSyncLabel, isRefreshing, refresh } = useStatus();

  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [verifyImageUrl, setVerifyImageUrl] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const activeCard = cards.find((c) => c.id === expandedCard);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-slate-900 font-bold text-sm">
              ℞
            </div>
            <h1 className="text-lg font-semibold tracking-wide">
              MedVerify<span className="text-cyan-400">Chain</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">
              Role: <span className="text-cyan-400">ADMIN</span>
            </span>
            <button className="text-slate-500 hover:text-cyan-400 transition-colors">
              [logout]
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Status Bar */}
        <div className="mb-6 text-sm text-slate-500 flex gap-6 items-center">
          <span>
            System:{" "}
            <span className={statusStyles[isRefreshing ? "checking" : system].text}>
              ● {statusStyles[isRefreshing ? "checking" : system].label}
            </span>
          </span>
          <span>
            Blockchain:{" "}
            <span className={statusStyles[isRefreshing ? "checking" : blockchain].text}>
              ● {statusStyles[isRefreshing ? "checking" : blockchain].label}
            </span>
          </span>
          <span>
            Last sync: <span className="text-slate-400">{lastSyncLabel}</span>
          </span>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Cards Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${
            expandedCard ? "opacity-20 pointer-events-none" : ""
          }`}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            const Content = card.content;
            return (
              <div
                key={card.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-500/30"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-cyan-400" />
                    <h2 className="text-sm font-medium text-slate-200">{card.title}</h2>
                  </div>
                  <button
                    onClick={() => setExpandedCard(card.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-4 h-64 overflow-y-auto">
                  <Content />
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Card Overlay */}
        {expandedCard && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            onClick={() => setExpandedCard(null)}
          />
        )}

        {/* Expanded Card */}
        {expandedCard && activeCard && (
          <div className="fixed inset-4 md:inset-12 lg:inset-20 bg-slate-900 border border-slate-700 rounded-2xl z-50 overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/10">
            {/* Expanded Header */}
            <div className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <activeCard.icon size={24} className="text-cyan-400" />
                <h2 className="text-xl font-medium text-cyan-400">{activeCard.title}</h2>
              </div>
              <button
                onClick={() => setExpandedCard(null)}
                className="text-slate-500 hover:text-cyan-400 transition-colors w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Expanded Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeCard.id === "verify" ? (
                <VerifyExpanded
                  result={verifyResult}
                  setResult={setVerifyResult}
                  imageUrl={verifyImageUrl}
                  setImageUrl={setVerifyImageUrl}
                  error={verifyError}
                  setError={setVerifyError}
                />
              ) : (
                <activeCard.expanded />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-2 text-xs text-slate-600">
              <span>Press ESC to close</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
