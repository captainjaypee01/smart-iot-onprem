Context:
- Project: Smart IoT On-Prem API
- Stack: Laravel 12, PHP 8.4, PostgreSQL, Sanctum (Bearer token), Pest
- Rules: Follow API_GUIDELINES.md and DECISIONS.md strictly

Task:
[Describe what you want built — be specific about the endpoint or feature]

Scope:
- Controller(s): [e.g. app/Http/Controllers/Api/V1/Users/UserController.php]
- Request(s): [e.g. app/Http/Requests/Api/V1/Users/StoreUserRequest.php]
- Resource(s): [e.g. app/Http/Resources/Api/V1/UserResource.php]
- Action(s): [e.g. app/Actions/Users/StoreUserAction.php]
- DTO(s): [e.g. app/DTO/Users/StoreUserDTO.php]
- Notification(s): [if any email needs to be sent]
- Route(s): [which file — api.php, web.php, or internal.php]
- Test(s): [e.g. tests/Feature/Users/StoreUserTest.php]

Existing files to reference:
- [Attach or paste relevant models, migrations, or existing controllers]

Controller pattern:
- [ ] Single-action (__invoke) — for isolated/one-off actions
- [ ] Resource controller (named methods + apiResource) — for CRUD modules

Authorization:
- Who can call this endpoint? [superadmin / company admin / any authenticated user]
- Scope restrictions? [e.g. company admin can only affect their own company_id]

Endpoint contract:
- Method + path: [e.g. POST /api/v1/users]
- Request body: [list fields, types, validation rules]
- Success response: [shape + HTTP status]
- Error cases: [list possible 403/404/422 scenarios]

Business rules:
- [List any domain rules the action must enforce]
- [e.g. Cannot disable a superadmin account]
- [e.g. Send WelcomeUserNotification after creating user]

Do NOT:
- Put business logic in the controller — use an Action class
- Skip FormRequest validation
- Use any without a type
- Auto-create users from SSO callbacks
- Skip DB transactions for multi-step writes