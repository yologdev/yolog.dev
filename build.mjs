// Builds dist/index.html: the landing page as a history (a spine of checkpoints).
// Static files in public/ are copied beside it.  node build.mjs
import { writeFileSync, mkdirSync, cpSync, rmSync } from "node:fs";
const INK = "#0B1120", PAPER = "#EEF0F3", CARD = "#FFFFFF", LINE = "#D5DAE2", BODY = "#3B4557";
const AMBER = "#F2B35B", AMBER_T = "#8A5200", MINT = "#7FE0B0", BLUE_L = "#8BA2FF";
const G = "font-family: 'Space Grotesk', Inter, sans-serif", M = "font-family: 'JetBrains Mono', monospace";

// --- Hero art: one bundle of strands (a history) that forks twice. Deterministic.
function art() {
  const W = 1440, N = 30, out = [];
  const ss = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  for (let i = 0; i < N; i++) {
    const base = 196 + (i - N / 2) * 4.6;
    const up = i < 9, down = i > 21;
    let d = "";
    for (let x = -20; x <= W + 20; x += 24) {
      let y = base + 3.2 * Math.sin(x / 110 + i * 0.7) + 1.6 * Math.sin(x / 37 + i * 1.9);
      if (up) y -= (118 - i * 5) * ss((x - 400 - i * 9) / 300);
      if (down) y += (70 + (i - 22) * 6) * ss((x - 800 - (N - i) * 8) / 280);
      d += (d ? "L" : "M") + x + " " + y.toFixed(1);
    }
    const col = up ? AMBER : down ? MINT : "#4F74FF";
    const op = (0.28 + 0.5 * (((i * 7) % 10) / 10)).toFixed(2);
    out.push(`<path d="${d}" stroke="${col}" stroke-width="${i % 5 === 0 ? 2 : 1.1}" stroke-opacity="${op}" fill="none"${up && i % 3 === 0 ? ' class="flow"' : ""}></path>`);
  }
  const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="7" fill="${INK}" stroke="${c}" stroke-width="3"></circle>`;
  out.push(dot(150, 197, "#4F74FF"), dot(390, 199, "#4F74FF"), dot(700, 214, "#4F74FF"), dot(1010, 214, "#4F74FF"), dot(1300, 212, "#EEF2FA"));
  out.push(dot(860, 96, AMBER), dot(1180, 97, AMBER), dot(1240, 318, MINT));
  return `<svg viewBox="0 0 1440 380" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="display: block; width: 100%; height: clamp(200px, 26vw, 380px)">${out.join("")}</svg>`;
}

// --- Spine rows
const row = (color, tag, body, last) => `
<div style="display: flex; gap: clamp(14px, 3vw, 44px)">
<div aria-hidden="true" style="flex: none; width: 20px; display: flex; flex-direction: column; align-items: center"><span style="flex: none; width: 16px; height: 16px; margin-top: 3px; border-radius: 50%; background: ${PAPER}; border: 4px solid ${color}; box-sizing: border-box"></span>${last ? "" : `<span style="flex: 1; width: 2px; background: ${color}"></span>`}</div>
<div style="flex: 1; min-width: 0; padding-bottom: ${last ? "0" : "clamp(64px, 9vw, 120px)"}; display: flex; flex-direction: column; gap: 28px">
<p style="margin: 0; ${M}; font-size: 14px; letter-spacing: 0.04em; color: ${color === AMBER ? AMBER_T : "#2647E8"}">${tag}</p>
${body}
</div>
</div>`;
const h2 = (id, t, size = "clamp(32px, 4.4vw, 56px)") => `<h2 id="${id}" style="margin: 0; ${G}; font-weight: 700; font-size: ${size}; letter-spacing: -0.035em; line-height: 1.04; max-width: 20em">${t}</h2>`;
const lead = (t) => `<p style="margin: 0; font-size: clamp(18px, 1.6vw, 21px); line-height: 1.6; color: ${BODY}; max-width: 40rem">${t}</p>`;
const grid = (min, items) => `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, ${min}px), 1fr)); gap: 20px">${items.join("")}</div>`;
const card = (kicker, title, text, kc = "#2647E8") => `<div style="background: ${CARD}; border: 1px solid ${LINE}; border-radius: 14px; padding: 28px; display: flex; flex-direction: column; gap: 12px">${kicker ? `<p style="margin: 0; ${M}; font-size: 13px; color: ${kc}">${kicker}</p>` : ""}<h3 style="margin: 0; ${G}; font-weight: 600; font-size: 22px; letter-spacing: -0.02em; line-height: 1.2">${title}</h3><p style="margin: 0; font-size: 16px; line-height: 1.6; color: ${BODY}">${text}</p></div>`;
const dcard = (title, text) => `<div style="display: flex; flex-direction: column; gap: 8px"><h3 style="margin: 0; ${G}; font-weight: 600; font-size: 20px; letter-spacing: -0.015em; color: #FFFFFF">${title}</h3><p style="margin: 0; font-size: 16px; line-height: 1.6; color: #B4BDD0">${text}</p></div>`;
const btn = (href, t, primary) => `<a href="${href}" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 26px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 17px; ${primary ? "background: #2647E8; color: #FFFFFF" : "border: 1px solid #3A4666; color: #EEF2FA"}">${t}</a>`;
const fileRow = (p, w) => `<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 24px; padding: 14px 0; border-top: 1px solid #1E2942"><span style="${M}; font-size: 16px; color: #EEF2FA; flex: 0 0 230px">${p}</span><span style="font-size: 16px; color: #B4BDD0">${w}</span></div>`;
const faq = (q, a) => `<details style="border-top: 1px solid ${LINE}; padding: 4px 0"><summary style="cursor: pointer; padding: 18px 0; ${G}; font-weight: 600; font-size: 20px; letter-spacing: -0.015em">${q}</summary><p style="margin: 0; padding: 0 0 22px; font-size: 17px; line-height: 1.65; color: ${BODY}; max-width: 44rem">${a}</p></details>`;
const mark = (ink) => `<svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true"><circle cx="6" cy="14" r="3.5" stroke="#4F74FF" stroke-width="2"></circle><circle cx="22" cy="7" r="3.5" stroke="#4F74FF" stroke-width="2"></circle><circle cx="22" cy="21" r="3.5" stroke="${AMBER}" stroke-width="2"></circle><path d="M9.5 14h4c2.5 0 3-7 5-7M13.5 14c2.5 0 3 7 5 7" stroke="${ink}" stroke-width="2" stroke-linecap="round"></path></svg>`;

const rows = [
row("#2647E8", "03bf…c4 · the problem", `
${h2("why", "An agent should outlive the run.")}
${lead("An agent is more than its model: its identity and rules, its skills, what it has learned, and the record of what it did and why. Today that lives in a process, a vendor's session store or a pile of notes. The process crashes, the service redeploys, the work moves to a new machine, and the agent is gone. yolog keeps every version of all of it, as a history you can trust, branch and carry between machines.")}
<div style="background: ${INK}; border-radius: 16px; padding: clamp(22px, 3vw, 36px); display: flex; flex-direction: column; max-width: 860px">
<div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; ${M}; font-size: 14px; color: #9AA6BF; padding-bottom: 16px"><span>my-agent / main</span><span style="color: ${BLUE_L}">checkpoint a8e2…19</span></div>
${fileRow("logs/session.jsonl", "every message and tool call")}
${fileRow("plan.md", "what it is working on")}
${fileRow("memory/notes.md", "what it has learned")}
${fileRow("skills/", "what it can do")}
<p style="margin: 0; padding-top: 16px; border-top: 1px solid #1E2942; font-size: 15px; color: #9AA6BF">Typical examples: yolog stores whatever files and logs your agent publishes, in any layout. An agent laid out the <a href="https://gasp.yolog.dev" style="color: ${BLUE_L}">GASP</a> way adds who it is and a log of every goal, run and decision, and the viewer shows them.</p>
</div>`),
row("#2647E8", "a8e2…19 · watch", `
${h2("watch-title", "See it in 30 seconds.")}
<div id="watch" style="width: 100%; max-width: 1000px; border-radius: 16px; overflow: hidden; background: ${INK}; aspect-ratio: 16 / 9">
<video src="/media/yolog-30s.mp4" poster="/media/yolog-30s-poster.jpg" controls="" playsinline="" preload="none" aria-label="yolog in 30 seconds: what happens when an agent forgets, what yolog saves, and how checkpoints let you go back, branch and move" style="display: block; width: 100%; height: 100%; object-fit: cover"></video>
</div>
<p style="margin: 0; font-size: 16px; color: ${BODY}">Sound on for the full effect.</p>`),
row("#2647E8", "51d0…7a · three ideas", `
${h2("ideas", "Keep everything. Try anything. Take it anywhere.")}
${grid(280, [
card("01 · history", "Never rewritten", "Every checkpoint stays exactly as it was, and publishing only moves a branch forward: no rebase, no force-push. On a branch that holds GASP history, logs are checked on every publish so they can only grow."),
card("02 · branches", "Checkpoints and branches", "Each publish is a checkpoint. Branch from any of them to try another path, and keep both. Concurrent writers get a clean conflict, never a lost update."),
card("03 · portability", "Portable by design", "Export a repository and import it anywhere, from the cloud to a laptop and back, with the same checkpoint ids. An export can be written out as a plain Git repository."),
])}`),
row(AMBER, "↳ branch: together · forked from 51d0…7a", `
${h2("together", "Many agents, one state, no lost updates.")}
${grid(280, [
card("one branch", "Many writers", "When two agents publish at once, one wins and the other gets a clean conflict with the new head to retry from. Nothing is overwritten.", AMBER_T),
card("many branches", "Fork to work in parallel", "Give each agent its own branch from any checkpoint, and its own token: read, write or admin, for one repository or all of them.", AMBER_T),
card("change feed", "Follow along", "Other agents read the history or poll the change feed to pick up what their teammates published.", AMBER_T),
])}
<p style="margin: 0; font-size: 16px; line-height: 1.6; color: ${BODY}; max-width: 44rem"><span style="${M}; font-size: 13px; color: ${AMBER_T}; border: 1px solid ${AMBER_T}; border-radius: 999px; padding: 3px 10px; margin-right: 10px">planned</span>Live updates pushed to subscribers, and merging branches. Today agents coordinate by handing off, not by editing the same thing at the same moment.</p>`),
row("#2647E8", "e47b…02 · how it works", `
${h2("how", "Three calls and you have a history.")}
<div style="display: flex; flex-wrap: wrap; gap: 32px 48px; align-items: flex-start">
<ol style="flex: 1 1 320px; min-width: 0; margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 28px">
${[["Create a repository", "One per agent, conversation or project. Give each agent a token scoped to just what it needs."], ["Publish what changed", "Send whole files or just a patch: lines appended to a log, files set or removed. Retries are safe: an operation id makes every publish idempotent."], ["Read, branch, export", "Read any checkpoint, list the history, fork a branch, or export the whole repository to run it somewhere else."]].map(([t, p], i) => `<li style="display: flex; gap: 18px"><span aria-hidden="true" style="flex: none; ${G}; font-weight: 700; font-size: 44px; line-height: 0.9; letter-spacing: -0.04em; color: #2647E8; width: 34px">${i + 1}</span><div style="display: flex; flex-direction: column; gap: 6px"><h3 style="margin: 0; ${G}; font-weight: 600; font-size: 22px; letter-spacing: -0.02em">${t}</h3><p style="margin: 0; font-size: 16px; line-height: 1.6; color: ${BODY}">${p}</p></div></li>`).join("\n")}
</ol>
<div style="flex: 1.3 1 420px; min-width: 0; background: ${INK}; border-radius: 16px; overflow: hidden">
<div style="display: flex; justify-content: space-between; gap: 12px; padding: 14px 22px; border-bottom: 1px solid #1E2942; ${M}; font-size: 13px; color: #9AA6BF"><span>agent.mjs</span><span>JavaScript client</span></div>
<div style="overflow-x: auto; padding: 22px">
<pre style="margin: 0; ${M}; font-size: 14px; line-height: 1.7; color: #EEF2FA">const repo = client.repository(id);

<span style="color: #9AA6BF">// Append to the agent's log, from the head it last saw.</span>
const { checkpoint } = await repo.publish({
  expectedHead: head,
  operationId: <span style="color: ${MINT}">"turn-42"</span>,
  capture: {
    mode: <span style="color: ${MINT}">"patch"</span>,
    log: [{ path: <span style="color: ${MINT}">"conversation.jsonl"</span>, text: line }],
  },
});

<span style="color: #9AA6BF">// Try another path without losing this one.</span>
await repo.createBranch({ name: <span style="color: ${AMBER}">"experiment"</span>, from: checkpoint, operationId: <span style="color: ${MINT}">"fork-1"</span> });

<span style="color: #9AA6BF">// Take everything elsewhere.</span>
const pkg = await repo.exportPackage();</pre>
</div>
</div>
</div>`),
row("#2647E8", "7d19…b3 · production", `
<div id="features" style="background: ${INK}; border-radius: 20px; padding: clamp(28px, 5vw, 64px); display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 14px">
<h2 style="margin: 0; ${G}; font-weight: 700; font-size: clamp(32px, 4.4vw, 56px); letter-spacing: -0.035em; line-height: 1.04; color: #FFFFFF">Built to run in production.</h2>
<p style="margin: 0; font-size: 19px; line-height: 1.6; color: #B4BDD0; max-width: 38rem">The boring parts, done carefully, so many agents and many users can share one service.</p>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 36px 40px">
${dcard("Scoped, revocable tokens", "Read, write or admin, per owner or per repository. A token never outlives the one that minted it, and an owner can revoke them all at once.")}
${dcard("Conflict-safe writes", "Every publish names the head it expects. Two agents racing on one branch get one winner and a clean conflict for the other.")}
${dcard("Large files, content-addressed", "Big artifacts go to blob storage by their SHA-256, uploaded in parts when needed, and referenced from the checkpoint.")}
${dcard("Logs past any file limit", "A long log rolls into new segment files, so an agent's history keeps growing while each publish stays small.")}
${dcard("Limits and rate limits", "Bounded requests, a per-owner repository quota, per-repository size limits and rate limits, with request ids on every response and structured logs.")}
${dcard("Undo a deletion", "A deleted repository can be restored within a grace period before its storage is reclaimed.")}
</div>
</div>`),
row("#2647E8", "c2f8…5e · run anywhere", `
${h2("anywhere", "Cloud to laptop, and back.")}
${lead("One build runs in the cloud and on your own machine. Move a repository between them and nothing changes but where it lives.")}
${grid(280, [
card("cloud", "On Cloudflare", "Workers and Durable Objects, with Git storage on Artifacts and large files on R2. One object per repository, close to its agents."),
card("self-hosted", "On your machine", "The same Worker under local workerd, with local Git storage. Works offline. Export a repository to move it to the cloud, or back."),
card("no lock-in", "As plain Git", "Every export can be written out as a Git repository you can clone, inspect and keep, with or without yolog."),
])}`),
row("#2647E8", "44ae…91 · security", `
${h2("security", "Your data stays yours.")}
${lead("Run yolog in your own cloud account or on your own server, and your agents' state never leaves it. The hosted free tier keeps no email addresses, and its sign-in only reads.")}
<ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; max-width: 900px">
${[["Scoped, expiring tokens", "Signed capability tokens per owner or per repository. A token never outlives or widens the one that minted it; an owner can revoke them all at once.", 0], ["Hardened serving", "Bounded requests and rate limits, malformed input refused cleanly, and stored files never rendered by a browser. Storage credentials never leave the service.", 0], ["History you can trust", "Checkpoints are immutable and publishing only moves forward, so a buggy agent cannot quietly rewrite the past.", 0], ["Not yet", "End-to-end encryption (storage is encrypted at rest by your cloud) and an independent security audit.", 1]].map(([t, p, no]) => `<li style="display: flex; flex-wrap: wrap; gap: 6px 32px; padding: 22px 0; border-top: 1px solid ${LINE}"><span style="flex: 0 0 240px; ${G}; font-weight: 600; font-size: 20px; letter-spacing: -0.015em; color: ${no ? AMBER_T : INK}">${t}</span><span style="flex: 1 1 320px; font-size: 16px; line-height: 1.6; color: ${BODY}">${p}</span></li>`).join("\n")}
</ul>`),
row("#2647E8", "19d3…a7 · agents", `
${h2("agents", "For any agent.")}
${lead("yolog stores files and logs over a plain HTTP API. Nothing in it is tied to one runtime or one model.")}
${grid(240, [
card("today", "Yo", "Yo publishes its conversation history here.", "#0B6B4A"),
card("today", "GASP agents", "GASP histories pass the GASP conformance checker.", "#0B6B4A"),
card("today", "Your own runtime", "An HTTP API and a JavaScript client.", "#0B6B4A"),
card("today", "Claude Code, Codex and other coding agents", "One line sets it up, and an MCP connector gives them yolog's tools.", "#0B6B4A"),
])}`),
row("#2647E8", "5b07…d2 · questions", `
${h2("faq", "Questions.")}
<div style="max-width: 900px; border-bottom: 1px solid ${LINE}">
${faq("Why not just save JSON to a bucket?", "If you only need the latest copy, a bucket is simpler, and enough. yolog is for what a bucket can't give you: every version kept, branches, several writers without lost updates, retries that never write twice, and history that moves between machines with the same ids.")}
${faq("Can agents collaborate in real time?", "Not yet. Agents can share a branch safely, fork their own, and follow a change feed. Live updates pushed to subscribers, and merging branches, are planned.")}
${faq("Where is my data stored?", "Wherever you run yolog: in your own Cloudflare account (Durable Objects, Artifacts and R2), or on your own machine. You can export everything at any time and write it out as plain Git.")}
${faq("Do I need Cloudflare?", "No. The same build runs standalone on your machine under workerd, offline if you like. Cloudflare is one place to run it, not a requirement.")}
${faq("Which agents can use it?", "Any agent that can make HTTP requests. Yo uses it today, GASP agents are checked against the GASP conformance checker, and Claude Code, Codex and other coding agents connect with one line, or through yolog's MCP connector.")}
${faq("Is it open source?", "It will be, under the MIT license. yolog is in private development now; the repository opens when the self-hosted release is tested.")}
</div>`),
row("#2647E8", "9c41…e0 · main · head", `
<h2 id="cta-title" style="margin: 0; ${G}; font-weight: 700; font-size: clamp(40px, 6.4vw, 88px); letter-spacing: -0.04em; line-height: 0.98; max-width: 12em">Keep the whole agent, every version.</h2>
<div style="display: flex; flex-wrap: wrap; gap: 12px">
<a href="https://github.com/yologdev/yolog" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 26px; border-radius: 10px; background: #2647E8; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 17px">Follow on GitHub</a>
<a href="/agents" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 26px; border-radius: 10px; border: 1px solid #AEB6C4; color: ${INK}; text-decoration: none; font-weight: 600; font-size: 17px">Set up with your agent</a>
<a href="https://docs.yolog.dev" style="display: inline-flex; align-items: center; min-height: 52px; padding: 0 26px; border-radius: 10px; border: 1px solid #AEB6C4; color: ${INK}; text-decoration: none; font-weight: 600; font-size: 17px">Read the docs</a>
</div>
<p style="margin: 0; font-size: 16px; color: ${BODY}">Already set up? <a href="https://app.yolog.dev" style="color: #2647E8; font-weight: 600">Sign in</a> to open your agents.</p>`, true),
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>yolog — Git for your agents</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="The whole agent, versioned: identity, skills, memory, every run, decision and conversation, with append-only history, checkpoints and branches. Hosted free, or run it on Cloudflare or your own machine.">
<meta property="og:title" content="yolog — Git for your agents">
<meta property="og:description" content="The whole agent, versioned: identity, skills, memory, runs and decisions. History, checkpoints and branches. Run it anywhere.">
<meta property="og:image" content="https://yolog.dev/media/yolog-30s-poster.jpg">
<meta property="og:url" content="https://yolog.dev/">
<link rel="canonical" href="https://yolog.dev/">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script src="/analytics.js" defer></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap">
<style>
body{margin:0;background:${PAPER}}
a{color:#2647E8}a:hover{color:#1A33B0}
html{scroll-behavior:smooth}
.flow{stroke-dasharray:6 10;animation:flow 14s linear infinite}
@keyframes flow{to{stroke-dashoffset:-320}}
@media (prefers-reduced-motion: reduce){.flow{animation:none}html{scroll-behavior:auto}}
</style>
</head>
<body>
<div style="font-family: Inter, system-ui, sans-serif; color: ${INK}; background: ${PAPER}; min-height: 100vh">

<!-- Hero: ink ground, the history drawn as strands -->
<div style="background: ${INK}; color: #EEF2FA">
<header>
<nav aria-label="Main" style="max-width: 1240px; margin: 0 auto; padding: 18px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px">
<a href="#top" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #EEF2FA">${mark("#EEF2FA")}<span style="${G}; font-weight: 700; font-size: 24px; letter-spacing: -0.03em">yolog</span></a>
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 26px; font-size: 15px">
<a href="#how" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">How it works</a>
<a href="#features" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Features</a>
<a href="#anywhere" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Run anywhere</a>
<a href="#security" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Security</a>
<a href="#faq" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">FAQ</a>
<a href="/agents" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Set up with your agent</a>
<a href="https://docs.yolog.dev" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Docs</a>
<a href="https://github.com/yologdev/yolog" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 8px; border: 1px solid #3A4666; color: #EEF2FA; text-decoration: none; font-weight: 500">GitHub</a>
<a href="https://app.yolog.dev" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 8px; background: #2647E8; color: #FFFFFF; text-decoration: none; font-weight: 600">Sign in</a>
</div>
</nav>
</header>
<section id="top" style="max-width: 1240px; margin: 0 auto; padding: clamp(56px, 9vw, 120px) 24px clamp(24px, 4vw, 48px); display: flex; flex-direction: column; gap: 28px">
<p style="margin: 0; ${M}; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: ${BLUE_L}">Durable infrastructure for AI agents</p>
<h1 style="margin: 0; ${G}; font-weight: 700; font-size: clamp(48px, 9.2vw, 136px); line-height: 0.94; letter-spacing: -0.05em; max-width: 9em">Git for your <span style="color: ${AMBER}">agents.</span></h1>
<p style="margin: 0; font-size: clamp(18px, 1.7vw, 23px); line-height: 1.55; color: #B4BDD0; max-width: 40rem">Everything that makes an agent itself, in one versioned repository: who it is, what it can do, what it has learned, and every run, decision and conversation that got it there. Publish from any runtime, fork from any point, take the whole agent with you.</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; padding-top: 6px">
${btn("#watch", "Watch the 30-second film", true)}
${btn("/agents", "Set up with your agent", false)}
</div>
</section>
${art()}
<div style="max-width: 1240px; margin: 0 auto; padding: 18px 24px 28px; display: flex; flex-wrap: wrap; gap: 8px 36px; ${M}; font-size: 14px; color: #9AA6BF">
<span><span style="color: #4F74FF">●</span> main: every publish is a checkpoint</span>
<span><span style="color: ${AMBER}">●</span> a branch, to try another path</span>
<span><span style="color: ${MINT}">●</span> the same history, on another machine</span>
</div>
</div>

<!-- The page as a history: each section is a checkpoint on the spine -->
<main style="max-width: 1240px; margin: 0 auto; padding: clamp(56px, 8vw, 112px) 24px clamp(72px, 9vw, 120px)">
${rows.join("\n")}
</main>

<footer style="border-top: 1px solid ${LINE}">
<div style="max-width: 1240px; margin: 0 auto; padding: 28px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; font-size: 15px; color: ${BODY}">
<span><span style="${G}; font-weight: 700; color: ${INK}">yolog</span> · by yologdev</span>
<div style="display: flex; flex-wrap: wrap; gap: 4px 24px; align-items: center">
<a href="https://github.com/yologdev/yolog" style="color: ${BODY}; padding: 12px 0">GitHub</a>
<a href="https://github.com/yologdev/gasp" style="color: ${BODY}; padding: 12px 0">GASP</a>
<a href="https://docs.yolog.dev" style="color: ${BODY}; padding: 12px 0">Docs</a>
<span style="padding: 12px 0">MIT license</span>
</div>
</div>
</footer>

</div>
</body>
</html>
`;
// --- /agents: hand the setup to the person's own agent.
const PROMPT = "Read https://yolog.dev/agents.md and set up yolog for this project.";
const step = (n, t, d) => `<li style="display: flex; gap: 16px"><span style="flex: none; ${M}; font-size: 15px; color: ${BLUE_L}; padding-top: 2px">${n}</span><div><p style="margin: 0; ${G}; font-weight: 600; font-size: 19px; color: #FFFFFF">${t}</p><p style="margin: 6px 0 0; font-size: 16px; line-height: 1.6; color: #B4BDD0">${d}</p></div></li>`;
const agentsHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Set up yolog with your agent</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Paste one line into Claude Code, Codex or any coding agent: it signs you up for yolog's free tier with your email and connects your project.">
<meta property="og:title" content="Set up yolog with your agent">
<meta property="og:description" content="One line for your coding agent, and your project keeps its agents' state as a versioned history.">
<meta property="og:image" content="https://yolog.dev/media/yolog-30s-poster.jpg">
<meta property="og:url" content="https://yolog.dev/agents">
<link rel="canonical" href="https://yolog.dev/agents">
<link rel="alternate" type="text/markdown" href="/agents.md">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script src="/analytics.js" defer></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;family=Space+Grotesk:wght@500;600;700&amp;display=swap">
<style>
body{margin:0;background:${INK}}
a{color:${BLUE_L}}a:hover{color:#FFFFFF}
#copy:focus-visible{outline:3px solid ${AMBER};outline-offset:2px}
</style>
</head>
<body>
<div style="font-family: Inter, system-ui, sans-serif; color: #EEF2FA; background: ${INK}; min-height: 100vh">
<header>
<nav aria-label="Main" style="max-width: 1040px; margin: 0 auto; padding: 18px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px">
<a href="/" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #EEF2FA">${mark("#EEF2FA")}<span style="${G}; font-weight: 700; font-size: 24px; letter-spacing: -0.03em">yolog</span></a>
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 26px; font-size: 15px">
<a href="/" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Home</a>
<a href="https://docs.yolog.dev" style="color: #B4BDD0; text-decoration: none; padding: 12px 0">Docs</a>
<a href="https://app.yolog.dev" style="display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: 8px; background: #2647E8; color: #FFFFFF; text-decoration: none; font-weight: 600">Sign in</a>
</div>
</nav>
</header>
<main style="max-width: 1040px; margin: 0 auto; padding: clamp(40px, 7vw, 96px) 24px clamp(64px, 8vw, 112px); display: flex; flex-direction: column; gap: clamp(48px, 6vw, 72px)">
<section style="display: flex; flex-direction: column; gap: 24px">
<p style="margin: 0; ${M}; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: ${BLUE_L}">Set up with your agent</p>
<h1 style="margin: 0; ${G}; font-weight: 700; font-size: clamp(40px, 6.4vw, 80px); line-height: 0.98; letter-spacing: -0.045em; max-width: 11em">Let your agent set up <span style="color: ${AMBER}">yolog.</span></h1>
<p style="margin: 0; font-size: clamp(18px, 1.7vw, 21px); line-height: 1.6; color: #B4BDD0; max-width: 38rem">Paste this line into Claude Code, Codex or any coding agent that can run commands. It asks for your email, you read it the code we send, and the project it is working on keeps its state in yolog. Free, one repository.</p>
<div style="display: flex; flex-wrap: wrap; align-items: stretch; gap: 10px; max-width: 860px">
<code id="prompt" style="flex: 1 1 420px; min-width: 0; display: flex; align-items: center; padding: 18px 20px; border-radius: 12px; background: #131B2E; border: 1px solid #2A3654; ${M}; font-size: 16px; line-height: 1.5; color: #EEF2FA; overflow-wrap: anywhere">${PROMPT}</code>
<span id="copy-status" role="status" aria-live="polite" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap"></span>
<button id="copy" type="button" style="flex: none; min-height: 56px; padding: 0 26px; border: 0; border-radius: 12px; background: #2647E8; color: #FFFFFF; font: 600 17px Inter, system-ui, sans-serif; cursor: pointer">Copy</button>
</div>
<p style="margin: 0; font-size: 15px; color: #9AA6BF">The instructions are plain text: <a href="/agents.md">read them yourself</a> before you hand them over.</p>
</section>
<section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: clamp(32px, 5vw, 64px)">
<div style="display: flex; flex-direction: column; gap: 20px">
<h2 style="margin: 0; ${G}; font-weight: 700; font-size: 28px; letter-spacing: -0.03em">What your agent does</h2>
<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 20px">
${step("01", "Asks for your email", "We send a 6-digit code there. Nothing else.")}
${step("02", "Asks you for the code", "It signs you up with it and gets a token for your account.")}
${step("03", "Keeps the token private", "In a file only you can read, in a folder Git ignores.")}
${step("04", "Creates the project's repository", "Then publishes a first checkpoint and reads it back, to prove it works.")}
${step("05", "Tells you what it did", "Your account, the repository, and when the token expires.")}
${step("06", "Then open it yourself", 'Sign in at <a href="https://app.yolog.dev" style="color: #8FA6FF">app.yolog.dev</a> with the same email to read everything it saved.')}
</ol>
</div>
<div style="display: flex; flex-direction: column; gap: 20px">
<h2 style="margin: 0; ${G}; font-weight: 700; font-size: 28px; letter-spacing: -0.03em">What stays private</h2>
${dcard("Tokens never reach the chat", "The agent writes the token straight to a file only you can read. It never prints it, and never puts it on a command line.")}
${dcard("Your email is not stored", "We use it to send the code, and keep only a keyed hash of it, so the same address finds the same account again.")}
${dcard("Your account only", "The token reaches your own repositories and nothing else. Lose it, and the same email gets you a new one.")}
</div>
</section>
<section style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; border-top: 1px solid #1E2942; padding-top: 32px">
<p style="margin: 0; font-size: 17px; color: #B4BDD0; max-width: 36rem">Want no limits, or your state in your own account? Run yolog yourself, on your machine or in your Cloudflare account.</p>
${btn("https://docs.yolog.dev/start/quick-start/", "Run it yourself", false)}
</section>
</main>
</div>
<script>
let reset;
document.getElementById("copy").addEventListener("click", async (e) => {
  const b = e.currentTarget, status = document.getElementById("copy-status");
  let label, ms = 2000;
  try { await navigator.clipboard.writeText(${JSON.stringify(PROMPT)}); label = "Copied"; }
  catch {
    const r = document.createRange(); r.selectNodeContents(document.getElementById("prompt")); getSelection().removeAllRanges(); getSelection().addRange(r);
    label = /Mac|iPhone|iPad/.test(navigator.platform) ? "Press \u2318C" : "Press Ctrl+C"; ms = 6000;
  }
  b.textContent = label; status.textContent = label === "Copied" ? "Copied to the clipboard" : "Selected: " + label.toLowerCase() + " to copy";
  window.posthog?.capture?.("agent_prompt_copied");
  clearTimeout(reset); reset = setTimeout(() => (b.textContent = "Copy"), ms);
});
</script>
</body>
</html>
`;

const out = new URL("./dist/", import.meta.url);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(new URL("./public/", import.meta.url), out, { recursive: true });
writeFileSync(new URL("index.html", out), html);
writeFileSync(new URL("agents.html", out), agentsHtml); // served at /agents
writeFileSync(new URL("404.html", out), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Not found — yolog</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"></head>
<body style="margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: ${INK}; color: #EEF2FA; font-family: system-ui, sans-serif; text-align: center; padding: 24px; box-sizing: border-box">
<p style="margin: 0; font-family: ui-monospace, monospace; color: ${BLUE_L}">404 · no such checkpoint</p>
<h1 style="margin: 0; font-size: 40px">This page isn't in the history.</h1>
<a href="/" style="color: #EEF2FA">Back to yolog.dev</a>
</body></html>
`);
console.log(`built dist/index.html (${html.length} bytes)`);
