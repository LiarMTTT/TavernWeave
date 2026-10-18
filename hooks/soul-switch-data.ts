import type { SoulId } from './soul-switch-types'

// Each command is a Host Front Door phrase; tests/claude-plugin.test.mjs keeps them in sync.
export const SOULS: readonly { id: SoulId; label: string; command: string }[] = [
  { id: 'atong', label: '阿瞳', command: '阿瞳助我！' },
  { id: 'mttt', label: 'MTTT.sir', command: 'MTTT.sir，拷打我！' },
  { id: 'killer', label: '灵魂杀手', command: '灵魂杀手！' },
  { id: 'ensemble', label: '三席联席', command: '脑暴模式，Soul 联席' },
  { id: 'off', label: '关闭', command: 'Soul 归位' },
]

const SOUL_ALIASES: readonly [SoulId, RegExp][] = [
  ['ensemble', /脑暴模式，?\s*Soul\s*联席|三人一起脑暴|Soul\s*三席就位/u],
  ['atong', /阿瞳助我|开启\s*Soul\s*模式/iu],
  ['mttt', /MTTT\.sir，?拷打我/iu],
  ['killer', /灵魂杀手|强尼·银手，接管|强尼，骂醒我|启动 Relic 故障检测/u],
  ['off', /Soul\s*归位|结束\s*Soul\s*模式|^\/soul off$/iu],
]

/** The Soul a sent prompt asks for, by the Front Door's own phrases. */
export function soulOf(text: string): SoulId | null {
  const trimmed = text.trim()
  for (const [id, pattern] of SOUL_ALIASES) if (pattern.test(trimmed)) return id
  return null
}

export function soulLabel(id: SoulId): string {
  return SOULS.find(one => one.id === id)?.label ?? id
}
