# Hello MCP server for the WhatsApp Business API

[![CI](https://github.com/lakshyapocketlab/hello-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/lakshyapocketlab/hello-mcp/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/lakshyapocketlab/hello-mcp/badge)](https://scorecard.dev/viewer/?uri=github.com/lakshyapocketlab/hello-mcp)
[![npm version](https://img.shields.io/npm/v/@lakshyapocketlab/hello-mcp)](https://www.npmjs.com/package/@lakshyapocketlab/hello-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@lakshyapocketlab/hello-mcp)](https://www.npmjs.com/package/@lakshyapocketlab/hello-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node](https://img.shields.io/node/v/@lakshyapocketlab/hello-mcp)](https://nodejs.org)
[![TypeScript types included](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.typescriptlang.org)

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

## Recommended: connect to the hosted server directly

If your client supports remote (Streamable HTTP) MCP servers, skip this package. For Claude Code:

```sh
claude mcp add --transport http hello https://helloapi.lakshyapocketlab.com/mcp \
  --header "Authorization: Bearer hello_live_…"
```

Use this package when your client only speaks stdio.

## Setup

1. Create an API key (`hello_live_…`) in the Hello dashboard, under **Integrations**.
2. Add the server to your client, passing the key in its environment.

### Claude Desktop

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

### Cursor

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

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.hello]
command = "npx"
args = ["-y", "@lakshyapocketlab/hello-mcp"]
env = { HELLO_API_KEY = "hello_live_…" }
```

(Codex also supports the hosted server directly: `url = "https://helloapi.lakshyapocketlab.com/mcp"`
with `bearer_token_env_var = "HELLO_API_KEY"`.)

## Configuration

| Setting | Default | Description |
|---|---|---|
| `HELLO_API_KEY` | required | Your Hello API key. The server exits with an error on stderr if it is missing. |
| `HELLO_MCP_URL` | `https://helloapi.lakshyapocketlab.com/mcp` | MCP endpoint to proxy to. |
| `--url <url>` | | Same as `HELLO_MCP_URL`; wins over it. |
| `--help`, `--version` | | Print usage or the version and exit. |

```sh
HELLO_API_KEY=hello_live_… npx @lakshyapocketlab/hello-mcp --url http://localhost:8080/mcp
```

## How it works

```
MCP client  ──stdio──▶  hello-mcp  ──Streamable HTTP + Bearer key──▶  https://helloapi.lakshyapocketlab.com/mcp
```

`initialize`, `tools/list` and `tools/call` (plus prompts and resources if the remote advertises
them) are forwarded unchanged, and errors from the remote reach your client as-is. Logs go to
stderr only, because stdout carries the MCP stream.

Messages sent through the tools are real and billed. See the
[MCP docs](https://lakshyapocketlab.com/docs/ai/integrate-with-ai/) for the list of tools.

## Links

- Docs: https://lakshyapocketlab.com/docs/
- SDKs: [hello-node](https://github.com/lakshyapocketlab/hello-node),
  [hello-python](https://github.com/lakshyapocketlab/hello-python),
  [hello-go](https://github.com/lakshyapocketlab/hello-go)
- Examples: [hello-examples](https://github.com/lakshyapocketlab/hello-examples)

## License

MIT, Copyright Lakshya Pocket Lab.
