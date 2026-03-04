// src/constants/nodeStatus.ts
// Status metadata for IoT nodes (labels + badge colour classes)

import type { NodeStatus } from "@/types/nodes";

interface NodeStatusMeta {
  label: string;
  /** Tailwind classes for the Badge — light + dark safe */
  className: string;
}

export const NODE_STATUS_META: Record<NodeStatus, NodeStatusMeta> = {
  online: {
    label: "Online",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  offline: {
    label: "Offline",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  warning: {
    label: "Warning",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  error: {
    label: "Error",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
} as const;
