// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Le videur regarde le badge (les cookies) de l'utilisateur
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // L'URL que l'utilisateur essaie de visiter
  const path = request.nextUrl.pathname;

  // 2. RÈGLE N°1 : Pas de badge = Dehors (retour à l'accueil)
  if (!token && (path.startsWith("/admin") || path.startsWith("/joueur"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. RÈGLE N°2 : Un Joueur essaie d'aller sur l'espace Admin = Dehors
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. RÈGLE N°3 : Un Admin essaie d'aller sur l'espace Joueur = Dehors
  if (path.startsWith("/joueur") && role !== "PLAYER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Si toutes les règles sont respectées, le videur ouvre la porte !
  return NextResponse.next();
}

// Configuration : On dit au videur de ne surveiller QUE ces dossiers
export const config = {
  matcher: ["/admin/:path*", "/joueur/:path*"],
};
