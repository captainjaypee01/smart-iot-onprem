# Wirepas Gateway↔Backend MQTT Topics (Protobuf)

These topics are defined by Wirepas Gateway to Backend API.
**All payloads on these topics are Protocol Buffers (proto2).** :contentReference[oaicite:6]{index=6}

## Requests (Backend → Gateway)
- gw-request/get_configs/<gw-id>
- gw-request/get_gw_info/<gw-id>
- gw-request/set_config/<gw-id>/<sink-id>
- gw-request/send_data/<gw-id>/<sink-id>
- gw-request/otap_status/<gw-id>/<sink-id>
- gw-request/otap_load_scratchpad/<gw-id>/<sink-id>
- gw-request/otap_process_scratchpad/<gw-id>/<sink-id>
- gw-request/otap_set_target_scratchpad/<gw-id>/<sink-id>
- gw-request/set_configuration_data_item/<gw-id>/<sink-id>
- gw-request/get_configuration_data_item/<gw-id>/<sink-id>

## Responses (Gateway → Backend)
- gw-response/get_configs/<gw-id>
- gw-response/get_gw_info/<gw-id>
- gw-response/set_config/<gw-id>/<sink-id>
- gw-response/send_data/<gw-id>/<sink-id>
- gw-response/otap_status/<gw-id>/<sink-id>
- gw-response/otap_load_scratchpad/<gw-id>/<sink-id>
- gw-response/otap_process_scratchpad/<gw-id>/<sink-id>
- gw-response/otap_set_target_scratchpad/<gw-id>/<sink-id>
- gw-response/set_configuration_data_item/<gw-id>/<sink-id>
- gw-response/get_configuration_data_item/<gw-id>/<sink-id>

## Events (Gateway → Backend)
- gw-event/status/<gw-id>
- gw-event/received_data/<gw-id>/<sink-id>/<net_id>/<src_ep>/<dst_ep>

## Rules
1) Do NOT change these topic patterns.
2) Do NOT publish JSON/non-protobuf to these topics.
3) For custom application features, use `custom/...` topics (see `custom-topics.md`).
