"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const seedPath = path.join(root, "prisma", "seed-data.json");

function fail(message) {
  console.error(`Seed validation failed: ${message}`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(seedPath)) {
    fail(`Missing file: ${seedPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const questions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(questions)) {
    fail("Expected an array or object with questions[]");
  }

  const seen = new Set();

  questions.forEach((q, idx) => {
    const loc = `questions[${idx}]`;
    const slug = q.slug ?? q.name;

    if (!slug || typeof slug !== "string") {
      fail(`${loc} is missing slug/name`);
    }
    const title = q.title ?? q.name;
    if (!title || typeof title !== "string") {
      fail(`${loc} is missing title/name`);
    }
    if (!q.difficulty || typeof q.difficulty !== "string") {
      fail(`${loc} is missing difficulty`);
    }
    if (!q.description || typeof q.description !== "string") {
      fail(`${loc} is missing description`);
    }

    if (seen.has(slug)) {
      fail(`Duplicate slug found: ${slug}`);
    }
    seen.add(slug);
  });

  console.log(`Seed validation passed: ${questions.length} questions checked.`);
}

main();
