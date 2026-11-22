# Changelog

## 0.1.1

- Fix: the default MCP endpoint is now `https://helloapi.lakshyapocketlab.com/mcp` (was `api.lakshyapocketlab.com`).
- README: add status badges.

## 0.1.0

- Initial release: a stdio MCP server that proxies `initialize`, `tools/list` and `tools/call`
  (and prompts and resources, when the remote advertises them) to the hosted Hello MCP endpoint.
- Configuration through `HELLO_API_KEY`, `HELLO_MCP_URL` and the `--url`, `--help` and
  `--version` flags.
