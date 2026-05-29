## Obiettivo

Costruire un componente React riutilizzabile `<LynxGuide />` che mostra una lince 3D animata ancorata al tooltip dello step corrente del tour. Tu lo importerai nel progetto vero (che ha già il sistema di tour) e gli passerai lo step attivo + il ref al tooltip. Niente sistema di tour qui, niente demo UI di contorno.

L'asset GLB sarà un modello **statico** (no skeleton). Tutte le animazioni — balzo, camminata, occhiolino, picchiettio della zampa, coda, orecchie radar — vengono prodotte con **trasformazioni Three.js**: posizione, rotazione, scala, easing, oscillazioni sinusoidali. Per "occhiolino" e "orecchie a radar" usiamo una piccola maschera CSS/SVG overlay sopra il canvas (limite del modello statico — vedi sezione "Limiti onesti").

## Cosa creo

### Setup
- Aggiungo dipendenze: `three`, `@react-three/fiber`, `@react-three/drei`.
- Convenzione asset: tu metti il modello in `public/models/lynx.glb`. Il componente accetta anche una prop `modelUrl` per override.

### Componenti

```text
src/components/lynx-guide/
├── LynxGuide.tsx          # entry point pubblico
├── LynxCanvas.tsx         # <Canvas> r3f + scena + luci
├── LynxModel.tsx          # GLB caricato + animator transform-based
├── lynx-animations.ts     # funzioni per-stato (idle, jump, sit, etc.)
├── lynx-overlay.tsx       # occhiolino + ear-twitch via SVG sopra canvas
├── useLynxAnchor.ts       # calcola posizione/dimensione dal ref del tooltip
└── types.ts               # LynxStep, LynxState, props
```

### API pubblica

```tsx
type LynxStep =
  | "welcome" | "search" | "map"
  | "region-buttons" | "module-filters" | "scope";

<LynxGuide
  step={currentStepId}
  anchorRef={tooltipRef}     // ref al tooltip dello step corrente
  placement="bottom"          // top | bottom | left | right | center
  autoAdvance={false}         // true per lo step region-buttons (balzo+click)
  onAutoAdvanceComplete={() => goToNextStep()}
  modelUrl="/models/lynx.glb" // opzionale
/>
```

Internamente mappa `step` → preset di animazione:

| Step              | Preset            | Cosa fa il transform                                                                 |
|-------------------|-------------------|--------------------------------------------------------------------------------------|
| welcome           | `entrance + sit`  | Scala da 0, balzo parabolico verso il centro del tooltip, atterra in posizione seduta, leggero head-bob, overlay occhiolino dopo 1.2s |
| search            | `peek-and-tap`    | Sbuca dal basso del tooltip (clip-path), zampa anteriore oscilla picchiettando l'input |
| map               | `walk-and-pat`    | Cammina lateralmente sopra il tooltip (translate X sinusoidale + bob), si ferma e fa "tap" con la zampa |
| region-buttons    | `leap-across`     | Balzo atletico parabolico da sx a dx, schiaccia visivamente il bottone (scale Y momentaneo), poi `onAutoAdvanceComplete` |
| module-filters    | `crouch-radar`    | Accucciata, coda oscilla a scatti (rot Z step), overlay SVG orecchie ruotano come radar |
| scope             | `guard-sit`       | Seduta dritta a lato del tooltip, micro-movimenti idle                               |

### Posizionamento (anchored to tooltip)

`useLynxAnchor` legge `getBoundingClientRect()` del `anchorRef` + `placement` e produce uno style fisso per il container del canvas (es. `position: fixed; top/left calcolati`). Si aggiorna su `resize` e `scroll` con `ResizeObserver`. Il canvas è un quadrato di ~180px (configurabile) posizionato adiacente al tooltip. Nessun overlay full-screen, niente intercettazione di click (`pointer-events: none` sul canvas).

### Animator transform-based

`LynxModel` carica il GLB con `useGLTF`, lo wrappa in un `<group>` controllato. Un piccolo state machine in `lynx-animations.ts` calcola, ad ogni frame `useFrame`, posizione/rotazione/scala in base a:
- preset corrente
- tempo dall'ingresso dello step
- easing (cubic, elastic per il balzo)
- per `leap-across`: traiettoria parabolica + callback a fine traiettoria che chiama `onAutoAdvanceComplete`

Transizioni tra step: blend lineare di 250ms tra il transform finale del preset uscente e iniziale del nuovo, per evitare salti.

### Overlay (occhiolino + orecchie radar)

Siccome il modello è statico, occhi e orecchie non si possono animare via skeleton. Soluzione: un `<svg>` overlay assolutamente posizionato sopra il canvas, con due piccoli sprite (forme di occhio chiuso e orecchie) che si attivano solo nei preset `welcome` (wink una volta) e `module-filters` (ear twitch ciclico). È un compromesso visivo onesto: funziona bene se la camera è frontale e fissa, può apparire fuori asse se la lince ruota molto. Per `module-filters` la lince è ferma, quindi è perfetto.

## Limiti onesti (da sapere subito)

1. **Niente camminata realistica**: senza skeleton le zampe non si muovono indipendentemente. La "camminata" è il corpo intero che trasla con un bob verticale + lieve rollio. Sembra una mascotte che fluttua-cammina, non un felino fotorealistico. Se vuoi vere zampe in movimento serve un GLB riggato con clip `Walk`.
2. **"Picchiettio della zampa" e "click del bottone"**: simulati ruotando l'intero modello in avanti di pochi gradi con easing rapido (effetto "head-nod"). Convince come gesto stilizzato, non come vera animazione anatomica.
3. **Occhiolino e orecchie a radar**: fatti via SVG overlay 2D sopra il canvas, non sul modello 3D. Funziona solo con camera frontale fissa.
4. **Performance**: un canvas r3f sempre montato costa qualche MB di RAM e ~1-3% CPU su desktop. Smonto il `<Canvas>` quando `step` è `null` per azzerarlo tra una sessione di tour e l'altra.
5. **Asset GLB**: deve essere ottimizzato (Draco/Meshopt consigliati, <2MB). Se il tuo modello è grosso, le prime animazioni avranno un flash di caricamento — aggiungo un Suspense fallback trasparente.

## Cosa NON faccio in questo task

- Non creo il sistema di tour (highlight, tooltip, autoAdvanceMs interno, stepper). Tu lo hai già.
- Non creo pagine demo né route di test.
- Non aggiungo backend / Lovable Cloud.
- Non genero io il file GLB.

## Dopo l'approvazione

In build mode eseguirò, in ordine:
1. `bun add three @react-three/fiber @react-three/drei`
2. Creo i file in `src/components/lynx-guide/`
3. Scrivo un breve `README.md` nella cartella con esempi di integrazione per ciascuno dei 6 step e il contratto del file `lynx.glb` (orientamento +Z forward, +Y up, scala ~1 unità = ~1m, origine ai piedi).
4. Verifico build TS clean.

Per testare visivamente dovrai integrarlo nel tuo progetto vero (o, se vuoi, in un secondo task creo una mini route `/lynx-preview` con 6 bottoni per cambiare step — dimmelo).
