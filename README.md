# AI PQRS Triage (MVP)

Sistema de triage inteligente para PQRS de Bogota Te Escucha.

## Stack

- Monorepo: pnpm workspaces
- API: NestJS + Prisma + PostgreSQL 15 + pgvector
- Web: Next.js App Router + Tailwind
- IA: OpenAI (`gpt-4o-mini`, `text-embedding-3-small`)

## Estructura

- `apps/api`: API NestJS
- `apps/web`: Frontend Next.js
- `packages/shared`: tipos y schemas Zod compartidos

## Arranque rapido

1. Instalar dependencias

```bash
pnpm install
```

2. Copiar variables de entorno

```bash
cp .env.example .env
```

Nota: los scripts de base de datos leen `../../.env` desde `apps/api`, asi que no necesitas exportar `DATABASE_URL` manualmente.

3. Levantar base de datos

```bash
docker compose up -d
```

4. Migrar y seed (entorno local no interactivo)

```bash
pnpm db:migrate
pnpm db:seed
```

Si necesitas crear una migracion nueva de desarrollo (interactiva), usa:

```bash
pnpm --filter @ai-pqrs-triage/api db:migrate:dev
```

5. Ejecutar apps

```bash
pnpm dev
```

`pnpm dev` ahora compila primero `packages/shared` para evitar errores de resolucion de modulos en runtime.

## Endpoints principales

- `POST /triage`
- `GET /pqrs`
- `GET /pqrs/:id`
- `PATCH /pqrs/:id/approve`
- `PATCH /pqrs/:id/correct`
- `PATCH /pqrs/:id/route`
- Swagger: `http://localhost:4000/api/docs`

## Calidad y pruebas

- API coverage: statements 97.76%, branches 82.75%, functions 100%, lines 100%
- Web coverage: statements 100%, branches 85.71%, functions 100%, lines 100%

Comandos:

```bash
pnpm -r lint
pnpm -r typecheck
pnpm --filter @ai-pqrs-triage/api test:coverage
pnpm --filter @ai-pqrs-triage/web test:coverage
```

## Consideraciones eticas y seguridad (MVP)

- Human-in-the-loop obligatorio: la IA sugiere, el funcionario decide.
- Trazabilidad total: cada accion (`aprobar`, `corregir`, `enrutar`) se registra en `audit_logs`.
- Riesgo conservador: el detector prioriza `Alta` ante ambiguedad.
- Rate limiting basico en endpoints de triage/acciones.
- Validacion estricta de entrada con Zod y validacion de variables de entorno al iniciar.
- PII: el texto se almacena para trazabilidad operativa; no se exponen secretos al cliente.
