import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

const root = new URL("../", import.meta.url);

export async function loadSource(file, { mocks = {}, globals = {} } = {}) {
  const context = createContext({ URL, URLSearchParams, AbortSignal, process: { env: {} }, ...globals });
  const modules = new Map();
  const replacements = { "server-only": {}, ...mocks };
  async function load(identifier) {
    if (modules.has(identifier)) return modules.get(identifier);
    if (Object.hasOwn(replacements, identifier)) {
      const exports = replacements[identifier];
      const module = new SyntheticModule(Object.keys(exports), function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      }, { context, identifier });
      modules.set(identifier, module);
      return module;
    }
    const module = new SourceTextModule(await readFile(new URL(identifier), "utf8"), { context, identifier });
    modules.set(identifier, module);
    await module.link((specifier) => {
      if (Object.hasOwn(replacements, specifier)) return load(specifier);
      const url = specifier.startsWith("@/") ? new URL(specifier.slice(2), root) : new URL(specifier, identifier);
      if (!/\.m?js$/.test(url.pathname)) url.pathname += ".js";
      return load(url.href);
    });
    return module;
  }
  const module = await load(new URL(file, root).href);
  await module.evaluate();
  return module.namespace;
}
