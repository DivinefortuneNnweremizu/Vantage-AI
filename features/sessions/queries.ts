import { prisma } from "@/lib/prisma";

export interface SessionListItem {
  id: string;
  title: string;
  /** Asset id of the image shown on the library card. */
  coverAssetId: string | null;
  updatedAt: Date;
}

/** Drafts without a finished report stay out of the library and sidebar. */
const ANALYZED = { deletedAt: null, latestAnalysisId: { not: null } } as const;

const LISTING = { id: true, title: true, coverAssetId: true, updatedAt: true } as const;

const SIDEBAR_SESSION_LIMIT = 6;

/** Most recent analyzed sessions for the sidebar. Always scoped to the owner. */
export async function listRecentSessions(userId: string): Promise<SessionListItem[]> {
  return prisma.designSession.findMany({
    where: { userId, ...ANALYZED },
    orderBy: { updatedAt: "desc" },
    take: SIDEBAR_SESSION_LIMIT,
    select: LISTING,
  });
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
  const items = hasMore ? rows.slice(0, LIBRARY_PAGE_SIZE) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

  return { items, nextCursor };
}
