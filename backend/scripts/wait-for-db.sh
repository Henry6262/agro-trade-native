#!/bin/bash
# Wait for PostgreSQL and Redis to be ready before running tests
set -e

MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Waiting for PostgreSQL..."
for i in $(seq 1 $MAX_RETRIES); do
  if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-test}" > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "ERROR: PostgreSQL did not become ready in time"
    exit 1
  fi
  echo "  Attempt $i/$MAX_RETRIES - waiting ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "Waiting for Redis..."
for i in $(seq 1 $MAX_RETRIES); do
  if redis-cli -h "${REDIS_HOST:-localhost}" -p "${REDIS_PORT:-6379}" ping > /dev/null 2>&1; then
    echo "Redis is ready!"
    break
  fi
  if [ $i -eq $MAX_RETRIES ]; then
    echo "WARNING: Redis not available, continuing anyway..."
    break
  fi
  echo "  Attempt $i/$MAX_RETRIES - waiting ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "All services ready. Running: $@"
exec "$@"
