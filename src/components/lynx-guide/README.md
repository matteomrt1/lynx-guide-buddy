# LynxGuide

Componente React riutilizzabile: lince 3D animata ancorata al tooltip dello step
corrente del tour FGB.

## Setup

1. Posiziona il modello in `public/models/lynx.glb` (o passa `modelUrl`).
2. Contratto del GLB statico:
   - **+Z forward**, **+Y up** (convenzione glTF).
   - Origine ai piedi della lince.
   - Bounding height circa 1 unità (la camera è tarata su questa scala).
   - Pose neutra: seduta o in piedi frontale, sguardo verso +Z.
   - Ottimizzato Draco/Meshopt, < 2MB consigliato.

Senza skeleton non è possibile muovere zampe/orecchie/palpebre indipendentemente.
Le animazioni sono trasformazioni dell'intero modello (posizione/rotazione/scala) +
un overlay SVG 2D per occhiolino e orecchie-radar.

## API

```tsx
import { LynxGuide, type LynxStep } from "@/components/lynx-guide";

<LynxGuide
  step={currentStepId}
  anchorRef={tooltipRef}
  placement="bottom"
  size={180}
  offset={12}
  autoAdvance={step === "region-buttons"}
  onAutoAdvanceComplete={() => tour.next()}
  modelUrl="/models/lynx.glb"
/>
```

## Mappatura step -> preset

| step              | placement consigliato | autoAdvance | preset         |
|-------------------|-----------------------|-------------|----------------|
| `welcome`         | `center`              | false       | entrance-sit (+ wink overlay) |
| `search`          | `bottom`              | false       | peek-tap       |
| `map`             | `left`                | false       | walk-pat       |
| `region-buttons`  | `top`                 | **true**    | leap-across (chiama `onAutoAdvanceComplete` a fine traiettoria) |
| `module-filters`  | `top`                 | false       | crouch-radar (+ ear-radar overlay) |
| `scope`           | `top`                 | false       | guard-sit      |

## Limiti noti

- Niente camminata anatomica: il corpo trasla con un bob+rollio.
- Wink/orecchie sono overlay SVG sopra al canvas: tarati per camera frontale fissa.
- Il "click" del bottone in `leap-across` e uno squash visivo, non un vero evento DOM. Triggera comunque `onAutoAdvanceComplete`.
- Il canvas resta `pointer-events: none` per non intercettare i click del tour.

## Performance

Smonta il componente passando `step={null}` quando il tour non e attivo per
rilasciare la GPU.