#!/usr/bin/env node
import { main } from "./cli.js";

main(process.argv.slice(2), process.env, {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
}).then((code) => {
  if (code !== 0) process.exit(code);
});
