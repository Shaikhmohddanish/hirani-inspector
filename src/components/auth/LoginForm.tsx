"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500">
          Use the operator credentials from your deployment environment.
        </p>
      </div>
      <label className="block text-sm font-medium text-slate-700" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        className="w-full rounded-lg border text-black border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        placeholder="admin@example.com"
      />
      <label className="block text-sm font-medium text-slate-700" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        className="w-full rounded-lg text-black border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        placeholder="********"
      />
      {state?.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
