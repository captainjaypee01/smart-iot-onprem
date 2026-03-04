// src/constants/strings.nodes.ts
// User-facing strings for the Nodes page — import via @/constants barrel

export const NODES_STRINGS = {
  PAGE_TITLE: "Nodes",
  PAGE_SUBTITLE: "All registered IoT nodes and their current status",
  SEARCH_PLACEHOLDER: "Search by name or location…",
  FILTER_NODE_TYPE: "Node Type",
  FILTER_STATUS: "Status",
  FILTER_ALL_TYPES: "All Types",
  FILTER_ALL_STATUSES: "All Statuses",
  COL_NAME: "Node Name",
  COL_TYPE: "Node Type",
  COL_CONFIG: "Config",
  COL_LOCATION: "Location",
  COL_STATUS: "Status",
  COL_LAST_SEEN: "Last Seen",
  STATUS_ONLINE: "Online",
  STATUS_OFFLINE: "Offline",
  STATUS_WARNING: "Warning",
  STATUS_ERROR: "Error",
  NEVER_SEEN: "Never",
  EMPTY_STATE: "No nodes match your filters.",
  LOADING: "Loading nodes…",
  ERROR_FETCH: "Failed to load nodes. Please try again.",
  PAGINATION_OF: "of",
  PAGINATION_ROWS: "rows",
} as const;
