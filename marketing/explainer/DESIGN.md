# yolog explainer — design

## Style Prompt
A precise, technical product film for developers: deep ink canvas, one electric-blue accent, an amber branch colour and a mint "saved" colour used only as signals. Big, tight Space Grotesk statements carry the story (they must read with the sound off); JetBrains Mono carries the system's own voice — checkpoint ids, branch names, terminal lines. Diagrams (timelines, branches, two agents racing) are drawn live with lines and dots, never stock icons. Motion is confident and quick (power3/expo eases), with a slow ambient grid and glow so no frame is dead.

## Colors
| Role | Hex |
|---|---|
| Ground (all scenes) | `#0B1120` |
| Ink (text) | `#EEF2FA` |
| Muted ink (secondary text, ≥4.5:1 on ground) | `#9AA6BF` |
| Accent (brand, main branch, checkpoints) | `#4F74FF` |
| Branch (forks, experiments) | `#F2B35B` |
| Saved / success | `#7FE0B0` |
| Lost / failure | `#FF7A7A` |

## Typography
- **Space Grotesk** 700 for statements (72–160px), 400 for supporting lines (32–44px).
- **JetBrains Mono** 400/500 for ids, branch names, labels and code (22–34px).

## What NOT to Do
- No gradient text, no neon glow on text, no purple-blue gradient washes.
- No stock icons or emoji; draw marks with lines, dots and simple shapes.
- No claims the product doesn't make: no hosted service, no real-time co-editing, no invented user numbers.
- No more than ~10 words of statement text on screen at once; it has to read with the sound off.
- No full-frame linear gradients (banding); depth comes from a radial glow and a faint grid.
