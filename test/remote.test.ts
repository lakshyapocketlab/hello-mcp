import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, it } from "vitest";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { main } from "../src/cli.js";
import { connectRemote } from "../src/proxy.js";

let http: HttpServer | undefined;
afterEach(() => new Promise<void>((done) => (http ? http.close(() => done()) : done())));

/** A stateless Streamable HTTP MCP endpoint, like the hosted one, that records request headers. */
async function startRemote(seen: Array<Record<string, string | string[] | undefined>>) {
  http = createServer(async (req, res) => {
    seen.push(req.headers);
    if (req.headers.authorization !== "Bearer good") {
      res.writeHead(401).end("unauthorized");
      return;
    }
    const server = new Server({ name: "hello", version: "1" }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: "ping", inputSchema: { type: "object" as const } }],
    }));
    server.setRequestHandler(CallToolRequestSchema, async () => ({
      content: [{ type: "text", text: '{"status":"ok"}' }],
    }));
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  await new Promise<void>((r) => http!.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`;
}

describe("connectRemote", () => {
  it("sends the Bearer key and a User-Agent over Streamable HTTP", async () => {
    const seen: Array<Record<string, string | string[] | undefined>> = [];
    const url = await startRemote(seen);
    const client = await connectRemote(url, "good");
    expect((await client.listTools()).tools[0]?.name).toBe("ping");
    expect((await client.callTool({ name: "ping" })).content).toEqual([
      { type: "text", text: '{"status":"ok"}' },
    ]);
    expect(seen[0]?.authorization).toBe("Bearer good");
    expect(String(seen[0]?.["user-agent"])).toMatch(/^hello-mcp\//);
    await client.close();
  });

  it("rejects when the key is refused", async () => {
    const url = await startRemote([]);
    await expect(connectRemote(url, "bad")).rejects.toThrow();
  });
});

describe("main with the real remote connector", () => {
  it("proxies a stdio client to a Streamable HTTP endpoint", async () => {
    const url = await startRemote([]);
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const code = await main(["--url", url], { HELLO_API_KEY: "good" }, {
      stdout: () => {},
      stderr: () => {},
      transport: () => serverSide,
    });
    expect(code).toBe(0);
    const desktop = new Client({ name: "desktop", version: "0" });
    await desktop.connect(clientSide);
    expect((await desktop.callTool({ name: "ping" })).content).toEqual([
      { type: "text", text: '{"status":"ok"}' },
    ]);
    await desktop.close();
  });
});
