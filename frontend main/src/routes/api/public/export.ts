import { createFileRoute } from "@tanstack/react-router";
import JSZip from "jszip";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const EXCLUDED_NAMES = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist",
  "build",
  ".tanstack",
  ".workspace",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".DS_Store",
  "Thumbs.db",
]);

const EXCLUDED_PATTERNS = [
  /^\./, // hidden files/directories
  /tsconfig\.tsbuildinfo$/,
  /\.lock$/,
  /\.log$/,
];

function shouldExclude(filePath: string, name: string): boolean {
  if (EXCLUDED_NAMES.has(name)) return true;
  const lower = name.toLowerCase();
  if (lower.startsWith(".env")) return true;
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath));
}

async function addDirectory(zip: JSZip, dirPath: string, zipPath: string): Promise<void> {
  const entries = await readdir(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const relativeZipPath = zipPath ? `${zipPath}/${entry}` : entry;

    if (shouldExclude(relativeZipPath, entry)) continue;

    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      await addDirectory(zip, fullPath, relativeZipPath);
    } else if (stats.isFile()) {
      const content = await readFile(fullPath);
      zip.file(relativeZipPath, content);
    }
  }
}

export const Route = createFileRoute("/api/public/export")({
  server: {
    handlers: {
      GET: async () => {
        const zip = new JSZip();
        const projectRoot = process.cwd();

        await addDirectory(zip, projectRoot, "");

        const buffer = await zip.generateAsync({ type: "nodebuffer" });
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `rai-codebase-${timestamp}.zip`;
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": bytes.length.toString(),
          },
        });
      },
    },
  },
});
