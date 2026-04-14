ALTER TABLE "pqrs"
ADD COLUMN "sourceType" TEXT DEFAULT 'manual_text',
ADD COLUMN "pipelineTrace" JSONB;
