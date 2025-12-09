"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

export type LoginState = {
  message?: string;
};

export async function authenticate(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const user = (formData.get("email") ?? "").toString();
  const pass = (formData.get("password") ?? "").toString();

  const expectedUser = process.env.ADMIN_USER ?? "";
  const expectedPass = process.env.ADMIN_PASS ?? "";

  console.log("Login attempt:", { 
    user, 
    expectedUser, 
    userMatch: user === expectedUser,
    passMatch: pass === expectedPass,
    userLength: user.length,
    expectedUserLength: expectedUser.length,
    passLength: pass.length,
    expectedPassLength: expectedPass.length
  });

  if (!expectedUser || !expectedPass) {
    return { message: "Server credentials are not configured (.env)." };
  }

  if (user !== expectedUser || pass !== expectedPass) {
    return { message: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "active", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
