/**
 * TavernWeave Soul mode switch — a Claude Code plugin function-hooks module.
 *
 * Draws one line above the prompt with the current Soul mode; expanding it
 * offers the five modes, and picking one only fills the prompt with that mode's
 * Host Front Door phrase. The person sends it; activate-tavernweave-soul decides
 * whether the mode activates. The label follows the phrases the person actually
 * sent, so it never claims a verified activation.
 */
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { SoulId } from './soul-switch-types'
import { SOULS, soulLabel, soulOf } from './soul-switch-data'

const soul = atom({ plugin: 'tavernweave-agent-skills', key: 'soul' } as const, 'off' as SoulId)
const soulOpen = atom({ plugin: 'tavernweave-agent-skills', key: 'soulOpen' } as const, false)

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const id = typeof e.text === 'string' ? soulOf(e.text) : null
    if (id) await update($, soul, () => id)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const current = await read($, soul)
    const open = (await read($, soulOpen)) && e.props.maxRows >= 2

    return (
      <Box flexDirection="column">
        <Button key="soul-toggle" plain onPress={() => update($, soulOpen, v => !v)}>
          <Text dimColor>Soul </Text>
          {current === 'off' ? <Text dimColor>off</Text> : <Text color="claude">{soulLabel(current)}</Text>}
          <Text dimColor>{open ? ' ▾' : ' ▸'}</Text>
        </Button>
        {open && (
          <Box columnGap={1} flexWrap="wrap">
            {SOULS.map(one => (
              <Button
                key={`soul-${one.id}`}
                label={one.label}
                variant={one.id === current ? 'primary' : undefined}
                onPress={async () => {
                  await $.prompt.fill({ text: one.command })
                  await update($, soulOpen, () => false)
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    )
  })
}
