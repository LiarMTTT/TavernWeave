# Audio and Live2D lifecycle

## Binding file

Each binding has a stable `id`, documented `event`, `action`, target `assetId` when
needed, and a `cleanupBindingId` for resource-acquiring actions.

Supported actions are:

- `preload`;
- `play-audio` and `pause-audio`;
- `load-live2d` and `dispose-live2d`;
- `set-live2d-motion` and `set-live2d-expression`;
- `show-fallback`.

Supported host events include `APP_READY`, `CHAT_CHANGED`, `MESSAGE_SENT`,
`MESSAGE_RECEIVED`, `MESSAGE_EDITED`, `MESSAGE_UPDATED`, `MESSAGE_SWIPED`,
`CHARACTER_MESSAGE_RENDERED`, `USER_MESSAGE_RENDERED`, `GENERATION_STARTED`, and
`GENERATION_ENDED`. `PAGEHIDE` represents iframe/script teardown.

`play-audio` must target an audio asset and clean up through `pause-audio` on
`CHAT_CHANGED` or `PAGEHIDE`. `load-live2d` must target a model and clean up through
`dispose-live2d` on one of those teardown events. Motions and expressions must target
their corresponding asset kinds.

## Capability ownership

Audio bindings require Tavern Helper audio functions such as `playAudio`,
`pauseAudio`, `getAudioSettings`, and `setAudioSettings`. Live2D bindings require the
manifest-declared provider global and adapter. Probe readiness rather than assuming
load order.

Pair event registrations, timers, observers, audio handles, WebGL/canvas instances,
workers, object URLs, and provider models with cleanup. Make repeated chat changes and
message rerenders idempotent.

## Live acceptance matrix

Verify in the intended host:

1. local and remote retrieval, MIME, CORS, and immutable cache behavior;
2. browser autoplay permission and audio settings preservation;
3. chat switch, swipe, edit, rerender, and teardown;
4. provider version probe, model load, motion and expression mapping;
5. WebGL loss, provider absence, network failure, and static fallback;
6. desktop/mobile memory, first activation, repeat activation, and disposal.

A local hash pass proves only source bytes. It does not prove decode, playback,
rendering, or lifecycle correctness.
