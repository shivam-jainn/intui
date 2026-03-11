#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const slug = process.argv[2];

if (!slug) {
  console.error('Please provide a question slug');
  console.log('Usage: node scripts/scaffold-question.cjs <question-slug>');
  process.exit(1);
}

const baseDir = path.join(process.cwd(), 'data', 'questions', slug);

const directories = [
  '',
  'drivers',
  'drivers/cpp',
  'drivers/python',
];

const files = {
  'metadata.json': JSON.stringify({
    title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    slug: slug,
    difficulty: "Medium",
    tags: [],
    hints: [],
    socratic_push: []
  }, null, 2),
  'Question.md': `# ${slug}\n\n## Description\n\n## Input\n\n## Output\n\n## Constraints\n`,
  'testcase_generator.py': '# Generate test cases here\n',
  'testcases.txt': '',
  'testcases_submission.txt': '',
  'drivers/cpp/driver.cpp': '// C++ driver code\n',
  'drivers/python/driver.py': '# Python driver code\n',
};

console.log(`Scaffolding question: ${slug} in ${baseDir}`);

directories.forEach(dir => {
  const fullDir = path.join(baseDir, dir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
    console.log(`Created directory: ${fullDir}`);
  }
});

Object.entries(files).forEach(([file, content]) => {
  const filePath = path.join(baseDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created file: ${filePath}`);
  } else {
    console.log(`File already exists: ${filePath}`);
  }
});

console.log('Scaffolding complete!');
