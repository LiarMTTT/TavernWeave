# Opening strategies

## Contents

1. Fixed greetings
2. Dynamic setup
3. Custom opening pages
4. Acceptance checks

## 1. Fixed greetings

For a fixed first message or alternate greeting, use the target MVU runtime's native per-message initialization path:

- put shared defaults in the common initialization source;
- provide complete branch-specific defaults with the supported greeting initialization block when needed;
- use a supported update block for small branch differences;
- verify the stored state for every alternate greeting, not just the visible prose.

Do not remove valid initialization blocks during packaging or cleanup.

## 2. Dynamic setup

Use a dynamic flow when choices are free-form, combinatorial, or span multiple steps:

1. Hold the draft in UI/local draft state.
2. Validate and preview without writing game state.
3. Freeze the confirmed context.
4. Build one canonical user opening message.
5. Send it through the normal user-message and generation chain.
6. Let the normal plot and variable update protocols process the result.

Do not call a low-level state replacement function to simulate initialization.

## 3. Custom opening pages

Treat an opening page as a small transaction system:

- draft state is not MVU state;
- preview is no-write;
- persisted draft settings need per-chat keys and migrations;
- submission needs validation, confirmation, snapshot, rollback, and safe retry;
- a remote page should remain declarative while a local binder owns privileged APIs;
- pin or verify remotely loaded resources and fail safely.

Delegate implementation and interaction review to `$sillytavern-embedded-ui` and runtime closure to `$sillytavern-runtime-debug`.

## 4. Acceptance checks

Test:

- every fixed greeting and swipe branch;
- first load and reload;
- new chat and existing chat;
- failed validation and retry;
- duplicate mount/submission prevention;
- actual persisted state and model-visible content.
