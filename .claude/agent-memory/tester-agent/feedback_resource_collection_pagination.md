---
name: ResourceCollection custom toArray() suppresses pagination meta/links
description: When a ResourceCollection overrides toArray() with only `data`, the paginator's meta and links are silently dropped — HIGH failure pattern
type: feedback
---

Custom `ResourceCollection` classes that override `toArray()` to return only `{ 'data': $this->collection }` will silently suppress the paginator's `meta` and `links` blocks even when the controller passes a `LengthAwarePaginator`.

The correct pattern is either:
- Use `XxxResource::collection($paginator)` in the controller (returns `AnonymousResourceCollection` which handles pagination automatically)
- Or in the custom collection's `toArray()`, explicitly add pagination data from the underlying paginator

**Why:** Laravel's `ResourceCollection` normally auto-appends `meta` and `links` when wrapping a paginator — but only when the default `toArray()` is NOT overridden. A custom `toArray()` that returns only `data` replaces the entire output.

**How to apply:** In every new module's ResourceCollection, confirm `toArray()` does not suppress `meta`/`links`. Cross-reference the spec response shape. If `meta` and `links` are required by the spec, verify the collection does not use a bare `return ['data' => $this->collection]` pattern.
