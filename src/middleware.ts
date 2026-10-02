import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify Admin & Protected Routes
  const isAdminLogin = pathname === "/admin-login" || pathname === "/admin/login";
  const isProtectedAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/admin");

  // Skip public auth API routes
  if (pathname.startsWith("/api/admin/auth/login")) {
    return NextResponse.next();
  }

  // Read admin token from cookie
  const token = request.cookies.get("admin_token")?.value;

  if (isAdminLogin) {
    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload) {
        // If not onboarded, redirect straight to onboarding
        if (!payload.hasCompletedOnboarding) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        // Already logged in & onboarded, redirect straight to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  if (isProtectedAdminRoute) {
    if (!token) {
      // If it's an API route, return 401 Unauthorized JSON
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Authentication required. Access token missing." },
          { status: 401 }
        );
      }

      // If it's a UI route, redirect to admin login with callbackUrl
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token validity
    const payload = await verifyAdminToken(token);
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Session expired or invalid token." },
          { status: 401 }
        );
      }
      const response = NextResponse.redirect(new URL("/admin-login", request.url));
      response.cookies.delete("admin_token");
      return response;
    }

    // STRICT ONBOARDING ENFORCEMENT:
    // If the admin has NOT completed onboarding, they CANNOT access any other page.
    if (!payload.hasCompletedOnboarding) {
      const isAllowedDuringOnboarding =
        pathname === "/onboarding" ||
        pathname.startsWith("/api/admin/onboarding") ||
        pathname.startsWith("/api/admin/auth/logout") ||
        pathname.startsWith("/api/admin/auth/me") ||
        pathname.startsWith("/api/admin/media/upload");

      if (!isAllowedDuringOnboarding) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, error: "Onboarding required before accessing this resource." },
            { status: 403 }
          );
        }
        // Redirect to /onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // Clone headers to pass authenticated admin info downstream
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-id", payload.adminId);
    requestHeaders.set("x-admin-email", payload.email);
    requestHeaders.set("x-admin-role", payload.roleSlug);
    requestHeaders.set("x-admin-department", payload.departmentCode);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin-login",
    "/dashboard/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/departments/:path*",
    "/roles/:path*",
    "/onboarding/:path*",
    "/api/admin/:path*",
  ],
};
