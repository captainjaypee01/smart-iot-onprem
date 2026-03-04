// src/components/shared/NodeStatusBadge.tsx
// Reusable status badge for IoT node status values

import { cn } from "@/lib/utils";
import { NODE_STATUS_META } from "@/constants/nodeStatus";
import type { NodeStatus } from "@/types/nodes";

interface NodeStatusBadgeProps {
  status: NodeStatus;
  className?: string;
}

const NodeStatusBadge = ({ status, className }: NodeStatusBadgeProps) => {
  const meta = NODE_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-green-500": status === "online",
          "bg-gray-400 dark:bg-gray-500": status === "offline",
          "bg-yellow-500": status === "warning",
          "bg-red-500": status === "error",
        })}
      />
      {meta.label}
    </span>
  );
};

export default NodeStatusBadge;
