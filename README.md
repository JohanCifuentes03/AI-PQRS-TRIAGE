# AI-PQRS-Triage

Sistema de triage inteligente para PQRS con arquitectura multiagente, deduplicacion semantica y validacion humana (human-in-the-loop).

## Tabla de contenido

- [Vision del proyecto](#vision-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Demo](#demo)
- [Arquitectura](#arquitectura)
- [Stack tecnologico](#stack-tecnologico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Modelo de datos](#modelo-de-datos)
- [API](#api)
- [Flujo end-to-end](#flujo-end-to-end)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Calidad](#calidad)
- [Roadmap corto](#roadmap-corto)

## Vision del proyecto

Las entidades publicas reciben miles de PQRS y el cuello de botella suele estar en la clasificacion inicial, deteccion de urgencias y enrutamiento a la dependencia correcta.

AI-PQRS-Triage automatiza esa primera capa operativa:

- clasifica la solicitud,
- identifica riesgo y urgencia,
- sugiere entidad responsable,
- detecta posibles duplicados,
- y deja decision final al funcionario.

## Funcionalidades

- Ingesta de PQRS por texto, `.pdf` y `.txt` desde web
- Triage multiagente (classifier, risk, router, deduplicator, summary)
- Fallback heuristico si no hay `OPENAI_API_KEY`
- Bandeja operativa de pendientes
- Aprobacion, correccion y enrutamiento manual
- Trazabilidad de acciones humanas (`audit_logs`)
- Trazabilidad de ejecucion IA (`pipelineTrace`)
- Vista de analytics basica

## Demo

### Demo GIF

![Demo de triage](docs/demo.gif)

### Datos de ejemplo

El proyecto incluye PDFs de prueba en `example-data/` para disparar el flujo de triage.

## Arquitectura

El repositorio es un monorepo con 3 paquetes principales:

1. `apps/api` (NestJS)
2. `apps/web` (Next.js)
3. `packages/shared` (tipos/schemas compartidos)

### Backend (NestJS)

- `POST /triage`: recibe texto + canal + sourceType y ejecuta pipeline IA
- `GET /pqrs`: bandeja paginada
- `GET /pqrs/:id`: detalle de solicitud
- `GET /pqrs/:id/trace`: trazas de pipeline + audit logs
- `PATCH /pqrs/:id/approve`
- `PATCH /pqrs/:id/correct`
- `PATCH /pqrs/:id/route`

### Frontend (Next.js)

- Bandeja principal con tabla de pendientes
- Panel de detalle con acciones de operador
- Modal de trazabilidad multiagente (paso a paso)
- Ingesta de PDF/texto desde UI
- Dashboard de analytics

### Pipeline multiagente

1. `ClassifierAgent`: tipo, tema, subtema
2. `RiskDetectorAgent`: urgencia, riesgo
3. `RouterAgent`: entidad sugerida
4. `DeduplicatorAgent`: similares por embedding (o fallback texto)
5. `Summary`: resumen de una linea

El resultado persiste en `pqrs.pipelineTrace` con tiempos y salida por agente.

## Stack tecnologico

- Monorepo: `pnpm workspaces`
- API: `NestJS`, `Prisma`, `PostgreSQL 15`, `pgvector`
- Web: `Next.js App Router`, `React`, `Tailwind`
- IA: `OpenAI` + fallback heuristico
- Validacion: `Zod`
- Testing: `Jest` (API), `Vitest` (Web)

## Estructura del repositorio

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   └── src
│   └── web
│       └── src
├── packages
│   └── shared
├── docs
│   └── demo.gif
├── example-data
└── docker-compose.yml
```

## Modelo de datos

### Tabla `pqrs`

- `id`
- `texto`
- `sourceType` (`manual_text` | `pdf` | `txt`)
- `canal` (`web` | `escrito` | `presencial`)
- `tipo`, `tema`, `subtema`
- `urgencia`, `entidad`, `riesgo`
- `resumen`, `confianza`
- `estado` (`pendiente` | `aprobado` | `corregido` | `enrutado`)
- `pipelineTrace` (json con pasos de agentes)
- `embedding` (`vector(1536)`)
- `createdAt`, `updatedAt`

### Tabla `audit_logs`

- `id`
- `pqrsId`
- `accion` (`aprobar` | `corregir` | `enrutar`)
- `usuario`
- `detalles` (json)
- `createdAt`

## API

Swagger disponible en:

`http://localhost:4000/api/docs`

Endpoints clave:

- `POST /triage`
- `GET /pqrs`
- `GET /pqrs/:id`
- `GET /pqrs/:id/trace`
- `PATCH /pqrs/:id/approve`
- `PATCH /pqrs/:id/correct`
- `PATCH /pqrs/:id/route`

## Flujo end-to-end

1. Operador carga texto/PDF en web
2. Web extrae texto y llama `POST /triage`
3. API ejecuta pipeline multiagente
4. API persiste resultado + trace + embedding
5. PQRS aparece en bandeja pendiente
6. Operador revisa sugerencia IA y decide
7. API registra accion en `audit_logs`

## Setup local

### Requisitos

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### Instalacion

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Si algun puerto esta ocupado:

```bash
for p in 3000 3001 3002 3010 4000; do fuser -k ${p}/tcp 2>/dev/null || true; done
```

## Variables de entorno

Archivo base: `.env.example`

Variables importantes:

- `DATABASE_URL`
- `API_PORT`
- `CORS_ORIGIN`
- `NEXT_SERVER_API_URL`
- `OPENAI_API_KEY` (opcional; sin key se usa fallback)
- `OPENAI_MODEL`
- `OPENAI_EMBEDDING_MODEL`

## Scripts

### Root

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm db:migrate`
- `pnpm db:seed`

### API

- `pnpm --filter @ai-pqrs-triage/api dev`
- `pnpm --filter @ai-pqrs-triage/api test`
- `pnpm --filter @ai-pqrs-triage/api db:migrate`

### Web

- `pnpm --filter @ai-pqrs-triage/web dev`
- `pnpm --filter @ai-pqrs-triage/web test`

## Calidad

Estado actual del proyecto:

- API test suite pasando
- Web test suite pasando
- Typecheck global pasando
- Cobertura por encima del minimo definido

Comandos de control:

```bash
pnpm -r lint
pnpm -r typecheck
pnpm --filter @ai-pqrs-triage/api test
pnpm --filter @ai-pqrs-triage/web test
```

## Roadmap corto

- OCR para imagenes escaneadas
- Dashboard de carga por entidad
- Exportacion de reportes
- Integracion SSO para usuarios operadores
