"use strict";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const ROOT = path.join(__dirname, "..");
const TRACKER_PATH = path.join(ROOT, "question-pipeline", "tracker.json");
const OUTPUT_DIR = path.join(ROOT, "question-pipeline", "output");

const args = process.argv.slice(2);
const slugFlagIdx = args.indexOf("--slug");
const slugFilter = slugFlagIdx !== -1 ? args[slugFlagIdx + 1] : null;

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) {
    throw new Error(`tracker.json not found at ${TRACKER_PATH}.`);
  }
  const data = JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
  return data.entries ?? [];
}

function readDescription(slug) {
  const mdPath = path.join(OUTPUT_DIR, slug, "Question.md");
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Question.md not found for slug \"${slug}\" at ${mdPath}`);
  }
  return fs.readFileSync(mdPath, "utf8").trim();
}

function buildSeedEntries(entries) {
  const filtered = slugFilter ? entries.filter((e) => e.slug === slugFilter) : entries;

  if (filtered.length === 0) {
    throw new Error(slugFilter ? `Slug \"${slugFilter}\" not found in tracker.json` : "No entries in tracker.json");
  }

  return filtered.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    difficulty: entry.difficulty,
    description: readDescription(entry.slug),
    topics: Array.isArray(entry.topics) ? entry.topics : [entry.topic].filter(Boolean),
    companies: Array.isArray(entry.companies) ? entry.companies : [],
  }));
}

function validateSeedEntries(entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry.slug || typeof entry.slug !== "string") {
      throw new Error("Invalid seed entry: missing slug");
    }
    if (!entry.title || typeof entry.title !== "string") {
      throw new Error(`Invalid seed entry for ${entry.slug}: missing title`);
    }
    if (seen.has(entry.slug)) {
      throw new Error(`Duplicate slug in local pipeline seed payload: ${entry.slug}`);
    }
    seen.add(entry.slug);
  }
}

async function seedQuestion(prisma, entry) {
  const question = await prisma.question.upsert({
    where: { slug: entry.slug },
    update: {
      title: entry.title,
      difficulty: entry.difficulty,
      description: entry.description,
    },
    create: {
      slug: entry.slug,
      title: entry.title,
      difficulty: entry.difficulty,
      description: entry.description,
    },
  });

  await prisma.questionTopic.deleteMany({ where: { questionId: question.id } });
  await prisma.questionCompany.deleteMany({ where: { questionId: question.id } });

  for (const topicName of [...new Set(entry.topics)]) {
    const topic = await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName },
    });
    await prisma.questionTopic.upsert({
      where: { questionId_topicId: { questionId: question.id, topicId: topic.id } },
      update: {},
      create: { questionId: question.id, topicId: topic.id },
    });
  }

  for (const companyName of [...new Set(entry.companies)]) {
    if (!companyName) continue;
    const company = await prisma.company.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });
    await prisma.questionCompany.upsert({
      where: { questionId_companyId: { questionId: question.id, companyId: company.id } },
      update: {},
      create: { questionId: question.id, companyId: company.id },
    });
  }

  return question.id;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const trackerEntries = loadTracker();
    const seedEntries = buildSeedEntries(trackerEntries);
    validateSeedEntries(seedEntries);

    console.log(`\nSeeding ${seedEntries.length} question(s) into local DB...\n`);
    for (const entry of seedEntries) {
      const id = await seedQuestion(prisma, entry);
      console.log(`  seeded: [${entry.difficulty}] ${entry.slug} (id=${id})`);
    }
    console.log(`\nDone - ${seedEntries.length} question(s) upserted.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
