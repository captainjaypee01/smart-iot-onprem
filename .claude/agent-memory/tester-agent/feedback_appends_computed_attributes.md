---
name: Computed attribute $appends pattern
description: Models using Attribute::make() for computed attributes often omit $appends; spec requires "appended attribute" — flag as LOW warning if $appends absent
type: feedback
---

When a spec says a computed attribute (e.g., `status`) must be "appended to every resource response", validate that the model declares `protected $appends = ['attribute_name']` in addition to defining the `Attribute::make()` getter.

**Why:** Without `$appends`, the computed attribute is only accessible when directly referenced (e.g., `$model->status`). It will NOT appear in `toArray()` or JSON serialization automatically. The Resource layer can compensate by reading it explicitly, so this is a LOW warning at the Models layer — but confirm during the Resources layer check.

**How to apply:** In any Models layer check where the spec says a field is "computed" or "derived" and "appended to every response", grep for `$appends` in the model file. If absent, flag as LOW warning with note that the Resource layer must compensate. Escalate to MEDIUM if the Resource layer also fails to include the field explicitly.
