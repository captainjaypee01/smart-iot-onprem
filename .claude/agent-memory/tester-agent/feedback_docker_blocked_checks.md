---
name: Docker container may be stopped — static-only fallback
description: Docker Compose services are often stopped during tester-agent sessions; all dynamic checks (Pint, PHPStan, Pest) fall back to static inspection; note as Blocked Items in report
type: feedback
---

When `docker compose exec api ...` commands return empty output with no error, the API container is not running. Do not retry the commands in a loop — note it under Blocked Items and continue with static file inspection for the remaining checks.

**Why:** The dev stack is only started when the developer runs `make dev`. Between sessions, it is typically stopped. Retrying docker commands wastes time; the tester agent should complete all static checks and flag dynamic checks as blocked.

**How to apply:** After the first `docker compose exec` call returns empty, treat all subsequent docker-dependent checks (Pint style, PHPStan, Pest suite, Bruno HTTP) as BLOCKED and document them clearly in the report's Blocked Items section. Recommend `make dev` + re-run as a Recommended Action.
