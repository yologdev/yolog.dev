# yolog 30-second cut

A shorter, slower-reading cut of [the 64-second explainer](../explainer/), at 1920×1080. Every statement stays on screen for at least four seconds after it lands.

1. **Hook (0–6 s):** "Your agent just forgot everything."
2. **Reveal (6–11.5 s):** yolog, "Git for your agents' memory."
3. **What it saves (11.5–19 s):** example files from one checkpoint — the conversation, the agent's notes, its plan, its tool calls and results. yolog stores whatever files an agent publishes; these are typical, not a fixed schema.
4. **Checkpoints (19–25.5 s):** a timeline, "restored to turn 20", then go back, branch, cloud to laptop.
5. **Call to action (25.5–30 s).**

Look and motion rules: [DESIGN.md](DESIGN.md). Sound: the long cut's effects plus a 30-second music bed, all generated on fal.ai (ElevenLabs Music and Sound Effects v2); see [the long cut's README](../explainer/README.md#sound) for sources, terms and the -14 LUFS normalize step.

```sh
npm run check
npm run render
```

Space Grotesk is bundled in `assets/fonts/` under the SIL Open Font License.
