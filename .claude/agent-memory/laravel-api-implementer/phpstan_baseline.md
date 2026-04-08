---
name: PHPStan Baseline
description: The project has 487+ pre-existing PHPStan errors at level 5; adding @property docblocks to models reduces this count
type: project
---

The project runs PHPStan at level 5 with no baseline file configured. As of node-decommission implementation (2026-04-08), the baseline was 487 errors (was 513 before adding @property docblocks). The errors are primarily `property.notFound` on Eloquent model properties that lack `@property` PHPDoc annotations.

**Why:** The project started without docblocks and has accrued technical debt. Adding `@property` blocks to new models reduces the count.

**How to apply:** Always add full `@property` docblocks to new Eloquent models. This is net positive even though the project doesn't have a clean baseline.
