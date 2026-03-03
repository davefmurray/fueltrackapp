import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createServerClient } from "@supabase/ssr";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Employee routes — require employee JWT
  if (pathname.startsWith("/employee")) {
    const token = request.cookies.get("employee-session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("employee-session");
      return response;
    }
  }

  // Admin routes (except login) — require Supabase Auth session
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }

  // API routes for employee actions — require employee JWT
  if (
    pathname.startsWith("/api/mileage") ||
    pathname.startsWith("/api/photos") ||
    pathname.startsWith("/api/reports")
  ) {
    // Allow admin access via Supabase auth too (for admin report views)
    const token = request.cookies.get("employee-session")?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.next();
      } catch {
        // Fall through to check admin auth
      }
    }

    // Check admin auth for report APIs
    if (pathname.startsWith("/api/reports") || pathname.startsWith("/api/admin")) {
      const response = NextResponse.next({
        request: { headers: request.headers },
      });
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) return response;
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin API routes — require Supabase Auth
  if (pathname.startsWith("/api/admin")) {
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employee/:path*",
    "/admin/:path*",
    "/api/mileage/:path*",
    "/api/photos/:path*",
    "/api/reports/:path*",
    "/api/admin/:path*",
  ],
};
