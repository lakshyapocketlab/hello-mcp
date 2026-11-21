import { describe, expect, it } from "vitest";
import { createProxy } from "../src/proxy.js";
import { VERSION } from "../src/version.js";
import { downstream, fakeRemote } from "./helpers.js";

describe("createProxy", () => {
  it("forwards tools/list and tools/call to the remote", async () => {
    const { client } = await fakeRemote({ instructions: "Use Hello." });
    const desktop = await downstream(createProxy(client));

    expect(desktop.getServerVersion()).toMatchObject({ name: "hello-remote", version: "9.9.9" });
    expect(desktop.getInstructions()).toBe("Use Hello.");
    expect(desktop.getServerCapabilities()).toEqual({ tools: {} });

    const list = await desktop.listTools();
    expect(list.tools.map((t) => t.name)).toEqual(["ping"]);

    const res = await desktop.callTool({ name: "ping", arguments: { a: 1 } });
    expect(res.content).toEqual([{ type: "text", text: '{"a":1}' }]);
  });

  it("propagates remote errors", async () => {
    const { client } = await fakeRemote();
    const desktop = await downstream(createProxy(client));
    await expect(desktop.callTool({ name: "boom" })).rejects.toThrow(/bad arguments/);
  });

  it("forwards prompts and resources when advertised", async () => {
    const { client } = await fakeRemote({ prompts: true, resources: true });
    const desktop = await downstream(createProxy(client));
    expect(desktop.getServerCapabilities()).toEqual({ tools: {}, prompts: {}, resources: {} });

    expect((await desktop.listPrompts()).prompts[0]?.name).toBe("welcome");
    const prompt = await desktop.getPrompt({ name: "welcome" });
    expect(prompt.messages[0]?.content).toEqual({ type: "text", text: "prompt:welcome" });
    expect((await desktop.listResources()).resources[0]?.uri).toBe("hello://guide");
    expect((await desktop.listResourceTemplates()).resourceTemplates[0]?.name).toBe("msg");
    expect((await desktop.readResource({ uri: "hello://guide" })).contents[0]).toMatchObject({
      text: "guide text",
    });
  });

  it("does not advertise what the remote lacks", async () => {
    const { client } = await fakeRemote({ tools: false });
    const desktop = await downstream(createProxy(client));
    expect(desktop.getServerCapabilities()).toEqual({});
    expect(desktop.getInstructions()).toBeUndefined();
  });
});

describe("createProxy identity fallback", () => {
  it("uses its own name and version if the remote reports none", async () => {
    const fake = {
      getServerCapabilities: () => undefined,
      getServerVersion: () => undefined,
      getInstructions: () => undefined,
    };
    const desktop = await downstream(createProxy(fake as never));
    expect(desktop.getServerVersion()).toEqual({ name: "hello", version: VERSION });
  });
});
