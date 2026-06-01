## Diagnosi

La lince sembra "schiantata" perché:

1. **Le animazioni interne del GLB non vengono mai riprodotte.** Il file `lynx.glb` con ogni probabilità contiene clip skeletali (idle / walk / jump / sit). Noi però usiamo solo `useGLTF` e ignoriamo `animations[]`. Senza `useAnimations(...).actions[...].play()` lo scheletro resta in T-pose o nella posa di bind → il modello viene solo traslato/ruotato in blocco come una statua.
2. **Le preset proceduralI muovono solo il root group**, quindi non c'è vita interna (niente coda, niente orecchie, niente respiro). Inoltre le ampiezze sono piccole rispetto al frame: in una canvas di 180px un `y = 0.04` di bob è invisibile.
3. **Nessuno squash & stretch**: `LynxTransform.scale` è uno scalare, quindi non possiamo schiacciare la lince all'atterraggio o allungarla in volo — proprio quello che dà il feel "cartoon".

## Cosa cambio

### 1. Suonare le clip del GLB (`LynxModel.tsx`)
- Usare `useAnimations(animations, groupRef)` da `@react-three/drei`.
- Al mount, loggare una sola volta i nomi delle clip disponibili (utile per debug; il log viene lasciato in dev e rimosso dopo).
- Mappa preset → clip (con fallback fuzzy sui nomi più comuni del modello):
  - `entrance-sit` → `Sit` / `Idle_Sit` / primo che matcha `sit`
  - `peek-tap`     → `Idle` / `Look` / `Sniff`
  - `walk-pat`     → `Walk` / `Run`
  - `leap-across`  → `Jump` / `Leap` / `Run`
  - `crouch-radar` → `Crouch` / `Idle` (lento)
  - `guard-sit`    → `Sit` / `Idle`
- Crossfade fra clip con `action.fadeOut(0.25)` / `next.reset().fadeIn(0.25).play()`.
- Se il GLB non ha clip, restiamo sul movimento procedurale ma con le amplificazioni del punto 3 — così non si vede comunque una statua.

### 2. Squash & stretch (tipo `lynx-animations.ts` + `LynxModel.tsx`)
- Sostituire `scale: number` con `scale: [number, number, number]` in `LynxTransform`.
- Aggiornare `IDENTITY`, `blendTransforms`, tutte le preset, e `g.scale.set(sx*fit, sy*fit, sz*fit)`.
- Applicare squash all'atterraggio di `leap-across` (es. `[1.15, 0.85, 1.15]`) e stretch in volo (`[0.9, 1.15, 0.9]`).

### 3. Preset più "buffe" (`lynx-animations.ts`)
- `entrance-sit`: ingresso con due rimbalzi parabolici (non uno solo), wiggle finale della testa (yaw ±0.15 rad) e respiro visibile (scale Y ±0.04 a 1.5 Hz).
- `peek-tap`: peek che parte da `-0.9` invece di `-0.6`, tap più marcato (nod 0.4 rad) e ogni 1.2s un piccolo tilt testa.
- `walk-pat`: cammino con cycle più corto (3s), bob ±0.12, roll ±0.18, e dopo il pat un saltello.
- `leap-across`: arco più alto (1.2), stretch in salita / squash in atterraggio, mini-rimbalzo dopo il landing prima di completare.
- `crouch-radar`: twitch della coda più frequente (ogni 0.2s) + scan della testa (yaw sinusoidale ±0.3 rad).
- `guard-sit`: sway leggero ma con occasionale "ear-perk" (scala Y a impulso ogni 3s).

### 4. Camera e inquadratura (`LynxCanvas.tsx`)
- Verificare che con scale=1.4 + arc=1.2 il salto resti in frame. Se necessario, alzare `fov` a 35 o spostare camera a `[0, 0.9, 3.4]`. Lo aggiusto dopo il primo giro visivo.

## File toccati

- `src/components/lynx-guide/types.ts` — `LynxTransform.scale` diventa `[number, number, number]`.
- `src/components/lynx-guide/lynx-animations.ts` — aggiorno tipi, IDENTITY, blendTransforms e riscrivo le 6 preset.
- `src/components/lynx-guide/LynxModel.tsx` — `useAnimations`, mapping preset→clip, crossfade, scale non uniforme.
- (eventuale) `src/components/lynx-guide/LynxCanvas.tsx` — solo se l'inquadratura taglia il salto.

## Cosa NON tocco

- Routing, route `/`, demo page, layout, copy.
- `public/models/lynx.glb`.
- Auto-advance e API pubblica di `<LynxGuide />` (props invariate).

## Verifica

1. In preview, scorrere i 6 step: a vista la lince deve respirare/muoversi anche quando "ferma" (idle clip + respiro).
2. `walk-pat`: traversata visibilmente animata (zampe che si muovono se la clip esiste, altrimenti bob/roll marcati).
3. `leap-across`: arco visibile + squash all'atterraggio + auto-advance ancora funzionante.
4. Controllare il log dei nomi clip una volta per confermare il naming reale del GLB e affinare la mappa.
