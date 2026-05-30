## Obiettivo

Sostituire il placeholder `src/routes/index.tsx` con una pagina dimostrativa che mostra `<LynxGuide />` in tutti e 6 i suoi step, così `https://lynx-guide-buddy.lovable.app` mostra la lince in azione invece del messaggio "Your app will live here".

## Cosa costruisco

Una singola pagina (`src/routes/index.tsx`) con:

1. **Header** — titolo "Lynx Guide — Demo" e sottotitolo che spiega cosa si sta vedendo.
2. **Card tooltip simulato** al centro della pagina (`ref` su un `<div>`) — funge da anchor element per la lince, esattamente come farebbe un tooltip della tua guida FGB reale.
3. **Pannello di controllo** con 6 bottoni, uno per step:
   - Welcome (`entrance-sit`, placement `center`)
   - Search (`peek-tap`, placement `bottom`)
   - Map (`walk-pat`, placement `top`)
   - Region buttons (`leap-across`, placement `right`, con `autoAdvance`)
   - Module filters (`crouch-radar`, placement `left`)
   - Scope (`guard-sit`, placement `top`)
4. **Copy descrittiva** sotto il tooltip che cambia in base allo step (riprende i testi che mi avevi dato all'inizio).
5. **LynxGuide montato** con `step`, `anchorRef`, `placement` e `onAutoAdvanceComplete` che avanza al passo successivo quando la lince completa il "leap-across".

## Aggiornamenti minori

- `head()` della route: title "Lynx Guide — Demo FGB", description e og: coerenti.
- Nessuna modifica ai componenti `lynx-guide/*`, all'animazione, al modello, o ai file server.

## Dopo la build

Premi **Publish** in alto a destra per aggiornare `lynx-guide-buddy.lovable.app`. La preview interna si aggiorna automaticamente, ma il dominio pubblico richiede il publish manuale.

## File modificati

- `src/routes/index.tsx` → riscritto come demo page

## File NON toccati

- Tutta la cartella `src/components/lynx-guide/`
- `public/models/lynx.glb`
- `src/server.ts`, `src/start.ts`, `vite.config.ts`, workflow GitHub
