import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  async onSuccess() {
    const fs = await import("fs/promises");
    let content = await fs.readFile("dist/index.js", "utf-8");
    content = content.replace(
      /@modelcontextprotocol\/sdk\/server\/(\w+)(?<!\.js)(['"])/g,
      "@modelcontextprotocol/sdk/server/$1.js$2"
    );
    await fs.writeFile("dist/index.js", content);
  },
});
