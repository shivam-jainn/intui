#!/usr/bin/env node
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Basic env loader for standalone script
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.join(__dirname, '..', envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
          process.env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        }
      });
      console.log(`Loaded env from ${envPath}`);
      return;
    }
  }
}

loadEnv();

async function run() {
  const bucketName = process.env.GCP_BUCKET_NAME;
  if (!bucketName) {
    console.error("Missing GCP_BUCKET_NAME in environment. Please check your .env or .env.local file.");
    process.exit(1);
  }

  const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  const bucket = storage.bucket(bucketName);
  const questionsDir = path.join(__dirname, '..', 'questions');

  if (!fs.existsSync(questionsDir)) {
    console.error("Questions directory not found at " + questionsDir);
    process.exit(1);
  }

  const filesToUpload = [];
  function getFiles(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getFiles(fullPath);
      } else {
        filesToUpload.push(fullPath);
      }
    });
  }

  console.log("Gathering files from questions/ folder...");
  getFiles(questionsDir);

  for (const localPath of filesToUpload) {
    const relativePath = path.relative(questionsDir, localPath);
    // Ignore hidden files like .DS_Store
    if (path.basename(localPath).startsWith('.')) continue;

    console.log(`🚀 Uploading ${relativePath}...`);
    try {
      await bucket.upload(localPath, {
        destination: relativePath,
        metadata: {
          cacheControl: 'no-cache',
        },
      });
    } catch (err) {
      console.error(`❌ Failed to upload ${relativePath}:`, err.message);
    }
  }

  console.log("✅ All questions pushed to GCS successfully!");
}

run().catch(err => {
  console.error("🚨 Critical error:", err);
  process.exit(1);
});
