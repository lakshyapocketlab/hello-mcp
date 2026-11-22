import { VERSION } from "./version.js";

export const DEFAULT_URL = "https://helloapi.lakshyapocketlab.com/mcp";

export const HELP = `hello-mcp ${VERSION}
Hello MCP server for the WhatsApp Business API (stdio proxy to the hosted /mcp endpoint).

Usage:
  HELLO_API_KEY=hello_live_... hello-mcp [--url <mcp-url>]

Options:
  --url <url>    Hello MCP endpoint (default: ${DEFAULT_URL}, or $HELLO_MCP_URL)
  --help, -h     Show this help
  --version, -v  Show the version

Environment:
  HELLO_API_KEY   Your Hello API key (required)
  HELLO_MCP_URL   Override the MCP endpoint URL
`;

export type Parsed =
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "run"; url: string; apiKey: string };

export class UsageError extends Error {}

/** Parses argv (without node and script) and the environment. Throws UsageError. */
export function parseArgs(argv: string[], env: Record<string, string | undefined>): Parsed {
  let url: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--help" || arg === "-h") return { kind: "help" };
    if (arg === "--version" || arg === "-v") return { kind: "version" };
    if (arg === "--url") {
      const value = argv[++i];
      if (!value) throw new UsageError("--url needs a value");
      url = value;
    } else if (arg.startsWith("--url=")) {
      url = arg.slice("--url=".length);
      if (!url) throw new UsageError("--url needs a value");
    } else {
      throw new UsageError(`Unknown argument: ${arg}`);
    }
  }

  const apiKey = env.HELLO_API_KEY?.trim();
  if (!apiKey) {
    throw new UsageError(
      "HELLO_API_KEY is not set. Create an API key (hello_live_...) in the Hello dashboard and " +
        "pass it in the server's environment.",
    );
  }

  const target = url ?? (env.HELLO_MCP_URL?.trim() || DEFAULT_URL);
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    throw new UsageError(`Invalid MCP URL: ${target}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new UsageError(`Invalid MCP URL (must be http or https): ${target}`);
  }
  return { kind: "run", url: parsed.toString(), apiKey };
}
