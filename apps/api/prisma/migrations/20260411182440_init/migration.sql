-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "pqrs" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "tipo" TEXT,
    "tema" TEXT,
    "subtema" TEXT,
    "urgencia" TEXT,
    "entidad" TEXT,
    "riesgo" TEXT,
    "resumen" TEXT,
    "confianza" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pqrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "pqrsId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "detalles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_pqrsId_fkey" FOREIGN KEY ("pqrsId") REFERENCES "pqrs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
