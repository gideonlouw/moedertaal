import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export {
  MoedertaalError,
  detectLanguage,
  formatSource,
  runWithPacks,
} from "./runtime.js";

import { runWithPacks } from "./runtime.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const languageDirectory = path.join(projectRoot, "languages");

export function loadLanguagePacks() {
  const packs = new Map();

  for (const fileName of fs.readdirSync(languageDirectory)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const pack = JSON.parse(
      fs.readFileSync(path.join(languageDirectory, fileName), "utf8"),
    );
    packs.set(pack.code, pack);
  }

  return packs;
}

export function run(source, options = {}) {
  return runWithPacks(source, {
    ...options,
    packs: options.packs ?? loadLanguagePacks(),
  });
}
