import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

// Build matchers from the existing route-access map (legacy routes)
const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

// Named route matchers for new multi-tenant routes
const isSuperAdminRoute = createRouteMatcher(["/super-admin(.*)"]);
const isOrgRoute = createRouteMatcher(["/org/(.*)"]);

export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const metadata = sessionClaims?.metadata as {
    role?: string;
    organizationId?: string;
    orgSlug?: string;
  } | undefined;
  const role = metadata?.role;
  const pathname = req.nextUrl.pathname;

  // ── Super Admin routes ────────────────────────────────────────
  if (isSuperAdminRoute(req)) {
    if (!userId || role !== "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return; // allow
  }

  // ── Org-scoped routes: /org/[slug]/... ────────────────────────
  if (isOrgRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const slugFromUrl = pathname.split("/")[2];
    const userSlug = metadata?.orgSlug;

    // SUPER_ADMIN can access any org
    if (role === "super_admin") return;

    // Regular users must match their org slug
    if (slugFromUrl !== userSlug) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return; // allow
  }

  // ── Legacy role-based routes (/admin, /teacher, /student, /list/...) ──
  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role!)) {
      const redirectPath = role === "super_admin" ? "/super-admin/dashboard" : (role ? `/${role}` : "/");
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
