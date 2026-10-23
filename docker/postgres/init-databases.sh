#!/bin/sh
# Creates the test database next to the main one on first container start.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE DATABASE "$POSTGRES_TEST_DB";
  GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_TEST_DB" TO "$POSTGRES_USER";
SQL
