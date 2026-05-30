import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { LynxGuide, type LynxStep } from "@/components/lynx-guide";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lynx Guide — Demo FGB" },
      { name: "description", content: "Demo interattiva della lince 3D che guida l'utente attraverso i 6 step della piattaforma FGB." },
      { property: "og:title", content: "Lynx Guide — Demo FGB" },
      { property: "og:description", content: "Demo interattiva della lince 3D che guida l'utente attraverso i 6 step della piattaforma FGB." },
    ],
  }),
  component: Index,
});

const STEPS: {
  id: LynxStep;
  label: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  copy: string;
}[] = [
  {
    id: "welcome",
    label: "1. Welcome",
    placement: "center",
    copy: "Benvenuto nel mondo FGB! Io sono la tua guida. Ho una vista infallibile per i dati: segui le mie zampe per scoprire come padroneggiare questa piattaforma.",
  },
  {
    id: "search",
    label: "2. Search",
    placement: "bottom",
    copy: "Cerca qualunque cosa: brand, store, KPI. La mia vista non perde un dettaglio.",
  },
  {
    id: "map",
    label: "3. Map",
    placement: "top",
    copy: "Cammino sulla mappa per mostrarti come muoverti tra le regioni e i punti vendita.",
  },
  {
    id: "region-buttons",
    label: "4. Region buttons",
    placement: "right",
    copy: "Un balzo elegante per saltare da una regione all'altra. Auto-advance al termine del salto.",
  },
  {
    id: "module-filters",
    label: "5. Module filters",
    placement: "left",
    copy: "Accovacciata, orecchie come radar: filtro i moduli e ascolto i sensori.",
  },
  {
    id: "scope",
    label: "6. Scope & Brand",
    placement: "top",
    copy: "Domina il branco. Scelgo un gruppo o un brand specifico per concentrare tutta la vista su un singolo ecosistema.",
  },
];

function Index() {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const current = STEPS[stepIndex];

  const goNext = () => setStepIndex((i) => (i + 1) % STEPS.length);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto max-w-4xl px-6 pt-12 pb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Lynx Guide — Demo FGB
        </h1>
        <p className="mt-2 text-muted-foreground">
          Mascotte 3D ancorata al tooltip della guida. Scegli uno step per vedere
          la preset di animazione corrispondente.
        </p>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 pb-24">
        <nav className="flex flex-wrap justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIndex(i)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                i === stepIndex
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div
          ref={tooltipRef}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
          role="tooltip"
        >
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {current.label} · placement: {current.placement}
          </div>
          <p className="text-base leading-relaxed">{current.copy}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() =>
                setStepIndex((i) => (i - 1 + STEPS.length) % STEPS.length)
              }
              className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              ← Precedente
            </button>
            <button
              onClick={goNext}
              className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90"
            >
              Successivo →
            </button>
          </div>
        </div>

        <p className="max-w-md text-center text-sm text-muted-foreground">
          La lince è posizionata in modo fisso rispetto al tooltip qui sopra.
          Nello step <em>Region buttons</em> l'animazione "leap-across" avanza
          automaticamente al termine del salto.
        </p>
      </main>

      <LynxGuide
        step={current.id}
        anchorRef={tooltipRef}
        placement={current.placement}
        autoAdvance={current.id === "region-buttons"}
        onAutoAdvanceComplete={goNext}
      />
    </div>
  );
}
