#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import {
  checkFile,
  loadLanguagePacks,
  MoedertaalError,
  run,
  runFile,
} from "./interpreter.js";

function printHelp() {
  console.log(`Moedertaal

Usage:
  moed run <file.mt> [--language <code>] [--sandbox <folder>]
  moed check <file.mt> [--language <code>]
  moed repl [--language <code>]
  moed languages

Examples:
  moed run examples/calculator.mt
  moed check examples/bank-account.mt
  moed repl`);
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  if (!args[index + 1]) throw new MoedertaalError(`${name} needs a value.`);
  return args[index + 1];
}

function inputReader() {
  const buffered = process.stdin.isTTY
    ? null
    : fs.readFileSync(0, "utf8").split(/\r?\n/u);
  let index = 0;
  return (prompt) => {
    if (prompt) process.stdout.write(prompt);
    if (buffered) {
      const value = buffered[index] ?? "";
      index += 1;
      return value;
    }
    const bytes = [];
    const buffer = Buffer.alloc(1);
    while (fs.readSync(0, buffer, 0, 1) === 1) {
      if (buffer[0] === 10) break;
      if (buffer[0] !== 13) bytes.push(buffer[0]);
    }
    return Buffer.from(bytes).toString("utf8");
  };
}

function requireFile(args) {
  const fileName = args[1];
  if (!fileName) throw new MoedertaalError(`${args[0]} needs a .mt file.`);
  const filePath = path.resolve(fileName);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new MoedertaalError(`File not found: ${fileName}`);
  }
  return filePath;
}

async function repl(language) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("Moedertaal REPL. Type :exit to leave.");
  let program = "";
  let previousOutputCount = 0;
  try {
    while (true) {
      const source = await terminal.question("mt> ");
      if (source.trim() === ":exit") return;
      if (!source.trim()) continue;
      try {
        const candidate = `${program}${program ? "\n" : ""}${source}`;
        const result = run(candidate, {
          language,
          filename: "<repl>",
          input: (prompt) => {
            throw new MoedertaalError(
              `input() is not supported inside a single REPL command${prompt ? `: ${prompt}` : "."}`,
            );
          },
        });
        for (const line of result.output.slice(previousOutputCount)) console.log(line);
        program = candidate;
        previousOutputCount = result.output.length;
      } catch (error) {
        if (error instanceof MoedertaalError) console.error(error.message);
        else throw error;
      }
    }
  } finally {
    terminal.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const command = args[0];
  const language = option(args, "--language");
  if (command === "languages") {
    for (const pack of loadLanguagePacks().values()) {
      console.log(`${pack.code}\t${pack.name}`);
    }
    return;
  }
  if (command === "repl") {
    await repl(language ?? "en");
    return;
  }

  const filePath = requireFile(args);
  if (command === "check") {
    checkFile(filePath, { language });
    console.log(`OK ${filePath}`);
    return;
  }
  if (command === "run") {
    const sandbox = option(args, "--sandbox");
    runFile(filePath, {
      language,
      sandboxDirectory: sandbox ? path.resolve(sandbox) : undefined,
      input: inputReader(),
      onOutput: (line) => console.log(line),
    });
    return;
  }

  throw new MoedertaalError(`Unknown command '${command}'. Try 'moed --help'.`);
}

try {
  await main();
} catch (error) {
  if (error instanceof MoedertaalError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
