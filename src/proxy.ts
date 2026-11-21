import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { VERSION } from "./version.js";

/** Connects a Client to the hosted Hello MCP endpoint with the API key as a Bearer token. */
export async function connectRemote(url: string, apiKey: string): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": `hello-mcp/${VERSION}` },
    },
  });
  const client = new Client({ name: "hello-mcp", version: VERSION });
  await client.connect(transport);
  return client;
}

/**
 * Builds a stdio-facing Server that forwards every request to `remote`. Nothing is reimplemented
 * here: the tool list, schemas and results all come from the hosted endpoint, so they never drift.
 * Prompts and resources are forwarded only when the remote advertises them.
 * Errors from the remote (JSON-RPC errors) propagate to the caller unchanged.
 */
export function createProxy(remote: Client): Server {
  const caps = remote.getServerCapabilities() ?? {};
  const info = remote.getServerVersion();
  const server = new Server(
    { name: info?.name ?? "hello", version: info?.version ?? VERSION },
    {
      capabilities: {
        ...(caps.tools ? { tools: {} } : {}),
        ...(caps.prompts ? { prompts: {} } : {}),
        ...(caps.resources ? { resources: {} } : {}),
      },
      ...(remote.getInstructions() ? { instructions: remote.getInstructions()! } : {}),
    },
  );

  if (caps.tools) {
    server.setRequestHandler(ListToolsRequestSchema, (req) => remote.listTools(req.params));
    server.setRequestHandler(CallToolRequestSchema, (req) => remote.callTool(req.params));
  }
  if (caps.prompts) {
    server.setRequestHandler(ListPromptsRequestSchema, (req) => remote.listPrompts(req.params));
    server.setRequestHandler(GetPromptRequestSchema, (req) => remote.getPrompt(req.params));
  }
  if (caps.resources) {
    server.setRequestHandler(ListResourcesRequestSchema, (req) => remote.listResources(req.params));
    server.setRequestHandler(ListResourceTemplatesRequestSchema, (req) =>
      remote.listResourceTemplates(req.params),
    );
    server.setRequestHandler(ReadResourceRequestSchema, (req) => remote.readResource(req.params));
  }
  return server;
}
