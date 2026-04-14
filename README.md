# AI PQRS Triage

MVP funcional para triage inteligente de PQRS (Bogota Te Escucha) con arquitectura multiagente, validacion humana y trazabilidad completa.

## Demo rapida

### Flujo principal (lo que debes mostrar)

1. Abre la bandeja en `http://localhost:3000`
2. En `Ingresar nueva PQRS`, sube un PDF de `example-data/` o pega texto
3. Click en `Triagear PQRS`
4. Selecciona la fila creada en la tabla
5. Abre `Ver ejecucion IA`
6. Muestra los 5 pasos del pipeline (classifier, risk, router, deduplicator, summary)
7. Click en `Aprobar` o `Enrutar` y verifica feedback + cambio de estado

## Arquitectura

- Monorepo: `pnpm workspaces`
- Backend: NestJS + Prisma + PostgreSQL 15 + pgvector
- Frontend: Next.js App Router + Tailwind
- Shared: tipos/schemas Zod en `packages/shared`
- IA:
  - Modo normal: OpenAI (`OPENAI_API_KEY`)
  - Modo fallback: heuristicas locales si no hay key

## Estructura del repo

- `apps/api` API NestJS
- `apps/web` UI Next.js
- `packages/shared` contratos compartidos
- `example-data` PDFs de ejemplo para demo

## Arranque local

1. Instala dependencias

```bash
pnpm install
```

2. Crea `.env`

```bash
cp .env.example .env
```

3. Levanta base de datos

```bash
docker compose up -d
```

4. Migra y (opcional) seed

```bash
pnpm db:migrate
pnpm db:seed
```

5. Inicia apps

```bash
pnpm dev
```

Notas:
- Si el puerto `3000` o `4000` esta ocupado, libera puertos con:

```bash
for p in 3000 3001 3002 3010 4000; do fuser -k ${p}/tcp 2>/dev/null || true; done
```

- Los scripts del API leen `.env` automaticamente (via `dotenv -e ../../.env`).

## Endpoints clave

- `POST /triage`
- `GET /pqrs`
- `GET /pqrs/:id`
- `GET /pqrs/:id/trace` (pipeline + audit)
- `PATCH /pqrs/:id/approve`
- `PATCH /pqrs/:id/correct`
- `PATCH /pqrs/:id/route`
- Swagger: `http://localhost:4000/api/docs`

## Pipeline multiagente

Para cada PQRS:

1. `ClassifierAgent` -> tipo/tema/subtema
2. `RiskDetectorAgent` -> urgencia/riesgo
3. `RouterAgent` -> entidad responsable
4. `DeduplicatorAgent` -> duplicados
5. `Summary` -> resumen de una linea

El sistema guarda `pipelineTrace` con:
- `runId`
- tiempos (`startedAt`, `finishedAt`, `totalMs`)
- estado por agente (`ok/fallback/error`)
- salida JSON por paso

## UX operativa implementada

- Panel de detalle con:
  - estado actual (badge)
  - sugerencia IA editable
  - boton `Ver ejecucion IA`
  - acciones `Aprobar`, `Corregir`, `Enrutar`
- Feedback visual en acciones:
  - mensaje de procesamiento
  - confirmacion de exito/error
  - actualizacion de bandeja

## Grabar GIF para el README

Puedes grabar un GIF de demo con dos opciones.

### Opcion A (recomendada): Peek (Linux)

1. Instala Peek:

```bash
sudo apt install peek
```

2. Ejecuta:

```bash
peek
```

3. Selecciona el area de la pantalla
4. Click en `Record`
5. Haz el flujo: subir PDF -> triage -> ver ejecucion IA -> aprobar/enrutar
6. Guarda como `docs/demo.gif`

### Opcion B: ffmpeg (CLI)

```bash
ffmpeg -video_size 1366x768 -framerate 12 -f x11grab -i :0.0+0,0 -vf "fps=10,scale=1024:-1:flags=lanczos" docs/demo.gif
```

Deten con `Ctrl+C`.

## Demo GIF

![Demo de triage](docs/demo.gif)

## Tips para demo con profesor

- Usa un PDF de `example-data/PQRS-SYN-00001.pdf`
- Muestra `Ver ejecucion IA` (esto evidencia multiagente)
- Luego `Aprobar` y enseña:
  - cambio de estado
  - registro en trace/audit

## Calidad

- API: cobertura > 80%
- Web: cobertura > 80%
- Typecheck y tests pasando

Comandos:

```bash
pnpm -r lint
pnpm -r typecheck
pnpm --filter @ai-pqrs-triage/api test
pnpm --filter @ai-pqrs-triage/web test
```

## Consideraciones eticas

- Human-in-the-loop obligatorio
- Audit log por accion funcional
- Riesgo conservador ante ambiguedad
- Trazabilidad end-to-end del pipeline
