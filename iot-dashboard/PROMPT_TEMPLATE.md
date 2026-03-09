Context:
- Project: IoT Monitoring Dashboard
- Stack: React 19, TypeScript 5+, Tailwind CSS v4, shadcn/ui, Zustand, Axios, react-router-dom v7, Recharts, Sonner
- Rules: Follow AGENTS.md strictly

Task:
[Describe what you want built — be specific about the feature/page/component]

Scope:
- Page(s): [e.g. src/pages/users/UsersPage.tsx]
- Hook(s): [e.g. src/hooks/useUsers.ts]
- API file(s): [e.g. src/api/users.ts]
- Component(s): [e.g. src/components/shared/UserTable.tsx]
- Type(s): [e.g. src/types/users.ts]
- Constants: [e.g. src/constants/users.ts — if any new strings needed]

Existing files to reference:
- [Attach or paste relevant files the agent should stay consistent with]

API contract:
- [List the endpoints this feature will consume]
- e.g. GET /api/v1/users → returns PaginatedResponse<User>
- e.g. POST /api/v1/users → body: StoreUserRequest, returns UserResource

Behaviour:
- [Describe what the page/component should do, step by step]
- [Describe loading, empty, and error states]
- [Describe any modals, toasts, or confirmations needed]

Do NOT:
- Create any mock data
- Add API calls inside components
- Use inline styles
- Hardcode strings — use constants
- Use any type