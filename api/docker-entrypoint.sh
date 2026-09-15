#!/bin/sh
set -e

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for postgres at ${DB_HOST}:${DB_PORT}..."
until node -e "
const socket = require('net').createConnection(
  { host: process.env.DB_HOST, port: Number(process.env.DB_PORT) },
  () => { socket.end(); process.exit(0); }
);
socket.on('error', () => process.exit(1));
"; do
  sleep 1
done
echo "Postgres is reachable."

echo "Running migrations..."
npx sequelize-cli db:migrate

echo "Running seeders..."
npx sequelize-cli db:seed:all

echo "Starting api..."
exec "$@"
