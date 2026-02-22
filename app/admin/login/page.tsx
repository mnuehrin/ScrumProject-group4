"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.replace("/admin");
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card px-6 py-7 shadow-sm">
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <h1 className="sr-only">Sign in</h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            placeholder="admin@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Invalid email or password.
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </section>
  );
}
