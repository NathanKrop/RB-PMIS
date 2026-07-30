import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route-to-role mapping for authorization
const routeRoleMap: Record<string, string> = {
  "/dashboard/department": "department_user",
  "/dashboard/officer": "reporting_officer",
  "/dashboard/management": "management",
};

function getRequiredRole(pathname: string): string | null {
  for (const [prefix, role] of Object.entries(routeRoleMap)) {
    if (pathname.startsWith(prefix)) return role;
  }
  return null;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users to login
  if (!user && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith("/auth")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (role === "reporting_officer") {
      return NextResponse.redirect(new URL("/dashboard/officer", request.url));
    } else if (role === "management") {
      return NextResponse.redirect(new URL("/dashboard/management", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/department", request.url));
    }
  }

  // Route-level role authorization for dashboard paths
  if (user) {
    const requiredRole = getRequiredRole(pathname);
    if (requiredRole) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && profile.role !== requiredRole) {
        // Redirect to the correct dashboard for their role
        const roleRedirect: Record<string, string> = {
          department_user: "/dashboard/department",
          reporting_officer: "/dashboard/officer",
          management: "/dashboard/management",
        };
        return NextResponse.redirect(
          new URL(roleRedirect[profile.role] ?? "/dashboard/department", request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
