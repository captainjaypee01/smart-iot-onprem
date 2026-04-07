---
name: JsonResource response wrapping — response()->json() strips data envelope
description: Passing a JsonResource to response()->json() calls toArray() directly, losing the {"data":...} wrapper; return the resource directly instead
type: feedback
---

When a controller does `response()->json(new SomeResource($model), 201)`, Laravel calls `toArray()` on the resource directly, bypassing `toResponse()`. The standard `{"data": {...}}` envelope is never applied, so the response is a flat JSON object without a `data` key.

Tests that assert `assertJsonStructure(['data' => [...]])` or call `$response->json('data.someField')` will fail.

The correct idiomatic pattern is to return the resource directly (letting Laravel invoke `toResponse()`), with the status set explicitly if needed:
- `return (new SomeResource($model))->response()->setStatusCode(201);`
- Or for a 200: `return new SomeResource($model);`

**Why:** This pattern is a silent bug — the action creates the record correctly, the test sees a 201 status code (passes), but the second assertion on response structure fails, and any `Command::find($response->json('data.id'))` returns null (causing cascading ErrorExceptions).

**How to apply:** In every controller method that returns a `JsonResource` with a non-standard status code, verify it uses `->response()->setStatusCode(N)` or equivalent, not `response()->json(new Resource(...), N)`. Flag as CRITICAL if the test suite has assertions on `data.*` keys.
