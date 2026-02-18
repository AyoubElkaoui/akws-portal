"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Users,
  Ticket,
  Receipt,
  Globe,
  Settings,
  LayoutDashboard,
  Search,
} from "lucide-react";

interface SearchResults {
  tenants: Array<{
    id: string;
    companyName: string;
    slug: string;
    plan: string;
  }>;
  tickets: Array<{
    id: string;
    subject: string;
    status: string;
    tenant: { companyName: string };
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    status: string;
  }>;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (path: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  };

  const hasResults =
    results &&
    (results.tenants.length > 0 ||
      results.tickets.length > 0 ||
      results.invoices.length > 0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Zoeken...</span>
        <kbd className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Zoek klanten, tickets, facturen..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <CommandGroup heading="Navigatie">
              <CommandItem onSelect={() => navigate("/admin")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overzicht
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/klanten")}>
                <Users className="mr-2 h-4 w-4" />
                Klanten
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/tickets")}>
                <Ticket className="mr-2 h-4 w-4" />
                Tickets
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/facturatie")}>
                <Receipt className="mr-2 h-4 w-4" />
                Facturatie
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/onderhoud")}>
                <Globe className="mr-2 h-4 w-4" />
                Onderhoud
              </CommandItem>
              <CommandItem onSelect={() => navigate("/admin/instellingen")}>
                <Settings className="mr-2 h-4 w-4" />
                Instellingen
              </CommandItem>
            </CommandGroup>
          ) : loading ? (
            <div className="py-6 text-center text-sm text-slate-500">
              Zoeken...
            </div>
          ) : !hasResults ? (
            <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
          ) : (
            <>
              {results!.tenants.length > 0 && (
                <CommandGroup heading="Klanten">
                  {results!.tenants.map((t) => (
                    <CommandItem
                      key={t.id}
                      onSelect={() => navigate(`/admin/klanten/${t.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4 text-blue-500" />
                      <span>{t.companyName}</span>
                      <span className="ml-auto text-xs text-slate-400">
                        {t.plan}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results!.tickets.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Tickets">
                    {results!.tickets.map((t) => (
                      <CommandItem
                        key={t.id}
                        onSelect={() => navigate(`/admin/tickets/${t.id}`)}
                      >
                        <Ticket className="mr-2 h-4 w-4 text-orange-500" />
                        <span>{t.subject}</span>
                        <span className="ml-auto text-xs text-slate-400">
                          {t.tenant.companyName}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
              {results!.invoices.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Facturen">
                    {results!.invoices.map((inv) => (
                      <CommandItem
                        key={inv.id}
                        onSelect={() => navigate(`/admin/facturatie/${inv.id}`)}
                      >
                        <Receipt className="mr-2 h-4 w-4 text-purple-500" />
                        <span>{inv.invoiceNumber}</span>
                        <span className="ml-auto text-xs text-slate-400">
                          {inv.customerName}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
