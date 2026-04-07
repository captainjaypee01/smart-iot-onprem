---
name: ResourceCollection $collects type redeclaration — fatal PHP 8 error
description: Declaring `public string $collects` in a ResourceCollection subclass crashes PHP 8 because the parent has an untyped property; remove the type annotation
type: feedback
---

When a `ResourceCollection` subclass declares `public string $collects = SomeResource::class;`, PHP 8 throws a FatalError at class load time: "Type of ClassName::$collects must not be defined (as in class ResourceCollection)". The parent class declares `public $collects;` without a type, and PHP 8 does not allow a subclass to narrow or add a type where the parent has none.

The fix is to drop the `string` type annotation: `public $collects = SomeResource::class;`.

**Why:** This pattern causes a silent mismatch — the code looks correct at a glance but crashes on every request that loads the collection class, taking down all list/collection endpoints with exit 255.

**How to apply:** When reviewing any `ResourceCollection` subclass, check whether `$collects` has a type annotation. If it does, flag as CRITICAL regardless of whether the rest of the toArray() structure looks correct.
