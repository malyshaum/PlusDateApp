# Database

Database bootstrap and container files for PlusDateApp.

## Contents

- [docker-compose.yml](docker-compose.yml) - standalone PostgreSQL service.
- [Dockerfile](Dockerfile) - database image build context.
- [init.sql](init.sql) - extension bootstrap for PostGIS and pgvector.

## Purpose

This folder exists to make the database layer reproducible and ready for the features used by the backend:

- geospatial queries through PostGIS
- vector search support through pgvector
- persistent PostgreSQL storage through Docker volumes

## What init.sql Does

The bootstrap SQL enables:

- `postgis`
- `postgis_topology`
- `vector`

It also prints a couple of verification queries so you can confirm the extensions are available.

## Running the Database

```bash
docker compose up -d --build
```

The compose file exposes PostgreSQL on port `5432` and stores data in a named volume.

## Environment Variables

The compose file reads the following variables when available:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

If they are not provided, defaults are used in the container configuration.

## Notes

- The database layer is intended to support the Laravel API from [api/](../api/).
- Keep the volume if you want to preserve local development data.
- If you change database extensions, rebuild the container and reinitialize the database volume if necessary.
