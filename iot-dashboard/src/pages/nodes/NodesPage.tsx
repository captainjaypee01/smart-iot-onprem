// src/pages/nodes/NodesPage.tsx
// Nodes listing page — search, node type filter, status filter, paginated table, auto-refresh toggle

import { useNodes } from "@/hooks/useNodes";
import NodesTable from "@/components/shared/NodesTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_LABEL, NODE_STRINGS, UI_STRINGS } from "@/constants";
import type { NodeStatus } from "@/types/nodes";

// ─── Filter options ───────────────────────────────────────────────
const NODE_TYPE_OPTIONS = Object.entries(NODE_TYPE_LABEL) as [string, string][];

const STATUS_OPTIONS: { value: NodeStatus; label: string }[] = [
  { value: "online", label: NODE_STRINGS.STATUS_ONLINE },
  { value: "offline", label: NODE_STRINGS.STATUS_OFFLINE },
  { value: "warning", label: NODE_STRINGS.STATUS_WARNING },
  { value: "error", label: NODE_STRINGS.STATUS_ERROR },
];

// ─── Page ─────────────────────────────────────────────────────────
const NodesPage = () => {
  const {
    nodes,
    meta,
    page,
    setPage,
    search,
    setSearch,
    nodeType,
    setNodeType,
    status,
    setStatus,
    loading,
    autoRefresh,
    setAutoRefresh,
    refresh,
  } = useNodes();

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {NODE_STRINGS.TITLE}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All registered IoT nodes and their current status.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={NODE_STRINGS.SEARCH_PLACEHOLDER}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Node type filter */}
        <Select
          value={nodeType || "__all__"}
          onValueChange={(v) => setNodeType(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{UI_STRINGS.ALL} Types</SelectItem>
            {NODE_TYPE_OPTIONS.map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={status || "__all__"}
          onValueChange={(v) => setStatus(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{UI_STRINGS.ALL} Statuses</SelectItem>
            {STATUS_OPTIONS.map(({ value: val, label }) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Auto-refresh toggle */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            autoRefresh
              ? "border-green-500 text-green-600 hover:text-green-700 dark:border-green-600 dark:text-green-500"
              : "text-muted-foreground"
          )}
          onClick={() => setAutoRefresh(!autoRefresh)}
          aria-label={autoRefresh ? "Pause auto-refresh" : "Enable auto-refresh"}
        >
          {autoRefresh ? (
            <RefreshCw className="h-4 w-4 animate-spin [animation-duration:3s]" />
          ) : (
            <PauseCircle className="h-4 w-4" />
          )}
          {autoRefresh ? "Live" : "Paused"}
        </Button>

        {/* Manual refresh — always available */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh now"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          {UI_STRINGS.REFRESH}
        </Button>
      </div>

      {/* Table */}
      <NodesTable
        nodes={nodes}
        total={meta?.total ?? 0}
        currentPage={meta?.current_page ?? page}
        lastPage={meta?.last_page ?? 1}
        isLoading={loading}
        onPageChange={setPage}
      />
    </div>
  );
};

export default NodesPage;