// src/mocks/handlers.nodes.ts
// MSW request handler for GET /api/nodes — server-side pagination, search, filters

import { http, HttpResponse } from "msw";
import type { NodeListParams, NodeListResponse } from "@/types/nodes";
import { MOCK_NODES } from "./nodesData";

export const nodesHandlers = [
  http.get("/api/nodes", ({ request }) => {
    const url = new URL(request.url);

    const params: NodeListParams = {
      page: Number(url.searchParams.get("page") ?? 1),
      per_page: Number(url.searchParams.get("per_page") ?? 10),
      search: url.searchParams.get("search") ?? "",
      node_type: url.searchParams.get("node_type") ?? "",
      status:
        (url.searchParams.get("status") as NodeListParams["status"]) ?? "",
    };

    let filtered = [...MOCK_NODES];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.building.toLowerCase().includes(q) ||
          n.floor.toLowerCase().includes(q) ||
          n.sector.toLowerCase().includes(q)
      );
    }

    if (params.node_type) {
      filtered = filtered.filter((n) => n.node_type === params.node_type);
    }

    if (params.status) {
      filtered = filtered.filter((n) => n.status === params.status);
    }

    const total = filtered.length;
    const last_page = Math.max(1, Math.ceil(total / params.per_page));
    const start = (params.page - 1) * params.per_page;
    const data = filtered.slice(start, start + params.per_page);

    const response: NodeListResponse = {
      data,
      total,
      page: params.page,
      per_page: params.per_page,
      last_page,
    };

    return HttpResponse.json(response);
  }),
];
