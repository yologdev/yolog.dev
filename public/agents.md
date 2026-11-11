# Set up yolog for this project

You are an AI agent, and the person you work for wants yolog for the project you are working on. yolog keeps an agent's state (logs, notes, plans, files) as a versioned history: every publish is a checkpoint, with branches, safe retries and full export. Docs: https://docs.yolog.dev

Do the steps in order. Where a step says **ask**, ask the person and wait for the answer.

## Rules

- Never print, echo, log or paste a token or a secret, and never put one on a command line. Write each to a file only its owner can read (mode 600), and read it from that file.
- Before you write a token file inside the project, add its folder to `.gitignore`.
- The operator token never goes into the project. The project gets a token for one owner only.
- Do not create cloud resources or deploy anything before the person says yes.
- If a step fails, stop and show the person the error code and message (never a token).

## 1. Where yolog runs (ask)

Ask the person which they want:

- **On this machine.** Offline, no account, ready in a few minutes. The state lives in a folder on this machine. Good for trying yolog and for local agents.
- **In their own Cloudflare account.** The state lives in that account and outlives this machine. Needs the Workers Paid plan, with Cloudflare Artifacts and R2 enabled.

A hosted yolog with a free tier is coming; it is not open for sign-up yet.

Either way, check first that `node --version` is 22.13 or later and that `git` is installed, then get the code outside the project:

```sh
git clone https://github.com/yologdev/yolog ~/.yolog/yolog
cd ~/.yolog/yolog && npm ci
```

## 2a. On this machine

Start yolog in the background, so it keeps running after this command returns, and keep its data in `~/.yolog/data`:

```sh
cd ~/.yolog/yolog
nohup node scripts/local-host.mjs --data ~/.yolog/data --port 8790 > ~/.yolog/host.log 2>&1 &
for i in $(seq 1 60); do curl -sf http://127.0.0.1:8790/health && break; sleep 1; done
```

It answers `{"ok":true}`, after about 10 seconds the first time (it builds itself first). If it never does, read `~/.yolog/host.log`. On its first start it writes the operator token to `~/.yolog/data/secrets.json` (field `STATE_ADMIN_TOKEN`, mode 600). Then:

- `YOLOG_URL` is `http://127.0.0.1:8790`
- `OPERATOR_TOKEN_FILE` is `~/.yolog/data/secrets.json`

Tell the person that yolog stops when the machine restarts, and that the `nohup` command above starts it again with the same data.

## 2b. In their Cloudflare account

Follow https://docs.yolog.dev/start/deploy-to-cloudflare/ from the clone. In short:

```sh
cd ~/.yolog/yolog
npx wrangler login                      # the person signs in, in their browser
npx wrangler deploy --dry-run --outdir dist/cloudflare
```

Then **ask** before you go on: the next commands create a storage bucket and deploy a Worker in the person's account, and the Worker costs money to run (https://docs.yolog.dev/operate/costs/).

```sh
mkdir -p ~/.yolog/cloudflare && chmod 700 ~/.yolog/cloudflare
(umask 077; openssl rand -hex 32 > ~/.yolog/cloudflare/admin.token; openssl rand -hex 32 > ~/.yolog/cloudflare/token.secret)
npx wrangler r2 bucket create yolog-artifacts
npx wrangler secret put STATE_ADMIN_TOKEN < ~/.yolog/cloudflare/admin.token
npx wrangler secret put STATE_TOKEN_SECRET < ~/.yolog/cloudflare/token.secret
npx wrangler deploy
```

Wrangler prints the Worker's URL; `curl -s <url>/health` answers `{"ok":true}`. Then:

- `YOLOG_URL` is that URL, with no trailing slash
- `OPERATOR_TOKEN_FILE` is `~/.yolog/cloudflare/admin.token`

Tell the person to keep `~/.yolog/cloudflare/admin.token` safe: it can do everything, and it is the only way to mint new tokens.

## 3. A token for this project

Choose an owner name: the person's handle or the project's name, letters, digits, `.`, `_` and `-` (for example `ada` or `acme-web`). Do not use `:` (it names a tenant). The owner holds this project's repositories.

From the project's root, mint a `write` token for that owner, valid for 30 days, straight into `.yolog/token`:

```sh
mkdir -p .yolog && chmod 700 .yolog
grep -qxF '.yolog/' .gitignore 2>/dev/null || echo '.yolog/' >> .gitignore
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const [url, file, owner] = process.argv.slice(1);
let op = readFileSync(file, "utf8").trim();
if (op.startsWith("{")) op = JSON.parse(op).STATE_ADMIN_TOKEN;
const r = await fetch(url + "/v1/tokens", { method: "POST",
  headers: { authorization: "Bearer " + op, "content-type": "application/json" },
  body: JSON.stringify({ owner, scope: "write", ttlSeconds: 30 * 86400 }) });
const j = await r.json();
if (!r.ok) { console.error(j.error?.code, j.error?.message); process.exit(1); }
writeFileSync(".yolog/token", j.token, { mode: 0o600 });
console.log("wrote .yolog/token, valid 30 days");
' "$YOLOG_URL" "$OPERATOR_TOKEN_FILE" "<owner>"
```

The token can create and write repositories of that owner, and nothing else. When it expires, requests answer `401 unauthorized`: run this step again.

## 4. The project's repository

Create it. Creation is idempotent by `operationId`, so use the project's name: running this again returns the same repository.

```sh
curl -s "$YOLOG_URL/v1/owners/<owner>/repositories" \
  -H "authorization: Bearer $(cat .yolog/token)" -H "content-type: application/json" \
  -d '{"operationId": "project:<project name>"}'
```

The answer has the repository's `id` (`r_…`). Write the non-secret settings to `.yolog/config.json`:

```json
{ "url": "<YOLOG_URL>", "owner": "<owner>", "repository": "<id>" }
```

## 5. Check it works

Publish a first checkpoint, then read the head back. `expectedHead` is `null` because the branch is empty.

```sh
curl -s "$YOLOG_URL/v1/repositories/<id>/publish" \
  -H "authorization: Bearer $(cat .yolog/token)" -H "content-type: application/json" \
  -d '{"expectedHead": null, "operationId": "setup-1",
       "capture": {"files": [{"path": "README.md", "text": "State for this project, kept by yolog.\n"}],
                   "message": "Set up yolog"}}'
curl -s "$YOLOG_URL/v1/repositories/<id>/head" -H "authorization: Bearer $(cat .yolog/token)"
```

The head's `checkpoint` is the one the publish returned.

## 6. Use it from the project's code

Read the URL and the repository from `.yolog/config.json` and the token from `.yolog/token` at run time; never copy the token into code.

- **Rust:** `yolog = { version = "0.1", features = ["reqwest"] }` from crates.io. https://docs.yolog.dev/reference/rust-client/
- **JavaScript (Node 22.13+):** `npm install github:yologdev/yolog`, then `import { StateClient } from "yolog/src/client.mjs"`. https://docs.yolog.dev/reference/javascript-client/
- **Anything else:** the HTTP API. https://docs.yolog.dev/reference/http-api/

Good first uses: append each turn of a conversation to a log (https://docs.yolog.dev/guides/save-a-conversation-log/), and restore after a crash (https://docs.yolog.dev/guides/restore-after-a-crash/).

## 7. Tell the person

In a few lines: where yolog runs and how to start it again, where the operator token is (outside the project), the owner and the repository, that `.yolog/` is in `.gitignore`, and the date the project's token expires.
