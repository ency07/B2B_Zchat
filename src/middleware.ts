import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!!"
);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/recovery", "/reset-password", "/wizard"];
const PUBLIC_PREFIXES = ["/portal"];

// Routes that are the landing page (no auth needed)
const LANDING_ROUTES = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicPrefix = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isLanding = LANDING_ROUTES.some((route) => pathname === route);
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".");

  if (isPublic || isPublicPrefix || isLanding || isStatic) {
    return NextResponse.next();
  }

  // Check session token
  const token = request.cookies.get("erp_session")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-tenant-id", payload.tenantId as string);
    response.headers.set("x-user-role", payload.role as string);

    return response;
  } catch {
    // Token expired or invalid
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
