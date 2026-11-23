<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/lakshyapocketlab/.github/main/assets/hello-logo-on-dark.svg">
    <img alt="Hello" src="https://raw.githubusercontent.com/lakshyapocketlab/.github/main/assets/hello-logo.svg" height="56">
  </picture>
</p>

# Hello MCP server for the WhatsApp Business API

[![CI](https://github.com/lakshyapocketlab/hello-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/lakshyapocketlab/hello-mcp/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/lakshyapocketlab/hello-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/lakshyapocketlab/hello-mcp)
[![npm version](https://img.shields.io/npm/v/@lakshyapocketlab/hello-mcp)](https://www.npmjs.com/package/@lakshyapocketlab/hello-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@lakshyapocketlab/hello-mcp)](https://www.npmjs.com/package/@lakshyapocketlab/hello-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/node/v/@lakshyapocketlab/hello-mcp)](https://nodejs.org)
[![TypeScript types included](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.typescriptlang.org)
[![mcptry](https://mcptry.com/badge/io.github.lakshyapocketlab/hello)](https://mcptry.com/servers/io.github.lakshyapocketlab/hello)

Connect Claude, Cursor, Codex and other AI assistants to [Hello](https://lakshyapocketlab.com),
the WhatsApp Business API. Ask the assistant to list your numbers, send messages and templates,
check delivery and manage templates.

This package is a small **stdio** MCP server for clients that cannot talk to a remote server
(Claude Desktop, some IDEs). It does not implement any tools itself: it forwards everything to the
hosted Hello MCP endpoint (`https://helloapi.lakshyapocketlab.com/mcp`), so the tools are always the
ones the backend serves today.

- Node.js 18 or newer
- One runtime dependency: the official `@modelcontextprotocol/sdk`
- Your API key is sent only as a Bearer token to the Hello endpoint. It is never logged.

## Quick start

Two steps for every client:

1. **Get an API key.** Create one (`hello_live_…`) in the [Hello dashboard](https://hello.lakshyapocketlab.com) under **Integrations**.
2. **Add the server** to your client, using the snippet for it below.

Claude Code connects to the hosted endpoint directly, which is the recommended setup. Clients that only speak stdio use this npm package instead.

### Claude Code (recommended: remote HTTP)

```sh
claude mcp add --transport http hello https://helloapi.lakshyapocketlab.com/mcp \
  --header "Authorization: Bearer hello_live_…"
```

Run `claude mcp list` to confirm the server is connected.

### Claude Desktop (npx)

Edit `claude_desktop_config.json` (Settings, Developer, Edit Config):

```json
{
  "mcpServers": {
    "hello": {
      "command": "npx",
      "args": ["-y", "@lakshyapocketlab/hello-mcp"],
      "env": { "HELLO_API_KEY": "hello_live_…" }
    }
  }
}
```

Restart Claude Desktop. The Hello tools appear in the tools menu.

### Cursor (npx)

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (all projects):

```json
{
  "mcpServers": {
    "hello": {
      "command": "npx",
      "args": ["-y", "@lakshyapocketlab/hello-mcp"],
      "env": { "HELLO_API_KEY": "hello_live_…" }
    }
  }
}
```

### Codex (npx)

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.hello]
command = "npx"
args = ["-y", "@lakshyapocketlab/hello-mcp"]
env = { HELLO_API_KEY = "hello_live_…" }
```

Codex can also use the hosted endpoint directly: set `url = "https://helloapi.lakshyapocketlab.com/mcp"` and `bearer_token_env_var = "HELLO_API_KEY"`.

## Setup

### Requirements

- Node.js 18 or newer, for `npx` or a global install.
- A Hello API key. The server reads it from `HELLO_API_KEY` in its environment and sends it only as a Bearer token to the Hello endpoint.

### Configuration

| Setting | Default | Description |
|---|---|---|
| `HELLO_API_KEY` | required | Your Hello API key. The server exits with an error on stderr if it is missing. |
| `HELLO_MCP_URL` | `https://helloapi.lakshyapocketlab.com/mcp` | MCP endpoint to proxy to. |
| `--url <url>` | | Same as `HELLO_MCP_URL`; wins over it. Must be `http` or `https`. |
| `--help`, `--version` | | Print usage or the version and exit. |

To point the server at another endpoint, such as a local or staging deployment, set `HELLO_MCP_URL` in the client's `env` block, or pass `--url`:

```sh
HELLO_API_KEY=hello_live_… npx @lakshyapocketlab/hello-mcp --url http://localhost:8080/mcp
```

Logs go to stderr only, because stdout carries the MCP stream.

## Tools

The server exposes the tools of the hosted endpoint, so the list is always the one the backend serves. These are the tools it provides today.

| Tool | What it does |
|---|---|
| `ping` | Checks that the API key works. |
| `list_phone_numbers` | Lists the sending numbers with their `phone_number_id` and `waba_id`, and whether each can send. Call it first if you do not know these IDs. |
| `send_message` | Sends a WhatsApp message in Cloud API format (text, template, media, interactive, reaction, ...), or marks a received message as read. Real and billed. |
| `get_message_status` | Gets a sent message by its ID: queued, sent, delivered, read or failed. |
| `upload_media` | Uploads a file (about 7 MB) for a media message or template header, and returns a media ID. |
| `list_templates` | Lists a WhatsApp Business Account's templates, filtered by status, category or language. Paged. |
| `get_template` | Gets one template with its components and `{{variables}}`. |
| `create_template` | Submits a new template to Meta for review. |
| `create_templates_bulk` | Creates or edits up to 100 templates in one call. |
| `edit_template` | Edits an approved, rejected or paused template. It goes back to review. |
| `sync_templates` | Re-reads every template of the account from Meta. |
| `delete_template` | Permanently deletes one language of a template. Destructive. |
| `delete_templates_by_name` | Permanently deletes every language of a template name. Destructive. |
| `get_webhook_override` | Shows whether a number's webhook is overridden to the user's own URL, and that override's status. |
| `set_webhook_override` | Points a number's webhook at the user's own URL. Hello stops showing that number's incoming messages and statuses. |
| `remove_webhook_override` | Removes the direct webhook, so Hello receives the number's events again. |
| `reapply_webhook_override` | Applies a stored direct webhook on Meta again, when its status is `draft`. |

The server also provides `get_guide`, with reference topics `messages` (message formats), `templates`, `errors` (error codes and fixes) and `direct_webhook`.

Messages are real and billed, and the delete tools are permanent. Free-form messages need an open 24-hour window with the recipient; otherwise the assistant should send an approved template. `set_webhook_override` changes where a number's events go, so the assistant should confirm it with you first.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `HELLO_API_KEY is not set` | Add the key to the server's `env` block and restart the client. For the Claude Code HTTP setup, re-run `claude mcp add` with the `--header` value. |
| `Invalid MCP URL` or `must be http or https` | Check `HELLO_MCP_URL` or `--url`. The value must be a full `http://` or `https://` URL, normally ending in `/mcp`. |
| `Unknown argument` | The server accepts only `--url`, `--help` and `--version`. |
| `could not connect to <url>` | Check your network, proxy or firewall, and that the URL is reachable from this machine. |
| Authentication errors from a tool | The key is wrong or has been revoked. Create a new key in the dashboard and update the client's configuration. |
| Tools do not appear in Claude Desktop | Check that the JSON is valid, then quit Claude Desktop completely and reopen it. |
| `npx` fails to start the server | Check the Node version with `node --version`; it must be 18 or newer. Run `npx -y @lakshyapocketlab/hello-mcp --version` in a terminal to see the error. |
| A send fails with error code `131047` | The recipient has not messaged the number in the last 24 hours. Send an approved template instead. |

If none of these apply, contact support@lakshyapocketlab.com and include the FBTrace ID from the error, if one is shown.

## How it works

```
MCP client  ──stdio──▶  hello-mcp  ──Streamable HTTP + Bearer key──▶  https://helloapi.lakshyapocketlab.com/mcp
```

`initialize`, `tools/list` and `tools/call` (plus prompts and resources if the remote advertises them) are forwarded unchanged, and errors from the remote reach your client as-is. Nothing is reimplemented locally, so the tool list and results never drift from the hosted endpoint.

## More examples

The [hello-examples](https://github.com/lakshyapocketlab/hello-examples) repository has setup guides and runnable programs:

- [`ai-agents`](https://github.com/lakshyapocketlab/hello-examples/tree/main/ai-agents): connect Claude Code, Claude Desktop, Cursor or Codex to Hello over MCP
- [`n8n`](https://github.com/lakshyapocketlab/hello-examples/tree/main/n8n): send messages from n8n workflows
- [`webhooks`](https://github.com/lakshyapocketlab/hello-examples/tree/main/webhooks): receive and verify webhooks

## Links

- Docs: [lakshyapocketlab.com/docs](https://lakshyapocketlab.com/docs/), including the [MCP integration guide](https://lakshyapocketlab.com/docs/ai/integrate-with-ai/)
- SDKs: [hello-node](https://github.com/lakshyapocketlab/hello-node), [hello-python](https://github.com/lakshyapocketlab/hello-python), [hello-go](https://github.com/lakshyapocketlab/hello-go)
- Examples: [hello-examples](https://github.com/lakshyapocketlab/hello-examples)
- Support: support@lakshyapocketlab.com
- [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [CHANGELOG.md](CHANGELOG.md)

## License

MIT, Copyright Lakshya Pocket Lab.
