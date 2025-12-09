export const SESSION_COOKIE = "gak_inspector_session";

export function isAuthenticated(cookieValue?: string | null): boolean {
  return cookieValue === "active";
}
