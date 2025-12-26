import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

// Routes that require authentication
const protectedRoutePrefix = "/app";
const onboardingRoute = "/onboarding";

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const pathname = nextUrl.pathname;

    // Check if it's a public route
    const isPublicRoute = publicRoutes.includes(pathname);

    // Check if it's a protected route
    const isProtectedRoute = pathname.startsWith(protectedRoutePrefix);
    const isOnboarding = pathname === onboardingRoute;

    // API routes and static files should pass through
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // If not logged in and trying to access protected routes, redirect to login
    if (!isLoggedIn && (isProtectedRoute || isOnboarding)) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in and on login/register page, redirect to app
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/app", nextUrl));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
    runtime: "nodejs",
};
