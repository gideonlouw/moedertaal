#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  detectLanguage,
  formatSource,
  loadLanguagePacks,
  MoedertaalError,
  run,
} from "./interpreter.js";

function printHelp() {
  console.log(`Moedertaal 0.2.0

Usage:
  moedertaal <file>
  moedertaal <file> --language <code>
  moedertaal <file> --format
  moedertaal --languages

Examples:
  moedertaal examples/afrikaans.mt
  moedertaal examples/chinese.mt --language zh`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const packs = loadLanguagePacks();
  if (args.includes("--languages")) {
    for (const pack of packs.values()) {
      console.log(`${pack.code}\t${pack.name}`);
    }
    return;
  }

  const fileName = args[0];
  const languageIndex = args.indexOf("--language");
  const language =
    languageIndex === -1 ? undefined : args[languageIndex + 1];

  if (languageIndex !== -1 && !language) {
    throw new MoedertaalError("--language needs a language code.");
  }

  const filePath = path.resolve(fileName);
  if (!fs.existsSync(filePath)) {
    throw new MoedertaalError(`File not found: ${fileName}`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  if (args.includes("--format")) {
    const selectedLanguage = language ?? detectLanguage(source, packs);
    fs.writeFileSync(filePath, formatSource(source, packs.get(selectedLanguage)), "utf8");
    console.log(`Formatted ${fileName}`);
    return;
  }
  const result = run(source, { language, packs });
  for (const line of result.output) {
    console.log(line);
  }
}

try {
  main();
} catch (error) {
  if (error instanceof MoedertaalError) {
    console.error(`Moedertaal error: ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
