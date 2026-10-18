export type SoulId = 'atong' | 'mttt' | 'killer' | 'ensemble' | 'off'

declare module 'claude-code' {
  interface PluginState {
    'tavernweave-agent-skills': {
      /** The last Soul phrase the person sent, not a verified activation. */
      soul: SoulId
      soulOpen: boolean
    }
  }
}
