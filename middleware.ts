import { NextResponse, type NextRequest } from "next/server";
import { DEV_KNOWN_COOKIE, DEV_SESSION_COOKIE, DEV_USER_COOKIE, isGuestAuthEnabled, isShowcaseMode, parseDevSession } from "@/features/auth/dev-auth";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

// The share-preview images must load for link previews (chat apps, social sites), which are not signed in.
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/auth/callback", "/api/health", "/opengraph-image", "/twitter-image"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refreshes the Supabase session cookie and protects every route outside
 * the public list. API routes still authenticate and authorize on their own.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Guest sign-in: local development, or showcase mode. See features/auth/dev-auth.ts.
  if (isGuestAuthEnabled()) {
    const { pathname } = request.nextUrl;
    // In showcase mode a session without its own account cookie does not count, so nobody lands on a shared account.
    const signedIn =
      parseDevSession(request.cookies.get(DEV_SESSION_COOKIE)?.value) !== null &&
      (!isShowcaseMode() || request.cookies.has(DEV_USER_COOKIE));
    // A browser that already has an account goes to Log in. A new visitor goes to Sign up, then onboarding.
    const entry = request.cookies.has(DEV_KNOWN_COOKIE) ? "/sign-in" : "/sign-up";
    const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
    if (!signedIn && !isAuthPage && !isPublicPath(pathname) && !pathname.startsWith("/api/")) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = entry;
      signInUrl.search = "";
      if (pathname !== "/" && entry === "/sign-in") signInUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(signInUrl);
    }
    if (signedIn && isAuthPage) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname) && !pathname.startsWith("/api/")) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
