"use client";
import { useState, useEffect, useCallback } from "react";
import { checkSystemHealth, checkBlockchainHealth } from "@/lib/api";

export type SystemStatus = "online" | "offline" | "checking";
export type BlockchainStatus = "connected" | "disconnected" | "checking";

interface StatusState {
  system: SystemStatus;
  blockchain: BlockchainStatus;
  blockNumber?: number;
  lastSync: Date | null;
  lastSyncLabel: string;
}

const POLL_INTERVAL = 30000; // 30 seconds

function getTimeAgo(date: Date | null): string {
  if (!date) return "never";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 120) return "1m ago";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 7200) return "1h ago";
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return "1d+ ago";
}

export function useStatus() {
  const [status, setStatus] = useState<StatusState>({
    system: "checking",
    blockchain: "checking",
    lastSync: null,
    lastSyncLabel: "never",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);

    // Check system health
    const systemOk = await checkSystemHealth();

    // Check blockchain health
    const blockchainResult = await checkBlockchainHealth();

    const now = new Date();

    setStatus({
      system: systemOk ? "online" : "offline",
      blockchain: blockchainResult.connected ? "connected" : "disconnected",
      blockNumber: blockchainResult.blockNumber,
      lastSync: now,
      lastSyncLabel: "just now",
    });

    setIsRefreshing(false);
  }, []);

  // Initial check and polling
  useEffect(() => {
    checkHealth();

    const interval = setInterval(checkHealth, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Update "time ago" label every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        lastSyncLabel: getTimeAgo(prev.lastSync),
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    isRefreshing,
    refresh: checkHealth,
  };
}
