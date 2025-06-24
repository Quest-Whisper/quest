import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Define public paths (no authentication required)
const publicPaths = [
  "/",
  "/login",
  "/pricing",
  "/waitlist",
  "/contact",
  "/about",
  "/terms-of-service",
  "/privacy-policy",
];

// Define API paths that should be excluded from this middleware logic
const excludedApiPaths = [
  "/api/auth", // Excludes all under /api/auth for NextAuth operations
];

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Check if the path is an excluded API path
  if (excludedApiPaths.some((apiPath) => pathname.startsWith(apiPath))) {
    return NextResponse.next();
  }

  // Check if the path is public
  if (
    publicPaths.some(
      (path) =>
        pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
    )
  ) {
    return NextResponse.next();
  }

  // For all other paths, require authentication
  const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search); // Preserve query params
    return NextResponse.redirect(loginUrl);
  }

  const interestUrl = new URL("/interests", request.url);

   // Rule for /chat - Admin only
   if (pathname.startsWith("/chat")) {
    if (!token.hasInterests) {
      return NextResponse.redirect(interestUrl);
    }
  }

  // If no specific rule blocks access, allow the request
  return NextResponse.next();
}

// Apply middleware to all routes
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)", "/"],
};
