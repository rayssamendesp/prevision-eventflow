import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {[
        { to: "/eventos", label: "Eventos" },
        { to: "/descartados", label: "Descartados" },
      ].map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
          activeProps={{ className: "bg-foreground/5 text-accent" }}
          activeOptions={{ exact: false }}
        >
          {({ isActive }) => (
            <>
              <span
                className={
                  isActive
                    ? "flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/20"
                    : "size-4 shrink-0 rounded-full border border-input"
                }
              >
                {isActive ? <span className="size-1.5 rounded-full bg-accent" /> : null}
              </span>
              {item.label}
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="mb-8 p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="size-5 rounded-sm bg-primary" />
        <span className="font-display text-sm font-semibold tracking-tight">Prevision</span>
      </div>
      <p className="label-caps">Gestão de Eventos</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-panel lg:flex">
        <Brand />
        <NavItems />
        <div className="border-t border-border p-4">
          <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>
          <button
            onClick={signOut}
            className="mt-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3" /> Sair
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-panel px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-sm bg-primary" />
          <span className="font-display text-sm font-semibold">Gestão de Eventos</span>
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
      </header>

      {open ? (
        <div className="border-b border-border bg-panel py-3 lg:hidden">
          <NavItems onNavigate={() => setOpen(false)} />
          <button
            onClick={signOut}
            className="mt-3 px-6 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Sair
          </button>
        </div>
      ) : null}

      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
