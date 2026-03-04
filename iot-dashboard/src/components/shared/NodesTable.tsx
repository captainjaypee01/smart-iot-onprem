// src/components/shared/NodesTable.tsx
// Reusable table component for displaying the IoT node list — props only, no API calls

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_TYPE_LABEL, NODE_STRINGS } from "@/constants";
import type { Node, NodeStatus } from "@/types/nodes";

// ─── Status display config ────────────────────────────────────────
const STATUS_CLASS: Record<NodeStatus, string> = {
  online: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  offline: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_DOT: Record<NodeStatus, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400 dark:bg-gray-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  online: NODE_STRINGS.STATUS_ONLINE,
  offline: NODE_STRINGS.STATUS_OFFLINE,
  warning: NODE_STRINGS.STATUS_WARNING,
  error: NODE_STRINGS.STATUS_ERROR,
};

// ─── Helpers ─────────────────────────────────────────────────────
const formatLastSeen = (iso: string): string => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3_600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3_600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
};

// Config is node-type-scoped — display the raw value when present, dash when the node
// type has no config variants (config will be an empty string in that case).
const formatConfig = (config: string): string => (config ? `Config ${config}` : "—");

// ─── Props ───────────────────────────────────────────────────────
interface NodesTableProps {
  nodes: Node[];
  total: number;
  currentPage: number;
  lastPage: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

// ─── Component ───────────────────────────────────────────────────
const SKELETON_ROWS = 10;
const PER_PAGE = 10;

const NodesTable = ({
  nodes,
  total,
  currentPage,
  lastPage,
  isLoading,
  onPageChange,
}: NodesTableProps) => {
  const start = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, total);

  return (
    <div className="flex flex-col gap-3">
      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[160px]">{NODE_STRINGS.COL_NODE_NAME}</TableHead>
              <TableHead>{NODE_STRINGS.COL_NODE_TYPE}</TableHead>
              <TableHead>Config</TableHead>
              <TableHead>{NODE_STRINGS.COL_LOCATION}</TableHead>
              <TableHead>{NODE_STRINGS.COL_STATUS}</TableHead>
              <TableHead className="text-right">{NODE_STRINGS.COL_LAST_SEEN}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : nodes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  {NODE_STRINGS.NO_NODES}
                </TableCell>
              </TableRow>
            ) : (
              nodes.map((node) => (
                <TableRow key={node.id} className="hover:bg-muted/50">
                  {/* Node Name + IP address */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {node.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {node.ip_address}
                      </span>
                    </div>
                  </TableCell>

                  {/* Node type — resolved from NODE_TYPE_LABEL, fallback to raw value */}
                  <TableCell className="text-muted-foreground">
                    {NODE_TYPE_LABEL[node.node_type as keyof typeof NODE_TYPE_LABEL]
                      ?? node.node_type}
                  </TableCell>

                  {/* Config — present for node types that have variants, "—" otherwise */}
                  <TableCell className="text-muted-foreground">
                    {formatConfig(node.config)}
                  </TableCell>

                  {/* Location — pre-formatted "Building / Sector" from API */}
                  <TableCell className="text-muted-foreground">
                    {node.location}
                  </TableCell>

                  {/* Status badge */}
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUS_CLASS[node.status]
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[node.status])} />
                      {STATUS_LABEL[node.status]}
                    </span>
                  </TableCell>

                  {/* Last seen */}
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatLastSeen(node.last_seen)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
        <span>
          {start}–{end} of {total} rows
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 tabular-nums">
            {currentPage} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= lastPage || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NodesTable;