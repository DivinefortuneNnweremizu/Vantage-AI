import "server-only";
import { prisma } from "@/lib/prisma";

export interface SessionListItem {
  id: string;
  title: string;
  /** Asset id of the image shown on the library card. */
  coverAssetId: string | null;
  updatedAt: Date;
  /** The overall score of the newest report, so similar-looking designs can be told apart. */
  score: number | null;
  /** Which version the newest report is (1 for the first). */
  version: number;
}

/** Drafts without a finished report stay out of the library and sidebar. */
const ANALYZED = { deletedAt: null, latestAnalysisId: { not: null } } as const;

const LISTING = {
  id: true,
  title: true,
  coverAssetId: true,
  updatedAt: true,
  latestAnalysis: { select: { overallScore: true, iteration: true } },
} as const;

type ListingRow = { id: string; title: string; coverAssetId: string | null; updatedAt: Date; latestAnalysis: { overallScore: number | null; iteration: number } | null };

function toListItem(row: ListingRow): SessionListItem {
  return {
    id: row.id,
    title: row.title,
    coverAssetId: row.coverAssetId,
    updatedAt: row.updatedAt,
    score: row.latestAnalysis?.overallScore ?? null,
    version: row.latestAnalysis?.iteration ?? 1,
  };
}

const SIDEBAR_SESSION_LIMIT = 6;

/** Most recent analyzed sessions for the sidebar. Always scoped to the owner. */
export async function listRecentSessions(userId: string): Promise<SessionListItem[]> {
  const rows = await prisma.designSession.findMany({
    where: { userId, ...ANALYZED },
    orderBy: { updatedAt: "desc" },
    take: SIDEBAR_SESSION_LIMIT,
    select: LISTING,
  });
  return rows.map(toListItem);
}

interface LibraryPage {
  items: SessionListItem[];
  nextCursor: string | null;
}

const LIBRARY_PAGE_SIZE = 24;

/** Design Library page, cursor-paginated. Always scoped to the owner. */
export async function listLibrarySessions(userId: string, cursor?: string): Promise<LibraryPage> {
  const rows = await prisma.designSession.findMany({
    where: { userId, ...ANALYZED },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: LIBRARY_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: LISTING,
  });

  const hasMore = rows.length > LIBRARY_PAGE_SIZE;
  const items = (hasMore ? rows.slice(0, LIBRARY_PAGE_SIZE) : rows).map(toListItem);
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
