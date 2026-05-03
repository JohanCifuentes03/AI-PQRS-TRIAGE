# AI-PQRS-Triage (Civic Sentinel)

Sistema de triage inteligente para la clasificación y gestión automática de peticiones, quejas, reclamos y sugerencias.

[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![pnpm 9+](https://img.shields.io/badge/pnpm-9+-f69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL 15](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Tabla de contenido

- [Visión del proyecto](#visión-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Modelo de datos](#modelo-de-datos)
- [API Reference](#api-reference)
- [Flujo end-to-end](#flujo-end-to-end)
- [Setup local](#setup-local)
- [Variables de entorno](#variables-de-entorno)
- [Ejemplo: API externa](#ejemplo-api-externa)
- [Scripts](#scripts)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Testing](#testing)
- [Licencia](#licencia)

## Visión del proyecto

Civic Sentinel es una solución diseñada para optimizar el procesamiento de PQRS en entidades públicas, reduciendo los tiempos de respuesta y mejorando la precisión en el enrutamiento de solicitudes. El sistema utiliza inteligencia artificial avanzada para analizar el contenido de las peticiones y sugerir acciones inmediatas a los funcionarios.

- Clasifica automáticamente el tipo, tema y subtema de la solicitud.
- Identifica niveles de urgencia y situaciones de riesgo potencial.
- Sugiere la entidad o dependencia responsable del trámite.
- Detecta posibles duplicados mediante análisis semántico (embeddings).
- Mantiene el control humano permitiendo que el funcionario tome la decisión final.

## Funcionalidades

### Ingesta omnicanal
- **Manual**: Registro directo de texto o carga de documentos en formatos PDF, TXT e imágenes.
- **Correo electrónico**: Lectura automática mediante protocolo IMAP con polling configurable para captura desatendida.
- **API externa**: Webhook seguro con autenticación basada en API key para integraciones con terceros.
- **OCR automático**: Procesamiento de documentos escaneados mediante Tesseract.js para extracción de texto.

### Triage multiagente
- **ClassifierAgent**: Determina la taxonomía (tipo/tema/subtema) de la PQRS.
- **RiskDetectorAgent**: Evalúa la urgencia y el nivel de riesgo asociado.
- **RouterAgent**: Identifica la entidad competente para dar respuesta.
- **DeduplicatorAgent**: Compara la solicitud con el historial usando embeddings para evitar reprocesos.
- **Summary**: Genera un resumen ejecutivo conciso del contenido.
- **Fallback heurístico**: Capacidad de operación básica mediante reglas si no se dispone de una API key de OpenAI.

### Dashboard y analíticas
- **7 KPI cards**: Visualización de total de solicitudes, pendientes, aprobadas, corregidas, enrutadas, confianza promedio y tasa de resolución.
- **Gráficos interactivos**: Tendencias temporales, distribución por canal, tipo y urgencia, carga de trabajo por entidad y temas recurrentes.
- **Filtros globales**: Segmentación de datos por rango de fechas, canal de entrada y nivel de urgencia.

### Bandeja operativa
- **Gestión centralizada**: Tabla de solicitudes pendientes con indicadores visuales de estado, urgencia y canal.
- **Acciones rápidas**: Interfaz para aprobar sugerencias de la IA, corregir clasificaciones o enrutar a dependencias.
- **Trazabilidad completa**: Acceso detallado a la traza del pipeline de IA y registros de auditoría por cada acción humana.

### Catálogo histórico
- **Repositorio completo**: Historial de todas las PQRS procesadas con capacidades de búsqueda y filtros avanzados.
- **Paginación y exportación**: Gestión eficiente de grandes volúmenes de datos con opciones de salida.

### Reportes
- **Exportación multiformato**: Generación de reportes detallados en formatos CSV, XLSX y PDF.

### Integraciones
- **Panel dedicado**: Configuración visual para Correo Entrante (IMAP) y API Externa.
- **Herramientas de diagnóstico**: Prueba de conexión IMAP, sincronización manual y regeneración de API keys.
- **Documentación integrada**: Guía técnica y ejemplos de uso para el consumo de la API.

## Arquitectura

### Estructura de Monorepo
```text
apps/api (NestJS) <---> apps/web (Next.js)
       |                      |
       +--- packages/shared --+
       |
services/pdf-extractor (Node.js/OCR)
```

### Backend
El núcleo del sistema está construido con NestJS, utilizando Prisma como ORM para interactuar con una base de datos PostgreSQL 15 potenciada con la extensión pgvector para búsquedas semánticas.

### Frontend
La interfaz de usuario utiliza Next.js 15 con App Router, React 19 y Tailwind CSS, garantizando una experiencia fluida y reactiva para el operador.

### Pipeline multiagente
```text
Ingesta -> ClassifierAgent -> RiskDetectorAgent -> RouterAgent -> DeduplicatorAgent -> SummaryAgent -> Persistencia
```

## Stack tecnológico

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Package Manager | pnpm 9+ (workspaces) |
| Backend | NestJS 10, Prisma 5, PostgreSQL 15, pgvector |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, Recharts |
| IA/LLM | OpenAI GPT-4o-mini + fallback heurístico |
| OCR | Tesseract.js, pdftoppm (poppler-utils) |
| Validación | Zod |
| Testing | Jest (API), Vitest (Web) |
| Containerización | Docker + Docker Compose |

## Modelo de datos

### Tabla: pqrs
| Campo | Tipo | Descripción |
|---|---|---|
| id | String | Identificador único (UUID) |
| texto | String | Contenido extraído de la solicitud |
| sourceType | Enum | Origen del archivo (manual_text, pdf, txt, image) |
| canal | Enum | Canal de entrada (web, email, api) |
| remitente | String | Identificación o correo del solicitante |
| asunto | String | Título o breve descripción |
| adjuntos | Json | Lista de archivos asociados |
| tipo | String | Categoría de la PQRS |
| tema | String | Área temática general |
| subtema | String | Detalle específico del tema |
| urgencia | Enum | Nivel de prioridad asignado |
| entidad | String | Dependencia responsable sugerida |
| riesgo | Enum | Nivel de riesgo detectado |
| resumen | String | Versión corta generada por IA |
| confianza | Float | Score de certidumbre del pipeline |
| estado | Enum | Estado actual (pendiente, aprobado, corregido, enrutado) |
| ocrUsado | Boolean | Indica si se requirió procesamiento OCR |
| advertenciaOcr | Boolean | Indica si se generó advertencia por calidad OCR baja |
| pipelineTrace | Json | Detalle de la ejecución por cada agente |
| embedding | Vector | Representación vectorial para búsqueda semántica |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Fecha de última actualización |

### Tabla: audit_logs
| Campo | Tipo | Descripción |
|---|---|---|
| id | String | Identificador único |
| pqrsId | String | Relación con la PQRS |
| accion | String | Acción realizada (aprobar, corregir, enrutar) |
| usuario | String | Identificador del operador |
| detalles | Json | Cambios realizados o notas |
| createdAt | DateTime | Fecha del evento |

### Tabla: settings
| Campo | Tipo | Descripción |
|---|---|---|
| key | String | Clave de configuración (PK) |
| value | Json | Valor de la configuración |
| updatedAt | DateTime | Fecha de actualización |

## API Reference

| Método | Ruta | Descripción |
|---|---|---|
| POST | /triage | Ejecutar pipeline de triage |
| GET | /pqrs | Listar PQRS (paginado, filtros) |
| GET | /pqrs/:id | Detalle de PQRS |
| GET | /pqrs/:id/trace | Trazas pipeline + audit logs |
| PATCH | /pqrs/:id/approve | Aprobar sugerencia IA |
| PATCH | /pqrs/:id/correct | Corregir clasificación |
| PATCH | /pqrs/:id/route | Enrutar a dependencia |
| POST | /ingest/email | Recibir PQRS por correo (webhook) |
| POST | /ingest/webhook | Recibir PQRS por API externa |
| GET | /ingest/api-info | Info de configuración API |
| POST | /ingest/regenerate-api-key | Regenerar API key |
| GET | /stats/overview | KPIs generales |
| GET | /stats/by-channel | Distribución por canal |
| GET | /stats/by-type | Distribución por tipo |
| GET | /stats/by-urgency | Distribución por urgencia |
| GET | /stats/by-entity | Carga por entidad |
| GET | /stats/by-topic | Temas frecuentes |
| GET | /stats/trends | Tendencias temporales |
| GET | /reports/export | Exportar reportes (CSV/XLSX/PDF) |
| POST | /email-reader/config | Guardar config IMAP |
| GET | /email-reader/config | Obtener config IMAP |
| POST | /email-reader/test | Probar conexión IMAP |
| POST | /email-reader/sync | Sincronizar correos |
| GET | /email-reader/status | Estado del lector |

Documentación Swagger interactiva: `http://localhost:4000/api/docs`

## Flujo end-to-end

### 1. Flujo Manual
1. El operador ingresa el texto o carga un documento en el portal web.
2. El sistema extrae el contenido y ejecuta el pipeline de triage.
3. La solicitud aparece en la bandeja de entrada para revisión.
4. El funcionario valida la sugerencia y realiza una acción (aprobar/corregir/enrutar).

### 2. Flujo de Email
1. Llega un correo electrónico a la cuenta configurada.
2. El servicio de polling IMAP detecta el mensaje y extrae texto y adjuntos.
3. Se dispara el triage automático y se clasifica la solicitud sin intervención inicial.
4. El operador gestiona la solicitud desde la bandeja de entrada.

### 3. Flujo de API Externa
1. Un sistema externo envía una PQRS mediante una petición POST al endpoint de webhook.
2. El sistema valida la API key y procesa el contenido mediante el pipeline multiagente.
3. La solicitud queda disponible inmediatamente para la revisión del equipo operativo.

## Setup local

### Requisitos previos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### Instalación paso a paso
1. Clonar el repositorio.
2. Ejecutar `pnpm install` para instalar dependencias.
3. Crear el archivo de configuración: `cp .env.example .env`.
4. Iniciar los servicios de infraestructura: `docker compose up -d`.
5. Ejecutar migraciones de base de datos: `pnpm db:migrate`.
6. Poblar la base de datos con datos de prueba: `pnpm db:seed`.
7. Iniciar el entorno de desarrollo: `pnpm dev`.
8. Acceder a la aplicación en `http://localhost:3000`.

### Puertos utilizados
- **Web**: 3000
- **API**: 4000
- **PDF Extractor**: 4100
- **PostgreSQL**: 5432

### Comando para liberar puertos
```bash
for p in 3000 4000 4100 5432; do fuser -k ${p}/tcp 2>/dev/null || true; done
```

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| DATABASE_URL | Sí | - | Connection string para PostgreSQL |
| API_PORT | No | 4000 | Puerto de escucha para la API NestJS |
| CORS_ORIGIN | No | http://localhost:3000 | Origen permitido para CORS |
| NEXT_PUBLIC_APP_NAME | No | AI PQRS Triage | Nombre visible de la aplicación |
| NEXT_SERVER_API_URL | No | http://localhost:4000 | URL interna para comunicación Web-API |
| PDF_EXTRACTOR_URL | No | http://localhost:4100 | URL del microservicio de extracción PDF |
| LLM_PROVIDER | No | openai | Proveedor de LLM a utilizar (openai, google) |
| OPENAI_API_KEY | No | - | API key de OpenAI. Si se omite, se usa el fallback |
| OPENAI_MODEL | No | gpt-4o-mini | Modelo de lenguaje para el pipeline |
| OPENAI_EMBEDDING_MODEL | No | text-embedding-3-small | Modelo para generación de embeddings |
| GOOGLE_API_KEY | No | - | API key para Google AI |
| GOOGLE_MODEL | No | gemini-2.0-flash | Modelo Google Gemini |
| GOOGLE_EMBEDDING_MODEL | No | text-embedding-004 | Modelo de embeddings de Google |
| INGEST_API_KEY | No | - | Key para peticiones de webhook. Si está vacía, no valida |

## Ejemplo: API externa

### Obtener API key
```bash
curl -X POST http://localhost:4000/ingest/regenerate-api-key
```

### Enviar PQRS
```bash
curl -X POST http://localhost:4000/ingest/webhook \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU_API_KEY_AQUI" \
  -d '{
    "texto": "Solicito informacion sobre el estado de mi tramite de licencia ambiental radicado el 15 de abril de 2026.",
    "remitente": "ciudadano@correo.com",
    "asunto": "Seguimiento tramite RAD-2026-0451"
  }'
```

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Levanta todos los servicios en modo desarrollo |
| `pnpm build` | Genera los builds de producción para todos los paquetes |
| `pnpm typecheck` | Ejecuta la verificación de tipos de TypeScript |
| `pnpm test` | Ejecuta la suite completa de pruebas unitarias e integración |
| `pnpm db:migrate` | Aplica las migraciones pendientes en la base de datos |
| `pnpm db:seed` | Inserta datos iniciales de prueba en la base de datos |

## Estructura del repositorio
```text
.
├── apps/
│   ├── api/                   # Backend desarrollado en NestJS
│   │   ├── prisma/            # Definición del esquema y migraciones
│   │   └── src/
│   │       ├── common/        # Servicios globales y guardias
│   │       └── modules/
│   │           ├── triage/    # Lógica del pipeline multiagente
│   │           ├── pqrs/      # Gestión de la bandeja operativa
│   │           ├── ingest/    # Módulos de ingesta (Email, Webhook)
│   │           ├── stats/     # Generación de analíticas y KPIs
│   │           ├── reports/   # Lógica de exportación de reportes
│   │           └── email-reader/ # Implementación del polling IMAP
│   └── web/                   # Frontend desarrollado en Next.js
│       └── src/
│           ├── app/           # Estructura de páginas (App Router)
│           ├── components/    # Componentes de UI reutilizables
│           └── actions/       # Acciones de servidor (Server Actions)
├── packages/
│   └── shared/                # Contratos, tipos y validaciones compartidas
├── services/
│   └── pdf-extractor/         # Microservicio para OCR y extracción de PDF
├── docker-compose.yml         # Configuración de contenedores
└── example-data/              # Documentos de prueba para validación
```

## Testing

El proyecto mantiene un alto estándar de calidad mediante pruebas automatizadas:

```bash
# Ejecución de pruebas del Backend (Jest) — 82 tests
pnpm --filter @ai-pqrs-triage/api test

# Ejecución de pruebas del Frontend (Vitest) — 14 tests
pnpm --filter @ai-pqrs-triage/web test

# Verificación global de tipos
pnpm typecheck
```

## Licencia
Este proyecto está bajo la Licencia MIT.
