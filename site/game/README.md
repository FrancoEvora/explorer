# Um dia no Solaris — v1

Standalone 2D game at `/jogo/`, with a link from the existing image-based map. No WebGL, volumetric reconstruction, app installation, third-party libraries, trackers or backend requests.

## Gameplay
Start at the indicated gate. Choose Natureza, Família or Movimento to change the suggested mission order and the album sequence. An optional nickname and three outfit colors are stored only in the current browser. The character uses Dijkstra routing on a hand-traced, approximate network of roads and paths in the approved illustration.

The grove offers a three-item observation game. The plaza offers an ordered path-connection puzzle, playable by taps or dragging. The lake offers a movable photo frame with three inclusion targets, with pointer and keyboard/button alternatives. Completion unlocks a 1080 × 1350 PNG memory card using the player's framing. Web Share has capability detection and download fallback. It never uses the device camera.

## Integration
`.ops/game-update.mjs` runs after the existing Solaris build, copies these three source files, adds a Jogar link and extends version.json without replacing the viewer. Masterplan assets are loaded from the same deployment. To test, build the site and serve solaris-dist over HTTP.

## Privacy and limitations
No name or progress is automatically sent to a server. The optional commercial link opens the existing public Solaris contact page without attaching player data. Sharing and file downloads require a user action. Storage failures fall back to the current session. Paths, game objects and equipment are illustrative, not survey data or evidence of construction completion.

## Verification
`tests/solaris-game.cjs` runs complete gameplay in desktop Chromium and mobile WebKit, including bad-order input, photo framing, memory exports, resume, blocked storage, image failures and the existing map link. Actual iPhone hardware and the native iOS share sheet require separate device testing.
