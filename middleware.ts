import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/signin", "/signup", "/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // ถ้า secret หาย = อ่าน token ไม่ได้แน่นอน
    console.error("[MW] Missing AUTH_SECRET / NEXTAUTH_SECRET");
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const token = await getToken({ req, secret });

  // DEBUG ชั่วคราว
  console.log("[MW]", pathname, "token?", !!token, "role:", (token as any)?.role, "id:", (token as any)?.id);

  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/manage")) {
    const role = (token as any)?.role ?? "user";
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manage/:path*",
    "/dashboard/:path*",
    "/api/private/:path*",
  ],
};
