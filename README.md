## Start infra
docker compose up -d
docker compose ps

## Verify Postgres
docker exec -it iot-postgres psql -U iot -d iot -c "select now();"

## Verify Redis
docker exec -it iot-redis redis-cli ping

## Verify MQTT
# Terminal A:
docker exec -it iot-mosquitto sh -lc "mosquitto_sub -h localhost -t test/topic -v"
# Terminal B:
docker exec -it iot-mosquitto sh -lc "mosquitto_pub -h localhost -t test/topic -m hello"


// When working on frontend
"I am working inside web/ — apply frontend rules only."

// When working on backend
"I am working inside api/ — apply backend rules only."

// When working on infra
"I am working on Docker/infra — apply root rules only."