import { NextResponse } from "next/server";

// Fast, client-visible guard only. It reads the non-httpOnly "role" cookie
// set at login to decide whether to redirect — it is NOT the source of
// truth for authorization. Every actual API call is still checked against
// the httpOnly JWT on the backend, so this can't be bypassed for real access,
// only for which page you initially land on.
export function middleware(request) {
  const role = request.cookies.get("role")?.value;
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/dashboard");
  const isLecturerRoute = pathname.startsWith("/my-timetable");

  if ((isAdminRoute || isLecturerRoute) && !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLecturerRoute && role !== "lecturer") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/my-timetable/:path*"],
};
