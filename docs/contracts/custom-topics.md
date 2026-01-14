# Custom App MQTT Topics (Non-Protobuf)

Rule: Do NOT use gw-* topics for custom JSON.
We use a separate namespace to avoid collisions.

Namespace (v1):
- custom/{tenant}/{domain}/...

Example:
- custom/acme/commands/create
- custom/acme/devices/metadata
Payload: JSON, versioned:
{ "v": 1, ... }
