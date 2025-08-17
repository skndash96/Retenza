import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const PROTECTED_ROUTES = {
  customer: ["/customer"],
  business: ["/business"],
};

export async function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const pathname = req.nextUrl.pathname ?? "";

  if (!sessionId) {
    if (pathname.startsWith(PROTECTED_ROUTES.business[0])) {
      return NextResponse.redirect(new URL("/login/business", req.url));
    }
    if (pathname.startsWith(PROTECTED_ROUTES.customer[0])) {
      return NextResponse.redirect(new URL("/login/customer", req.url));
    }
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  if (!session || new Date(session.expiresAt) < new Date()) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session_id");
    return response;
  }

const isBusinessRoute = pathname.startsWith(PROTECTED_ROUTES.business[0]);
const isCustomerRoute = pathname.startsWith(PROTECTED_ROUTES.customer[0]);

  if (isBusinessRoute && session.role !== 'business') {
    return NextResponse.redirect(new URL("/login/business", req.url));
  }

  if (isCustomerRoute && session.role !== 'user') {
    return NextResponse.redirect(new URL("/login/customer", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/business/:path*",
  ],
};