create schema if not exists vantage;
set search_path to vantage;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'VANTAGE_PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PageScope" AS ENUM ('SINGLE_PAGE', 'JOURNEY');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('APP', 'WEB');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE', 'PDF_PAGE', 'FIGMA_FRAME', 'URL_CAPTURE');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "TakeawayKind" AS ENUM ('STRENGTH', 'PAIN_POINT');

-- CreateEnum
CREATE TYPE "Valence" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR', 'STRENGTH');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "IterationStatus" AS ENUM ('NEW', 'PERSISTING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
    "flutterwaveCustomerId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "pageScope" "PageScope" NOT NULL,
    "platform" "Platform" NOT NULL,
    "goal" TEXT,
    "coverAssetId" UUID,
    "latestAnalysisId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DesignSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "thumbPath" TEXT,
    "contentHash" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "figmaFileKey" TEXT,
    "figmaNodeId" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "iteration" INTEGER NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'QUEUED',
    "pageScope" "PageScope" NOT NULL,
    "platform" "Platform" NOT NULL,
    "goal" TEXT,
    "overallScore" INTEGER,
    "intuitiveScore" INTEGER,
    "trustedScore" INTEGER,
    "valuableScore" INTEGER,
    "scoreBreakdown" JSONB,
    "overallTakeaway" TEXT,
    "rubricVersion" TEXT,
    "promptVersion" TEXT,
    "principleLibraryVersion" TEXT,
    "model" TEXT,
    "rawOutput" JSONB,
    "durationMs" INTEGER,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisAsset" (
    "analysisId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AnalysisAsset_pkey" PRIMARY KEY ("analysisId","assetId")
);

-- CreateTable
CREATE TABLE "Takeaway" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "kind" "TakeawayKind" NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Takeaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "assetId" UUID,
    "valence" "Valence" NOT NULL,
    "severity" "Severity" NOT NULL,
    "category" TEXT NOT NULL,
    "principleId" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "markerX" DOUBLE PRECISION,
    "markerY" DOUBLE PRECISION,
    "iterationStatus" "IterationStatus",

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "change" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "principleId" TEXT NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFinding" (
    "recommendationId" UUID NOT NULL,
    "findingId" UUID NOT NULL,

    CONSTRAINT "RecommendationFinding_pkey" PRIMARY KEY ("recommendationId","findingId")
);

-- CreateTable
CREATE TABLE "SuggestedPrompt" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "SuggestedPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "analysisId" UUID,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "path" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("path")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignSession_latestAnalysisId_key" ON "DesignSession"("latestAnalysisId");

-- CreateIndex
CREATE INDEX "DesignSession_userId_deletedAt_updatedAt_idx" ON "DesignSession"("userId", "deletedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "Asset_sessionId_order_idx" ON "Asset"("sessionId", "order");

-- CreateIndex
CREATE INDEX "Analysis_sessionId_status_idx" ON "Analysis"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_sessionId_iteration_key" ON "Analysis"("sessionId", "iteration");

-- CreateIndex
CREATE INDEX "Takeaway_analysisId_kind_order_idx" ON "Takeaway"("analysisId", "kind", "order");

-- CreateIndex
CREATE INDEX "Finding_analysisId_valence_idx" ON "Finding"("analysisId", "valence");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_analysisId_rank_key" ON "Recommendation"("analysisId", "rank");

-- CreateIndex
CREATE INDEX "SuggestedPrompt_analysisId_order_idx" ON "SuggestedPrompt"("analysisId", "order");

-- CreateIndex
CREATE INDEX "AssistantMessage_sessionId_createdAt_idx" ON "AssistantMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignSession" ADD CONSTRAINT "DesignSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignSession" ADD CONSTRAINT "DesignSession_latestAnalysisId_fkey" FOREIGN KEY ("latestAnalysisId") REFERENCES "Analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DesignSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DesignSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisAsset" ADD CONSTRAINT "AnalysisAsset_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisAsset" ADD CONSTRAINT "AnalysisAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Takeaway" ADD CONSTRAINT "Takeaway_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFinding" ADD CONSTRAINT "RecommendationFinding_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationFinding" ADD CONSTRAINT "RecommendationFinding_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedPrompt" ADD CONSTRAINT "SuggestedPrompt_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DesignSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

