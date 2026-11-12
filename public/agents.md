# Set up yolog for this project

You are an AI agent, and the person you work for wants yolog for the project you are working on. yolog keeps an agent's state (logs, notes, plans, files) as a versioned history: every publish is a checkpoint, with branches, safe retries and full export. Docs: https://docs.yolog.dev

These steps sign the person up for yolog's free tier at `https://api.yolog.dev` (one repository) and connect this project to it. Do them in order. Where a step says **ask**, ask the person and wait for the answer.

## Why use it

What you know about this project lives in your context and on this machine, and both are lost easily: the session ends, the context is compacted, the machine changes. With yolog, the next session (yours or another agent's) reads the plan, notes and log that earlier sessions saved and starts where they stopped. Every save is a checkpoint, so a bad edit or a failed experiment can be undone, and risky work goes on a branch while `main` stays as it was.

## Rules

- **A token never appears in your output.** The scripts below write it straight to files. Never print, echo, log or paste a token, and never put one on a command line: `curl` reads it from a header file (`-H @.yolog/auth.header`).
- **Run every command from the project's root folder.** Some steps create `.yolog/` there.
- **Replace each `<placeholder>` with its value** in the command itself. Do not rely on shell variables: your shell may not keep them between commands.
- If a step fails, stop and show the person the error's `code` and `message` (never a token).

## 1. The person's email (ask)

Ask the person for their email address. yolog sends a 6-digit code there; nothing else is sent, and the address is not stored. The same address later finds the same account.

## 2. Send the code

```sh
curl -s https://api.yolog.dev/signup/email -H 'content-type: application/json' -d '{"email": "<email>"}'
```

It answers `{"sent": true, "expiresInSeconds": 600}`. Other answers:

| `error.code` (`details.reason`) | Meaning |
|---|---|
| `invalid_request` (`invalid_email`) | Not an email address: ask again. |
| `invalid_request` (`disposable_email`) | Throwaway addresses cannot sign up: ask for another. |
| `rate_limited` | A code was sent less than a minute ago, or too many this hour. Wait the seconds in the `Retry-After` header. |

## 3. The code (ask), and the token

Ask the person for the 6-digit code from the email. Make sure `.yolog/` is ignored by Git before any token is written:

```sh
touch .gitignore
grep -qxF '.yolog/' .gitignore || { [ -z "$(tail -c1 .gitignore)" ] || echo >> .gitignore; echo '.yolog/' >> .gitignore; }
```

Then verify the code. This writes the token to `.yolog/token` and a header file for `curl` to `.yolog/auth.header` (both readable by the person only), and prints only the owner and the expiry:

```sh
node --input-type=module -e '
import { writeFileSync, mkdirSync } from "node:fs";
const [email, code] = process.argv.slice(1);
const r = await fetch("https://api.yolog.dev/signup/verify", { method: "POST",
  headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code }) });
const j = await r.json().catch(() => ({ error: { code: "http_" + r.status } }));
if (!r.ok) { console.error(j.error?.code, j.error?.message ?? "", JSON.stringify(j.error?.details ?? {})); process.exit(1); }
mkdirSync(".yolog", { recursive: true, mode: 0o700 });
writeFileSync(".yolog/token", j.token, { mode: 0o600 });
writeFileSync(".yolog/auth.header", "authorization: Bearer " + j.token + "\n", { mode: 0o600 });
writeFileSync(".yolog/config.json", JSON.stringify({ url: "https://api.yolog.dev", owner: j.owner }, null, 2) + "\n");
console.log("owner " + j.owner + "; token in .yolog/token; expires " + j.expiresAt);
' "<email>" "<code>"
```

It needs Node 18 or later. A wrong code answers `wrong_code` with `triesLeft`; after 5 wrong tries, or after 10 minutes, the code is spent (`too_many_tries`, `no_code`): go back to step 2.

The owner (`free:u_…`) is the person's account. The token can create and write that owner's repositories, and nothing else.

**If the project runs as a Cloudflare Worker**, its code cannot read `.yolog/token` at run time. Upload it as a secret instead, from the file: `npx wrangler secret put YOLOG_TOKEN < .yolog/token` (use the name the project's code reads).

## 4. The project's repository

Create it, named after the project. Creating is idempotent by `operationId`: running this again returns the same repository.

```sh
curl -s "https://api.yolog.dev/v1/owners/<owner>/repositories" -H @.yolog/auth.header \
  -H 'content-type: application/json' -d '{"operationId": "project:<project name>"}'
```

The answer has the repository's `id` (`r_…`). Add it to `.yolog/config.json` as `"repository"`.

The free tier has one repository. A second `operationId` answers `limit_exceeded`: reuse the first repository (one repository holds any number of files and branches), or see "More than the free tier" below.

## 5. Check it works

Publish a first checkpoint, then read the head back. `expectedHead` is `null` because the branch is empty.

```sh
curl -s "https://api.yolog.dev/v1/repositories/<id>/publish" -H @.yolog/auth.header \
  -H 'content-type: application/json' \
  -d '{"expectedHead": null, "operationId": "setup-1", "capture": {"files": [{"path": "README.md", "text": "State for this project, kept by yolog.\n"}], "message": "Set up yolog"}}'
curl -s "https://api.yolog.dev/v1/repositories/<id>/head" -H @.yolog/auth.header
```

The head's `checkpoint` is the one the publish returned.

## 6. Connect yourself (MCP)

If you are a coding agent with MCP support (Claude Code, Codex, Cursor and others), connect to yolog's MCP endpoint, `https://api.yolog.dev/mcp`, so you can save and read the project's state with tools in every later session. It needs nothing installed.

**Claude Code:** create `.mcp.json` in the project's root folder (or add the `yolog` entry to an existing one). It holds no secret: it reads the token from `.yolog/token` each time it connects, so it can be committed.

```json
{
  "mcpServers": {
    "yolog": {
      "type": "http",
      "url": "https://api.yolog.dev/mcp",
      "headersHelper": "printf '{\"Authorization\":\"Bearer %s\"}' \"$(cat .yolog/token)\""
    }
  }
}
```

**Other MCP clients:** the streamable HTTP transport, the URL above, and the header `Authorization: Bearer <token>`. Give the client the token from `.yolog/token` the way it allows (an environment variable or a command, where it has them), and never paste the token into a file that is committed.

Then add this to the project's `CLAUDE.md` or `AGENTS.md` (create it if there is none), so every session uses yolog:

```md
## Project state

This project keeps its working state in yolog (MCP server `yolog`).
- At the start of a session, read plan.md, notes.md and decisions.md, and the latest history.
- Save after meaningful progress: the plan when it changes, decisions with reasons, what was tried and failed, and a summary when a task ends. Append a line to logs/sessions.jsonl for each session.
- Try risky alternatives on a branch.
- Never save secrets.
```

The tools are available from the next session: in Claude Code, after a restart, once the person trusts the project folder and approves the `yolog` server. Anyone else working on the project needs their own `.yolog/token` (steps 1 to 3); without it, the connection is refused. Guide: https://docs.yolog.dev/guides/connect-an-agent/

## 7. Use it from the project's code

Read the URL, owner and repository from `.yolog/config.json`, and the token from `.yolog/token`, at run time. Never copy the token into code.

- **Rust:** `yolog = { version = "0.1", features = ["reqwest"] }` from crates.io. https://docs.yolog.dev/reference/rust-client/
- **Anything else:** the HTTP API, with the token as `authorization: Bearer <token>`. https://docs.yolog.dev/reference/http-api/

Good first uses: append each turn of a conversation to a log (https://docs.yolog.dev/guides/save-a-conversation-log/), and restore after a crash (https://docs.yolog.dev/guides/restore-after-a-crash/).

## 8. Tell the person

In a few lines: their owner (`free:u_…`), the repository, that the token is in `.yolog/` and Git ignores it, whether you connected yourself through MCP (and that a restart makes the tools available), and the date the token expires. To renew it, or on a new machine, repeat steps 2 and 3 with the same email: the same owner comes back with its repository, and a new token. After a renewal, reconnect the MCP server (in Claude Code, `/mcp`, or a restart).

## More than the free tier

- **Run yolog yourself**, on your machine or in your own Cloudflare account, with no limits but your own: https://docs.yolog.dev/start/quick-start/ and https://docs.yolog.dev/start/deploy-to-cloudflare/
- **A platform with many users** (a backend that creates them): https://docs.yolog.dev/guides/multi-user-platform/
