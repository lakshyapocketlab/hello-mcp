import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { HELP, UsageError, parseArgs } from "./args.js";
import { connectRemote, createProxy } from "./proxy.js";
import { VERSION } from "./version.js";

export interface CliIO {
  /** Process stdout. Only --help and --version write here; the MCP stream owns stdout otherwise. */
  stdout: (text: string) => void;
  /** Process stderr: the only place logs go. */
  stderr: (text: string) => void;
  connect?: (url: string, apiKey: string) => Promise<Client>;
  transport?: () => Transport;
}

/** Runs the CLI. Resolves with the exit code once started (0), or immediately on failure (1). */
export async function main(
  argv: string[],
  env: Record<string, string | undefined>,
  io: CliIO,
): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs(argv, env);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    io.stderr(`hello-mcp: ${err.message}\n`);
    return 1;
  }
  if (parsed.kind === "help") {
    io.stdout(HELP);
    return 0;
  }
  if (parsed.kind === "version") {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  let remote: Client;
  try {
    remote = await (io.connect ?? connectRemote)(parsed.url, parsed.apiKey);
  } catch (err) {
    // The error never contains the key: it is only sent in a header.
    const message = err instanceof Error ? err.message : String(err);
    io.stderr(`hello-mcp: could not connect to ${parsed.url}: ${message}\n`);
    return 1;
  }

  const server = createProxy(remote);
  server.onclose = () => void remote.close();
  await server.connect(io.transport ? io.transport() : new StdioServerTransport());
  io.stderr(`hello-mcp ${VERSION}: proxying stdio to ${parsed.url}\n`);
  return 0;
}
