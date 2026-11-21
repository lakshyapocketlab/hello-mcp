import { describe, expect, it } from "vitest";
import { DEFAULT_URL, UsageError, parseArgs } from "../src/args.js";

const env = { HELLO_API_KEY: "hello_live_x" };

describe("parseArgs", () => {
  it("returns help and version before checking the key", () => {
    expect(parseArgs(["--help"], {})).toEqual({ kind: "help" });
    expect(parseArgs(["-h"], {})).toEqual({ kind: "help" });
    expect(parseArgs(["--version"], {})).toEqual({ kind: "version" });
    expect(parseArgs(["-v"], {})).toEqual({ kind: "version" });
  });

  it("uses the default URL and trims the key", () => {
    expect(parseArgs([], { HELLO_API_KEY: "  k  " })).toEqual({
      kind: "run",
      url: DEFAULT_URL,
      apiKey: "k",
    });
  });

  it("prefers --url over HELLO_MCP_URL over the default", () => {
    expect(parseArgs([], { ...env, HELLO_MCP_URL: "https://a.test/mcp" })).toMatchObject({
      url: "https://a.test/mcp",
    });
    expect(parseArgs(["--url", "https://b.test/mcp"], { ...env, HELLO_MCP_URL: "https://a.test/mcp" })).toMatchObject({
      url: "https://b.test/mcp",
    });
    expect(parseArgs(["--url=http://localhost:8080/mcp"], env)).toMatchObject({
      url: "http://localhost:8080/mcp",
    });
    expect(parseArgs([], { ...env, HELLO_MCP_URL: "   " })).toMatchObject({ url: DEFAULT_URL });
  });

  it("fails clearly without a key", () => {
    expect(() => parseArgs([], {})).toThrow(/HELLO_API_KEY is not set/);
    expect(() => parseArgs([], { HELLO_API_KEY: "  " })).toThrow(UsageError);
  });

  it("rejects bad arguments", () => {
    expect(() => parseArgs(["--url"], env)).toThrow(/needs a value/);
    expect(() => parseArgs(["--url="], env)).toThrow(/needs a value/);
    expect(() => parseArgs(["--nope"], env)).toThrow(/Unknown argument: --nope/);
    expect(() => parseArgs(["--url", "not a url"], env)).toThrow(/Invalid MCP URL/);
    expect(() => parseArgs(["--url", "ftp://x.test/mcp"], env)).toThrow(/http or https/);
  });
});
