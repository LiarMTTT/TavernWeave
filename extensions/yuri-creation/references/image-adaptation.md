# Reference-led image adaptation

Keep the original art by default. Inspect the actual image and offer the user a
choice when its portrayal conflicts with the adapted card. Their choice to change
it authorizes a new preview; reuse that choice without another questionnaire.
Preserve the original and let the user review the candidate before embedding it.

## Reuse the packaged skills

- `build-work-library/references/research-and-media.md` owns visual observation,
  reference identity, provenance and uncertainty. Inspect the real pixels; filenames,
  card metadata, search snippets and inaccessible URLs are not visual evidence.
- `tavern-card-builder/references/character-design.md` owns character identity and
  portrayal. Use the revised card's appearance, age, goals, setting and tone.
- `orchestrate-project-blueprint/references/prompt-spec-contract.md` supplies the
  small prompt contract: fixed elements, authorized changes, inputs and observable
  output requirements. Use its local prompt-spec path, without starting a new
  project blueprint or extra interview.
- `sillytavern-card-pipeline` owns approved-image packaging and payload parity.
  `sillytavern-media-live2d-runtime` is needed only for actual media bindings,
  expressions or Live2D, not an ordinary portrait.

Read these from the co-located base, without copying or changing its 23 skills.
Generation/editing uses the host's real image tool. This reference adds the
yuri-specific handoff; it is not another image engine, model API or scheduler.

## Observe, write the prompt, generate, review

1. Inspect the original at usable resolution. Note its medium, line/brush work,
   texture, rendering detail, palette, contrast, light direction/softness,
   framing/viewpoint, pose, background treatment and overall restraint or density.
   Distinguish observed traits from uncertain guesses; do not invent an artist,
   hidden prompt or model name. Preserve distinctive facial/character features
   when compatible with the authorized adaptation. Do not equate womanhood with
   makeup, exaggerated anatomy, sexualized clothes or a generic feminine face.
2. Read the final card. Turn its narrative style into visible choices: atmosphere,
   expression, posture, costume/era, environment and story-specific motifs. Preserve
   the source image's visual language while changing the authorized character
   portrayal. The revised card governs identity and story facts; the reference
   governs rendering style. Explain a material conflict briefly rather than silently
   replacing either with a fashionable default.
3. Author a concise final prompt combining both inputs. Use this scaffold only
   for applicable details, and replace every placeholder before generation:

   ```text
   Purpose: character-card portrait; intended crop/aspect ratio.
   Reference image: [actual attachment/path/handle], used for [style/edit target].
   Observed visual style: [medium, marks, texture, palette, light, framing].
   Revised character: [age, identity, stable features, costume, permitted changes].
   Narrative direction: [card-specific tone expressed through scene and pose].
   Composition: [subject hierarchy, gaze, background, readable portrait crop].
   Preserve: [reference traits and character details that must survive].
   Change: [only the authorized portrayal differences].
   Avoid: [specific risks, e.g. mismatched era, unreadable face, broken hands,
   unintended text/watermarks or rendering artifacts relevant to this image].
   ```

   Concrete art direction is required; generic quality tags such as “masterpiece,
   best quality, beautiful girl” are not a substitute. Do not paste the entire card,
   contradictory style lists or unrelated trendy embellishments into the prompt.
4. Pass the actual original image to the image tool as a style reference or edit
   input, according to the tool's supported mechanism. Inspect local inputs first.
   A reference mentioned only in text is not a supplied image. Preserve existing
   transparency unless the user requested a change. If vision or reference input
   is unavailable, disclose the limitation; retain the original and offer the
   authored prompt rather than claiming a style-matched result.
5. Generate one candidate by default. The main agent may delegate prompt drafting
   or generation only when real sub-agent/image capabilities exist. Supply the
   same image, selected card facts, invariants and budget to the delegate; keep
   responsibility for review with the main agent. Never simulate a tool call or
   launch an external paid API as an implicit fallback.
6. Actually view the candidate and compare it with the original and card: rendering
   style, face/hands/anatomy, costume and era, expression, narrative mood,
   composition/crop, unwanted text, and image artifacts. Report concrete mismatches;
   do not call a completed generation a quality pass. Keep retries within the
   user's budget; do not silently start a gallery or an unlimited repair loop.
7. Show the candidate with a short explanation of the retained style and intended
   story changes. Offer keep original / use candidate / request a focused revision.
   Retain the original, reference observations, actual prompt, tool/model when
   known, candidate identity and observed limitations in private project notes.
   User approval of the image is separate from agent inspection and live import.

## Approved-image handoff

After the user chooses a candidate, use the existing packaging route on a new
output. `create_card.py pack-image` supports generated wrapped v2 cards only.
Inherited v2/v3 or dual-payload PNGs must retain their actual decoded documents,
unknown fields and worldbook settings through the card pipeline; do not flatten
them or invent a v2/v3 projection to fit that helper. If no available packer can
preserve the container, deliver the approved art alongside the adapted JSON and
state that image embedding remains unverified. Keep artwork provenance separate
from card provenance and software licensing.
