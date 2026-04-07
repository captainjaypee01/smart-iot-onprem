---
name: Missing factory file for models using HasFactory
description: Models declaring use HasFactory; without a corresponding factory file will throw RuntimeException when Gateway::factory() is called; flag as HIGH failure at Models layer
type: feedback
---

When validating the Models layer, always check whether a `database/factories/{ModelName}Factory.php` file exists for every model that declares `use HasFactory`.

**Why:** Without the factory, any test or seeder that calls `ModelName::factory()` throws a `RuntimeException` at runtime. This blocks all downstream feature tests (controller, resource, integration layers).

**How to apply:** After reading the model file, run a Glob for `api/database/factories/{ModelName}Factory.php`. If the file does not exist and the model uses `HasFactory`, report as a HIGH FAIL in the Models layer check. Do not assume the factory will be created later — the models layer is incomplete without it.
