import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it, vi } from "vitest";
import { main, type CliIO } from "../src/cli.js";
import { VERSION } from "../src/version.js";
import { fakeRemote } from "./helpers.js";

function io(extra: Partial<CliIO> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, io: { stdout: (t: string) => out.push(t), stderr: (t: string) => err.push(t), ...extra } };
}

const env = { HELLO_API_KEY: "hello_live_secret" };

describe("main", () => {
  it("prints help and version to stdout", async () => {
    const a = io();
    expect(await main(["--help"], {}, a.io)).toBe(0);
    expect(a.out.join("")).toContain("Usage:");
    const b = io();
    expect(await main(["--version"], {}, b.io)).toBe(0);
    expect(b.out.join("")).toBe(`${VERSION}\n`);
  });

  it("reports a missing key on stderr with exit code 1", async () => {
    const a = io();
    expect(await main([], {}, a.io)).toBe(1);
    expect(a.out).toEqual([]);
    expect(a.err.join("")).toContain("HELLO_API_KEY is not set");
  });

  it("rethrows non-usage errors", async () => {
    const a = io();
    const bad = { ...env, get HELLO_API_KEY(): string { throw new TypeError("boom"); } };
    await expect(main([], bad, a.io)).rejects.toThrow("boom");
  });

  it("reports connection failures without leaking the key", async () => {
    const a = io({ connect: async () => { throw new Error("ECONNREFUSED"); } });
    expect(await main([], env, a.io)).toBe(1);
    expect(a.err.join("")).toContain("could not connect");
    expect(a.err.join("")).toContain("ECONNREFUSED");
    expect(a.err.join("")).not.toContain("hello_live_secret");

    const b = io({ connect: async () => { throw "plain"; } });
    expect(await main([], env, b.io)).toBe(1);
    expect(b.err.join("")).toContain("plain");
  });

  it("serves the proxy, logs only to stderr and closes the remote with the server", async () => {
    const { client: remote } = await fakeRemote();
    const closeSpy = vi.spyOn(remote, "close");
    const connect = vi.fn(async () => remote);
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const a = io({ connect, transport: () => serverSide });

    expect(await main(["--url", "https://x.test/mcp"], env, a.io)).toBe(0);
    expect(connect).toHaveBeenCalledWith("https://x.test/mcp", "hello_live_secret");
    expect(a.out).toEqual([]);
    expect(a.err.join("")).toContain("proxying stdio");
    expect(a.err.join("")).not.toContain("hello_live_secret");

    const desktop = new Client({ name: "desktop", version: "0" });
    await desktop.connect(clientSide);
    expect((await desktop.listTools()).tools[0]?.name).toBe("ping");
    await desktop.close();
    await vi.waitFor(() => expect(closeSpy).toHaveBeenCalled());
  });

  it("defaults to the stdio transport and the real remote connector", async () => {
    const { client: remote } = await fakeRemote();
    const a = io({ connect: async () => remote });
    // No transport override: a real StdioServerTransport attaches to process.stdin/stdout.
    expect(await main([], env, a.io)).toBe(0);
    await remote.close();
  });
});
