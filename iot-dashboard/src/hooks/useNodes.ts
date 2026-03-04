// src/hooks/useNodes.ts
// Data hook for the Nodes page — paginated list with search, node type, and status filters
// Includes auto-refresh on POLL_INTERVAL_NORMAL that can be paused/resumed by the consumer

import { useState, useEffect, useCallback } from "react";
import { getNodes } from "@/api/nodes";
import { mockGetNodes } from "@/mocks/handlers";
import { POLL_INTERVAL_NORMAL } from "@/constants";
import type { Node, NodeListResponse, NodeStatus } from "@/types/nodes";
import type { PaginatedResponse } from "@/types";
import { toast } from "sonner";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const NODES_PER_PAGE = 10;

// Unified fetch — adapts real API (object params) and mock (positional args) to the same return shape
const fetchNodes = async (
  page: number,
  search: string,
  nodeType: string,
  status: string
): Promise<NodeListResponse> => {
  if (USE_MOCK) {
    return mockGetNodes(page, NODES_PER_PAGE, search, nodeType, status);
  }
  return getNodes({
    page,
    per_page: NODES_PER_PAGE,
    search: search || undefined,
    node_type: nodeType || undefined,
    status: (status as NodeStatus | "") || undefined,
  });
};

// ─── useNodes ─────────────────────────────────────────────────────
export const useNodes = () => {
  const [data, setData] = useState<PaginatedResponse<Node> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const load = useCallback(async (p: number, q: string, type: string, s: string) => {
    setLoading(true);
    try {
      const res = await fetchNodes(p, q, type, s);
      setData(res);
      setError(null);
    } catch {
      setError("Failed to load nodes.");
      toast.error("Failed to load nodes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 and re-fetch whenever filters or search change
  useEffect(() => {
    setPage(1);
    load(1, search, nodeType, status);
  }, [search, nodeType, status]);

  // Fetch when page changes (without resetting to 1)
  useEffect(() => {
    load(page, search, nodeType, status);
  }, [page]);

  // Auto-refresh — only runs when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(
      () => load(page, search, nodeType, status),
      POLL_INTERVAL_NORMAL
    );
    return () => clearInterval(id);
  }, [autoRefresh, page, search, nodeType, status]);

  return {
    nodes: data?.data ?? [],
    meta: data?.meta,
    page,
    setPage,
    search,
    setSearch,
    nodeType,
    setNodeType,
    status,
    setStatus,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    refresh: () => load(page, search, nodeType, status),
  };
};