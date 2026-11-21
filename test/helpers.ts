import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export interface FakeOptions {
  tools?: boolean;
  prompts?: boolean;
  resources?: boolean;
  instructions?: string;
  named?: boolean;
}

/** A fake hosted Hello MCP server, wired to a Client over an in-memory transport. */
export async function fakeRemote(opts: FakeOptions = {}): Promise<{ client: Client; server: Server }> {
  const { tools = true, prompts = false, resources = false } = opts;
  const server = new Server(
    opts.named === false ? ({} as never) : { name: "hello-remote", version: "9.9.9" },
    {
      capabilities: {
        ...(tools ? { tools: {} } : {}),
        ...(prompts ? { prompts: {} } : {}),
        ...(resources ? { resources: {} } : {}),
      },
      ...(opts.instructions ? { instructions: opts.instructions } : {}),
    },
  );
  if (tools) {
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{ name: "ping", description: "Ping", inputSchema: { type: "object" as const } }],
    }));
    server.setRequestHandler(CallToolRequestSchema, async (req) => {
      if (req.params.name === "boom") throw new McpError(ErrorCode.InvalidParams, "bad arguments");
      return { content: [{ type: "text", text: JSON.stringify(req.params.arguments ?? {}) }] };
    });
  }
  if (prompts) {
    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [{ name: "welcome" }],
    }));
    server.setRequestHandler(GetPromptRequestSchema, async (req) => ({
      messages: [{ role: "user", content: { type: "text", text: `prompt:${req.params.name}` } }],
    }));
  }
  if (resources) {
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [{ uri: "hello://guide", name: "guide" }],
    }));
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [{ uriTemplate: "hello://msg/{id}", name: "msg" }],
    }));
    server.setRequestHandler(ReadResourceRequestSchema, async (req) => ({
      contents: [{ uri: req.params.uri, text: "guide text" }],
    }));
  }
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "proxy-under-test", version: "0" });
  await client.connect(clientSide);
  return { client, server };
}

/** A downstream MCP client (what Claude Desktop would be) connected to a proxy Server. */
export async function downstream(proxy: Server): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await proxy.connect(serverSide);
  const client = new Client({ name: "desktop", version: "0" });
  await client.connect(clientSide);
  return client;
}
