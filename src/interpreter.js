import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export {
  checkWithPacks,
  MoedertaalError,
  detectLanguage,
  formatSource,
  runWithPacks,
} from "./runtime.js";

import { checkWithPacks, runWithPacks } from "./runtime.js";

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

function createModuleLoader(entryPath) {
  return (specifier, fromModule) => {
    const importer = fromModule === "<main>" ? entryPath : fromModule;
    const baseDirectory = path.dirname(importer);
    const requestedPath = specifier.startsWith(".")
      ? specifier
      : `./${specifier.endsWith(".mt") ? specifier : `${specifier}.mt`}`;
    const modulePath = path.resolve(baseDirectory, requestedPath);

    if (!fs.existsSync(modulePath) || !fs.statSync(modulePath).isFile()) {
      throw new Error(`Module not found: ${specifier}`);
    }

    return {
      id: modulePath,
      source: fs.readFileSync(modulePath, "utf8"),
    };
  };
}

export function createSandboxFiles(sandboxDirectory) {
  const root = path.resolve(sandboxDirectory);
  const sandboxRoot = (create = false) => {
    if (create) fs.mkdirSync(root, { recursive: true });
    return fs.existsSync(root) ? fs.realpathSync.native(root) : root;
  };
  const ensureInside = (base, resolvedPath) => {
    const relative = path.relative(base, resolvedPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      const error = new Error("Unsafe path");
      error.code = "UNSAFE_PATH";
      throw error;
    }
  };
  const resolveSafePath = (requestedPath, create = false) => {
    if (
      typeof requestedPath !== "string" ||
      path.isAbsolute(requestedPath) ||
      requestedPath.split(/[\\/]/u).includes("..")
    ) {
      const error = new Error("Unsafe path");
      error.code = "UNSAFE_PATH";
      throw error;
    }
    const base = sandboxRoot(create);
    const resolved = path.resolve(base, requestedPath);
    ensureInside(base, resolved);
    return { base, resolved };
  };
  const existingParent = (filePath) => {
    let current = filePath;
    while (!fs.existsSync(current)) {
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return fs.realpathSync.native(current);
  };

  return {
    readText(requestedPath) {
      const { base, resolved } = resolveSafePath(requestedPath);
      ensureInside(base, fs.realpathSync.native(resolved));
      return fs.readFileSync(resolved, "utf8");
    },
    writeText(requestedPath, text) {
      const { base, resolved } = resolveSafePath(requestedPath, true);
      ensureInside(base, existingParent(path.dirname(resolved)));
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, text, "utf8");
    },
  };
}

function fileOptions(fileName, options, includeFiles = true) {
  const entryPath = path.resolve(fileName);
  const packs = options.packs ?? loadLanguagePacks();
  const resolved = {
    ...options,
    packs,
    entryPath,
    moduleId: entryPath,
    filename: entryPath,
    moduleLoader: options.moduleLoader ?? createModuleLoader(entryPath),
  };
  if (includeFiles) {
    resolved.files = options.files ?? createSandboxFiles(
      options.sandboxDirectory ?? path.join(path.dirname(entryPath), "sandbox"),
    );
  }
  return resolved;
}

export function runFile(fileName, options = {}) {
  const resolved = fileOptions(fileName, options);
  return runWithPacks(fs.readFileSync(resolved.entryPath, "utf8"), {
    ...resolved,
  });
}

export function check(source, options = {}) {
  return checkWithPacks(source, {
    ...options,
    packs: options.packs ?? loadLanguagePacks(),
  });
}

export function checkFile(fileName, options = {}) {
  const resolved = fileOptions(fileName, options, false);
  return checkWithPacks(fs.readFileSync(resolved.entryPath, "utf8"), resolved);
}
