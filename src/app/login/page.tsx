import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Hirani Image Inspector</h1>
          <p className="mt-2 text-slate-600">GPT-4o powered civil engineering inspection</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
