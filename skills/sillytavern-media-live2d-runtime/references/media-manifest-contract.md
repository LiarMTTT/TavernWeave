# Media manifest contract

## Manifest shape

```json
{
  "schemaVersion": 1,
  "cardId": "stable-card-id",
  "assets": [
    {
      "id": "theme-bgm",
      "kind": "audio",
      "source": { "type": "local", "path": "audio/theme.ogg" },
      "bytes": 123456,
      "sha256": "64 hex characters",
      "preload": "lazy",
      "lifetime": "chat",
      "fallbackAssetId": null
    }
  ]
}
```

Asset `kind` is `audio`, `image`, `video`, `multimodal`, `live2d-model`,
`live2d-motion`, or `live2d-expression`. `preload` is `eager`, `lazy`, or
`on-demand`; `lifetime` is `card`, `chat`, or `message`.

A local source uses a safe relative path under the maintained media root. A remote
source uses HTTPS and may declare immutable SHA-256 and byte size. Static validation
never downloads it. Unknown fields are preserved.

IDs are stable and unique. A fallback must name another declared asset and cannot
point to itself. Hash and byte checks apply to local assets when `--root` is supplied.

## Audio block

```json
{
  "audio": {
    "bgm": ["theme-bgm"],
    "ambient": [],
    "settings": {
      "bgm": { "enabled": true, "mode": "repeat_all", "muted": false, "volume": 40 }
    }
  }
}
```

Only `bgm` and `ambient` are supported Tavern Helper channels. Modes are
`repeat_one`, `repeat_all`, `shuffle`, and `play_one_and_stop`; volume is 0–100.
Runtime code should apply partial settings and avoid replacing playlists unless the
user explicitly selected replacement.

## Live2D block

```json
{
  "live2d": {
    "provider": "named adapter or extension",
    "runtimeGlobal": "ProviderGlobal",
    "versionProbe": "ProviderGlobal.version",
    "modelAssetIds": ["avatar-model"],
    "fallbackAssetId": "avatar-static"
  }
}
```

TavernWeave does not claim a universal host Live2D API. The provider, runtime global,
version probe, adapter behavior, and fallback are mandatory. Exact calls belong in a
provider-specific component and need installed-runtime evidence.
