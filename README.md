## Start infra
docker compose up -d
docker compose ps

## Frontend
docker compose up -d dashboard
# Open http://localhost:5173

## Verify frontend is proxying to the API container
docker compose logs dashboard

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


# DEV
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d --build

# UAT
docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env.uat up -d --build

# PROD
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Tear down
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev down

# Tail logs for a specific service
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev logs -f api

# Shell into API container
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev exec api sh

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev exec api php artisan migrate