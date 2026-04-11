# AI PQRS Triage — Plan de Implementacion MVP

## Stack Tecnologico

- **Monorepo**: pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- **Backend**: NestJS + Prisma + PostgreSQL 15 + pgvector
- **Frontend**: Next.js App Router + TailwindCSS
- **LLM**: OpenAI como proveedor principal (MVP), Gemini como secundario configurable
- **Validacion**: Zod
- **Testing**: Jest/Vitest + Playwright (TDD, 80%+ coverage)

## Estructura de Carpetas Objetivo

```
ai-pqrs-triage/
├── apps/
│   ├── api/                    # NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── triage/
│   │   │   │   └── pqrs/
│   │   │   ├── agents/
│   │   │   │   ├── classifier.agent.ts
│   │   │   │   ├── risk-detector.agent.ts
│   │   │   │   ├── router.agent.ts
│   │   │   │   ├── deduplicator.agent.ts
│   │   │   │   └── orchestrator.agent.ts
│   │   │   ├── llm/
│   │   │   │   ├── llm.provider.ts
│   │   │   │   ├── openai.provider.ts
│   │   │   │   └── google.provider.ts
│   │   │   └── app.module.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   └── nest-cli.json
│   └── web/                    # Next.js
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── page.tsx      # Bandeja de Solicitudes
│       │   │   │   └── layout.tsx
│       │   │   ├── analytics/
│       │   │   │   └── page.tsx
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── sidebar.tsx
│       │   │   ├── topbar.tsx
│       │   │   ├── pqrs-table.tsx
│       │   │   ├── pqrs-detail-panel.tsx
│       │   │   └── analytics-cards.tsx
│       │   ├── actions/
│       │   │   ├── triage.actions.ts
│       │   │   └── pqrs.actions.ts
│       │   └── lib/
│       │       └── api-client.ts
│       ├── public/
│       └── next.config.js
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   │   ├── triage.ts
│       │   │   └── pqrs.ts
│       │   └── schemas/
│       │       ├── triage.schema.ts
│       │       └── pqrs.schema.ts
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── .env.example
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── Makefile
└── PLAN.md
```

## Fases de Implementacion

### Fase 0: Fundaciones del Repositorio
- Inicializar monorepo con `pnpm workspaces`
- Configurar TypeScript base compartido (`tsconfig.base.json`)
- Crear `apps/api` (NestJS) y `apps/web` (Next.js) vacios
- Crear `packages/shared` con tipos base
- Docker Compose para PostgreSQL 15 + pgvector
- `.env.example` con todas las variables
- `Makefile` con scripts de conveniencia

**Criterio de cierre**: `pnpm install` funciona, ambos apps arrancan sin errores.

---

### Fase 1: Dominio Compartido + Contratos
- En `packages/shared`:
  - Tipos: `TriageInput`, `TriageOutput`, `PqrsRecord`, `AuditLogRecord`
  - Enums: `Canal`, `Urgencia`, `EstadoPqrs`, `TipoPqrs`
  - Schemas Zod para validacion de entrada/salida
- Publicar package en workspace

**Criterio de cierre**: `packages/shared` exporta tipos y schemas, importable desde `apps/api` y `apps/web`.

---

### Fase 2: Base de Datos Prisma + pgvector
- Configurar Prisma en `apps/api`
- Modelo `pqrs` y `audit_logs` segun especificacion
- Columna `embedding vector(1536)` con extension pgvector
- Indices vectoriales (ivfflat para MVP)
- Seed con PQRS de ejemplo

**Criterio de cierre**: `pnpm db:migrate` y `pnpm db:seed` ejecutan sin errores, tablas creadas con datos ejemplo.

---

### Fase 3: API NestJS
- `TriageModule`: `POST /triage` (recibe texto + canal, invoca pipeline, persiste)
- `PqrsModule`: CRUD completo
  - `GET /pqrs` (listar bandeja con filtros)
  - `GET /pqrs/:id` (detalle con duplicados)
  - `PATCH /pqrs/:id/approve`
  - `PATCH /pqrs/:id/correct`
  - `PATCH /pqrs/:id/route`
- `TriageService` como nucleo (stub de pipeline para esta fase)
- Auditoria transaccional en cada accion humana
- Swagger/OpenAPI

**Criterio de cierre**: Endpoints responden, validacion Zod funciona, auditoria se registra, Swagger disponible en `/api/docs`.

---

### Fase 4: Orquestacion de Agentes
- `OrchestratorAgent` como `SequentialAgent`:
  - Fase 1: `ParallelAgent` con `ClassifierAgent`, `RiskDetectorAgent`, `RouterAgent`
  - Fase 2: `DeduplicatorAgent`
- Prompts few-shot en espanol con taxonomia de Bogota Te Escucha
- Capa de proveedor LLM (OpenAI principal, Google secundario)
- Salida JSON estricta: `tipo, tema, subtema, urgencia, entidad, riesgo, duplicados[], confianza, resumen`
- Dedupe: embedding + coseno sobre pgvector

**Criterio de cierre**: `POST /triage` clasifica texto real, detecta riesgo, enruta y detecta duplicados.

---

### Fase 5: Frontend Next.js
- Bandeja de Solicitudes (`/`) con tabla de pendientes
- Panel lateral de detalle (texto, clasificacion IA, duplicados, aprobar/corregir)
- Analytics (`/analytics`) con dashboard basico
- Server Actions para llamadas backend
- Layout basado en `base.html` (sidebar, topbar, tabla)
- Estados de carga/error/vacio

**Criterio de cierre**: Flujo completo visible en navegador — ver bandeja, abrir detalle, aprobar/corregir, ver analytics.

---

### Fase 6: TDD + Calidad
- Ciclo RED -> GREEN -> REFACTOR por feature critica
- Unit tests: clasificacion, parseo, mapeos, reglas de riesgo
- Integration tests: `POST /triage`, aprobacion/correccion, auditoria
- E2E (Playwright): triage desde UI, aprobar/corregir, analytics
- Cobertura >= 80%

**Criterio de cierre**: Suite de pruebas pasa, cobertura >= 80%, CI basico configurado.

---

### Fase 7: Etica, Seguridad y Operacion MVP
- Human-in-the-loop garantizado (no auto-aprobacion)
- AuditLog obligatorio por accion de funcionario
- Umbral conservador en riesgo: ante duda, urgencia alta
- Rate limiting en endpoints sensibles
- Logs estructurados
- Documentacion de retencion y PII en README

**Criterio de cierre**: Controles eticos y operativos implementados y verificados.

---

## Esquema de Base de Datos

### Tabla `pqrs`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador unico |
| texto | TEXT | Texto original de la PQRS |
| canal | VARCHAR(20) | web, escrito, presencial |
| tipo | VARCHAR(30) | peticion, queja, reclamo, sugerencia, felicitacion |
| tema | VARCHAR(100) | Tema segun taxonomia |
| subtema | VARCHAR(100) | Subtema segun taxonomia |
| urgencia | VARCHAR(10) | Alta, Media, Baja |
| entidad | VARCHAR(100) | Dependencia distrital asignada |
| riesgo | VARCHAR(100) | Riesgo detectado |
| resumen | TEXT | Resumen de una linea |
| confianza | FLOAT | Score 0-1 |
| estado | VARCHAR(20) | pendiente, aprobado, corregido, enrutado |
| embedding | vector(1536) | Embedding del texto |
| createdAt | TIMESTAMP | Fecha de creacion |
| updatedAt | TIMESTAMP | Fecha de actualizacion |

### Tabla `audit_logs`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | Identificador unico |
| pqrsId | UUID FK | Referencia a pqrs |
| accion | VARCHAR(30) | aprobar, corregir, enrutar |
| usuario | VARCHAR(100) | Funcionario que actua |
| detalles | JSONB | Cambios realizados |
| createdAt | TIMESTAMP | Fecha de la accion |

## Flujo Completo de una PQRS

```
Ciudadano envia texto
  → Next.js POST /triage
  → NestJS valida con Zod
  → TriageService lanza OrchestratorAgent
  → ParallelAgent: ClassifierAgent + RiskDetectorAgent + RouterAgent (simultaneo)
  → DeduplicatorAgent: busca similares en pgvector
  → Resultado se guarda en PostgreSQL (estado: pendiente)
  → Next.js refresca bandeja
  → Funcionario aprueba o corrige
  → Se registra en audit_logs
  → PQRS pasa a estado enrutado
```

## Proveedor LLM

- **Principal (MVP)**: OpenAI (`gpt-4o-mini`, `text-embedding-3-small`)
- **Secundario (futuro)**: Google (`gemini-2.0-flash`, `text-embedding-004`)
- Variable `LLM_PROVIDER=openai|google` para switch

## Variables de Entorno (.env.example)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_pqrs_triage?schema=public
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AI PQRS Triage
NEXT_SERVER_API_URL=http://localhost:4000
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
GOOGLE_API_KEY=
GOOGLE_MODEL=gemini-2.0-flash
GOOGLE_EMBEDDING_MODEL=text-embedding-004
```
