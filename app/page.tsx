import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AK Web Solutions
        </h1>
        <p className="text-lg text-slate-400">
          Het klantportaal voor het beheren van je website, facturen, klanten en
          meer. Alles vanuit één plek.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              Inloggen
            </Button>
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Nog geen account? Neem contact op met AK Web Solutions.
        </p>
      </div>
    </div>
  );
}
