"use strict";

try {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
} catch (_) {}

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TRACKER_PATH = path.join(ROOT, "question-pipeline", "tracker.json");
const OUTPUT_DIR = path.join(ROOT, "question-pipeline", "output");
const SEED_DATA_PATH = path.join(ROOT, "prisma", "seed-data.json");

const EXT = { typescript: "ts", python: "py", java: "java", cpp: "cpp" };

const args = process.argv.slice(2);
const slugFlagIdx = args.indexOf("--slug");
const slugFilter = slugFlagIdx !== -1 ? args[slugFlagIdx + 1] : null;
const doUpload = !args.includes("--no-upload");
const doMerge = !args.includes("--no-merge");
const doSeedDb = args.includes("--seed-db");
const dryRun = args.includes("--dry-run");

function buildGcsClient() {
  const { Storage } = require("@google-cloud/storage");
  const credentials = {
    type: process.env.GCP_TYPE,
    project_id: process.env.GCP_PROJECT_ID,
    private_key_id: process.env.GCP_PRIVATE_KEY_ID,
    private_key: (process.env.GCP_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    client_email: process.env.GCP_CLIENT_EMAIL,
    client_id: process.env.GCP_CLIENT_ID,
    auth_uri: process.env.GCP_AUTH_URI,
    token_uri: process.env.GCP_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GCP_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GCP_UNIVERSE_DOMAIN,
  };

  const gcs = new Storage({ credentials });
  const bucketName = process.env.GCP_BUCKET_NAME;
  if (!bucketName) throw new Error("GCP_BUCKET_NAME env var is not set.");
  return { gcs, bucketName };
}

async function uploadFile(bucket, gcsPath, content) {
  if (dryRun) return `dry-run://gs://${bucket.name}/${gcsPath}`;
  const file = bucket.file(gcsPath);
  await file.save(Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8"));
  return `gs://${bucket.name}/${gcsPath}`;
}

async function uploadQuestion(bucket, slug) {
  const dir = path.join(OUTPUT_DIR, slug);
  const uploaded = [];

  const mdPath = path.join(dir, "Question.md");
  if (fs.existsSync(mdPath)) {
    uploaded.push(await uploadFile(bucket, `questions/${slug}/Question.md`, fs.readFileSync(mdPath)));
  }

  const driversDir = path.join(dir, "drivers");
  if (fs.existsSync(driversDir)) {
    for (const lang of fs.readdirSync(driversDir)) {
      const ext = EXT[lang] ?? lang;
      const sigPath = path.join(driversDir, lang, `signature.${ext}`);
      if (fs.existsSync(sigPath)) {
        uploaded.push(await uploadFile(bucket, `questions/${slug}/drivers/${lang}/signature.${ext}`, fs.readFileSync(sigPath)));
      }
    }
  }

  const runJsonPath = path.join(dir, "tests", "run.json");
  const submissionJsonPath = path.join(dir, "tests", "submission.json");
  const runTxtPath = path.join(dir, "testcases.txt");
  const submissionTxtPath = path.join(dir, "testcases_submission.txt");

  if (fs.existsSync(runJsonPath)) {
    uploaded.push(await uploadFile(bucket, `questions/${slug}/tests/run.json`, fs.readFileSync(runJsonPath)));
  } else if (fs.existsSync(runTxtPath)) {
    const lines = fs.readFileSync(runTxtPath, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
    uploaded.push(await uploadFile(bucket, `questions/${slug}/tests/run.json`, JSON.stringify(lines, null, 2)));
  }

  if (fs.existsSync(submissionJsonPath)) {
    uploaded.push(await uploadFile(bucket, `questions/${slug}/tests/submission.json`, fs.readFileSync(submissionJsonPath)));
  } else if (fs.existsSync(submissionTxtPath)) {
    const lines = fs.readFileSync(submissionTxtPath, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
    uploaded.push(await uploadFile(bucket, `questions/${slug}/tests/submission.json`, JSON.stringify(lines, null, 2)));
  }

  return uploaded;
}

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) throw new Error(`tracker.json not found at ${TRACKER_PATH}.`);
  const data = JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
  return data.entries ?? [];
}

function buildSeedEntry(entry) {
  const mdPath = path.join(OUTPUT_DIR, entry.slug, "Question.md");
  if (!fs.existsSync(mdPath)) throw new Error(`Question.md missing for \"${entry.slug}\"`);
  return {
    slug: entry.slug,
    title: entry.title,
    difficulty: entry.difficulty,
    description: fs.readFileSync(mdPath, "utf8").trim(),
    topics: Array.isArray(entry.topics) ? entry.topics : [entry.topic].filter(Boolean),
    companies: Array.isArray(entry.companies) ? entry.companies : [],
  };
}

function validateSeedEntries(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry.slug || !entry.title) throw new Error("Invalid seed entry: slug/title required");
    if (seen.has(entry.slug)) throw new Error(`Duplicate slug in deploy payload: ${entry.slug}`);
    seen.add(entry.slug);
  }
}

function mergeSeedData(newEntries) {
  let existing = { exportedAt: new Date().toISOString(), questions: [] };
  if (fs.existsSync(SEED_DATA_PATH)) {
    existing = JSON.parse(fs.readFileSync(SEED_DATA_PATH, "utf8"));
    if (!Array.isArray(existing.questions)) existing.questions = [];
  }

  let added = 0;
  let updated = 0;
  for (const entry of newEntries) {
    const idx = existing.questions.findIndex((q) => q.slug === entry.slug);
    if (idx === -1) {
      existing.questions.push(entry);
      added++;
    } else {
      existing.questions[idx] = entry;
      updated++;
    }
  }

  existing.exportedAt = new Date().toISOString();
  fs.writeFileSync(SEED_DATA_PATH, JSON.stringify(existing, null, 2) + "\n", "utf8");
  return { added, updated, total: existing.questions.length };
}

async function seedDb(seedEntries) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    for (const entry of seedEntries) {
      await prisma.question.upsert({
        where: { slug: entry.slug },
        update: { title: entry.title, difficulty: entry.difficulty, description: entry.description },
        create: { slug: entry.slug, title: entry.title, difficulty: entry.difficulty, description: entry.description },
      });
      console.log(`  seeded DB: ${entry.slug}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const trackerEntries = loadTracker();
  const entries = slugFilter ? trackerEntries.filter((e) => e.slug === slugFilter) : trackerEntries;
  if (entries.length === 0) throw new Error(slugFilter ? `Slug \"${slugFilter}\" not found` : "No entries in tracker.json");

  if (doUpload) {
    const { gcs, bucketName } = buildGcsClient();
    const bucket = gcs.bucket(bucketName);
    for (const entry of entries) {
      console.log(`Uploading ${entry.slug}...`);
      const urls = await uploadQuestion(bucket, entry.slug);
      urls.forEach((u) => console.log(`  ${u}`));
    }
  }

  const seedEntries = entries.map(buildSeedEntry);
  validateSeedEntries(seedEntries);

  if (doMerge) {
    if (dryRun) {
      console.log(`dry-run: would merge ${seedEntries.length} entries into prisma/seed-data.json`);
    } else {
      const info = mergeSeedData(seedEntries);
      console.log(`seed-data merged: +${info.added}, ~${info.updated}, total ${info.total}`);
    }
  }

  if (doSeedDb) {
    await seedDb(seedEntries);
  }
}

main().catch((err) => {
  console.error("Deploy failed:", err.message);
  process.exit(1);
});
