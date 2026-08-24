import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | Gestão de Eventos Externos Prevision" },
      {
        name: "description",
        content: "Acesso restrito à equipe de eventos da Prevision.",
      },
      { property: "og:title", content: "Entrar | Gestão de Eventos Externos Prevision" },
      {
        property: "og:description",
        content: "Acesso restrito à equipe de eventos da Prevision.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.navigate({ to: "/eventos" });
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar. Verifique e-mail e senha.");
      return;
    }
    router.navigate({ to: "/eventos" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-panel px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-5 rounded-sm bg-primary" />
            <span className="font-display text-sm font-semibold tracking-tight">Prevision</span>
          </div>
          <h1 className="font-display text-2xl font-medium">Gestão de Eventos Externos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso restrito à equipe interna. Use suas credenciais para entrar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl bg-canvas p-6 ring-1 ring-border"
        >
          <div>
            <label className="label-caps mb-1 block" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="label-caps mb-1 block" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            O cadastro é feito internamente. Fale com o administrador para liberar seu acesso.
          </p>
        </form>
      </div>
    </div>
  );
}
