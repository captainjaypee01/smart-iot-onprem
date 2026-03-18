# Project documentation

- **[BLUEPRINT.md](BLUEPRINT.md)** — High-level system blueprint and entrypoint for humans and AI agents (components, flows, contracts, and how to use docs in prompts).
- **[specs/user-module-contract.md](specs/user-module-contract.md)** — Shared API ↔ frontend contract for the User module (endpoints, request/response shapes, business rules). Keep in sync when changing user endpoints or resources.
- **[ENV_FILES.md](ENV_FILES.md)** — Which `.env` files are used by Docker Compose and by each app (API, dashboard).
- **contracts/** — MQTT and backend contracts:
  - [contracts/wirepas-topics.md](contracts/wirepas-topics.md)
  - [contracts/custom-topics.md](contracts/custom-topics.md)

**API architecture and patterns** (permissions, FormRequests, DTOs, Actions, pagination, options vs index) are in the API repo:

- [api/README.md](../api/README.md) — Quick start, endpoints, auth, permissions overview.
- [api/docs/API_GUIDELINES.md](../api/docs/API_GUIDELINES.md) — Coding standards, controller patterns, permissions and authorization, options vs index, pagination.
- [api/docs/PERMISSIONS.md](../api/docs/PERMISSIONS.md) — Permission keys and where they are enforced (user module and pattern for new modules).
- [api/docs/DECISIONS.md](../api/docs/DECISIONS.md) — ADRs (e.g. cookie-based Sanctum, Actions, DTOs).
- [api/docs/SECURITY.md](../api/docs/SECURITY.md) — Security guidelines.
