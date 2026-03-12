const fs = require("fs/promises");
const path = require("path");

const INCIDENTS_DIR = path.join(process.cwd(), "data", "incidents");

function languageFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".py": "python",
    ".cpp": "cpp",
    ".ts": "typescript",
    ".js": "javascript",
    ".go": "go",
    ".java": "java",
  };
  return map[ext] || "plaintext";
}

async function listFilesRecursive(dir, baseDir) {
  const results = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__pycache__" || entry.name === "node_modules") continue;
        const nested = await listFilesRecursive(fullPath, baseDir);
        results.push(...nested);
      } else {
        results.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch {
    return [];
  }

  return results;
}

async function readIncidentManifestData(incidentSlugPath) {
  const reportPath = path.join(incidentSlugPath, "IncidentReport.md");
  const languageBasePath = path.join(incidentSlugPath, "language");

  const report = await fs.readFile(reportPath, "utf8");

  const languageEntries = await fs.readdir(languageBasePath, { withFileTypes: true });
  const availableLanguages = languageEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const filesByLanguage = {};
  const entryFileByLanguage = {};

  for (const language of availableLanguages) {
    const langDir = path.join(languageBasePath, language);
    const srcDir = path.join(langDir, "src");
    const testsDir = path.join(langDir, "tests");

    const srcFiles = await listFilesRecursive(srcDir, langDir);
    const testFiles = await listFilesRecursive(testsDir, langDir);

    const files = [];

    for (const relPath of srcFiles) {
      const content = await fs.readFile(path.join(langDir, relPath), "utf8");
      files.push({
        path: relPath,
        content,
        readonly: false,
        language: languageFromPath(relPath),
      });
    }

    for (const relPath of testFiles) {
      const content = await fs.readFile(path.join(langDir, relPath), "utf8");
      files.push({
        path: relPath,
        content,
        readonly: true,
        language: languageFromPath(relPath),
      });
    }

    filesByLanguage[language] = files;
    entryFileByLanguage[language] = srcFiles[0] || files[0]?.path || "";
  }

  return {
    version: 1,
    report,
    availableLanguages,
    defaultLanguage: availableLanguages[0] || "",
    entryFileByLanguage,
    filesByLanguage,
  };
}

async function main() {
  const incidentEntries = await fs.readdir(INCIDENTS_DIR, { withFileTypes: true });
  const incidents = incidentEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  for (const slug of incidents) {
    const incidentPath = path.join(INCIDENTS_DIR, slug);
    const manifest = await readIncidentManifestData(incidentPath);

    const outputPath = path.join(incidentPath, "manifest.json");
    await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

    console.log(`Generated manifest for ${slug}`);
  }

  console.log("Incident manifest generation completed.");
}

main().catch((error) => {
  console.error("Failed to generate incident manifests:", error);
  process.exit(1);
});
