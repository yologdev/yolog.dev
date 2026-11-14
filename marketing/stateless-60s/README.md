# yolog "stateless agents" video

A 60-second, 1920×1080 film built with [HyperFrames](https://hyperframes.heygen.com): HTML, CSS and GSAP, rendered to MP4. The story:
1. **The problem:** an agent's computer is temporary (timeout, redeploy, laptop closed), and its work goes with it.
2. **The reveal:** yolog. "Its work shouldn't be."
3. **Stateless agents:** each run resumes, does a step and saves; the run goes away, the repository stays.
4. **Run anywhere:** a laptop, a cloud function and a nightly job continue one another's checkpoints.
5. **Skip the backend:** no database, bucket, schema or migrations; `resume()` and `save()`.
6. **Never lose a run:** the process dies after step 4, and a new one resumes from step 4.
7. The call to action: yolog.dev.

Every claim is something yolog does: it stores an agent's state and does not run the agent. Look and motion rules: [DESIGN.md](DESIGN.md). Everything on screen is in [index.html](index.html).

```sh
npm run check     # lint, layout, motion and contrast checks
npm run render    # renders to renders/ (not committed)
```

## Sound

There is no voice: every point is on screen as text, because most feeds autoplay muted. The music bed and cues in `assets/audio/` are the explainer's (see [../explainer/README.md](../explainer/README.md) for how they were made and their terms).

Normalize the final file to -14 LUFS:

```sh
ffmpeg -i renders/<render>.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k renders/yolog-stateless-60s.mp4
```
