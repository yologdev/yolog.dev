# yolog explainer video

A 64-second, 1920×1080 explainer built with [HyperFrames](https://hyperframes.heygen.com): HTML, CSS and GSAP, rendered to MP4. The story:
1. **The problem:** an agent loses its session, and the usual "save a JSON file" fix falls short.
2. **The reveal:** yolog.
3. **What it does:** checkpoints and going back; branching, with two agents writing safely; cloud to laptop with the same ids.
4. **Why trust it:** it runs in your own account, with scoped tokens, and checkpoints never change.
5. **Who it works with,** then the call to action.

Look and motion rules: [DESIGN.md](DESIGN.md). Everything on screen is in [index.html](index.html).

```sh
npm run check     # lint, layout, motion and contrast checks
npm run render    # renders to renders/ (not committed)
```

Space Grotesk is bundled in `assets/fonts/` under the SIL Open Font License ([OFL-SpaceGrotesk.txt](assets/fonts/OFL-SpaceGrotesk.txt)).

## Sound

Most feeds autoplay muted, so every point is also on screen as text. With sound on, there is a music bed and seven kinds of cue (a glitch on "SESSION LOST", whooshes on scene changes, a hit on the reveal, ticks, a rewind, a conflict blip and success chimes), placed as `<audio>` clips in `index.html`.

The audio in `assets/audio/` was generated on [fal.ai](https://fal.ai) with ElevenLabs Music (`fal-ai/elevenlabs/music`) and Sound Effects v2 (`fal-ai/elevenlabs/sound-effects/v2`); each effect was levelled to -16 LUFS. Check the providers' terms before commercial use.

The render mixes quietly; normalize the final file to -14 LUFS, the level social platforms play at:

```sh
ffmpeg -i renders/yolog-explainer.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k renders/yolog-explainer-final.mp4
```
