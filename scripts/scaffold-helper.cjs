#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const type = process.argv[2];
const slug = process.argv[3];

if (!type || !slug || (type !== 'question' && type !== 'incident')) {
  console.error('Usage: node scripts/scaffold-helper.cjs <question|incident> <slug>');
  process.exit(1);
}

const targetBase = type === 'question' ? 'questions' : 'incidents';
const baseDir = path.join(process.cwd(), 'data', targetBase, slug);

console.log(`Scaffolding ${type}: ${slug} in ${baseDir}`);

if (type === 'question') {
  const dirs = [
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
      displayOrder: 10,
      tags: [],
      hints: [],
      socratic_push: []
    }, null, 2),
    'Question.md': `# ${slug}\n\n## Description\n\n## Input\n\n## Output\n\n## Constraints\n`,
    'testcase_generator.py': `import random

OUTPUT_FILE = "./testcases.txt"
SUBMISSION_FILE = "./testcases_submission.txt"

def solve_reference():
    pass

def generate_case():
    pass

def write_cases(filename, num_cases):
    with open(filename, "w") as f:
        pass

def main():
    random.seed(42)
    write_cases(OUTPUT_FILE, 10)
    write_cases(SUBMISSION_FILE, 50)
    print("Test cases generated.")

if __name__ == "__main__":
    main()
`,
    'testcases.txt': '',
    'testcases_submission.txt': '',
    'drivers/cpp/signature.cpp': `#include <vector>\n#include <string>\n\nusing namespace std;\n`,
    'drivers/cpp/driver.cpp': `// C++ driver code\n`,
    'drivers/python/signature.py': `def solve():\n    pass\n`,
    'drivers/python/driver.py': `# Python driver code\n`,
  };

  dirs.forEach(d => {
    const fullDir = path.join(baseDir, d);
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
  });

  Object.entries(files).forEach(([file, content]) => {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, content);
  });

} else if (type === 'incident') {
  const dirs = [
    '',
    'language',
    'language/python',
    'language/python/src',
    'language/python/tests',
  ];

  const files = {
    'metadata.json': JSON.stringify({
      slug: slug,
      title: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      severity: "P0",
      difficulty: "Medium",
      service: "Some Service Name",
      summary: "Short description of the incident and tasks.",
      slaMinutes: 30
    }, null, 2),
    'IncidentReport.md': `# CONTEXT\n\nUSER TASK\n\nBUGS TO FIX:\n\nOPTIMIZATION REQUIRED:\n\nFEATURE TO IMPLEMENT:\n\nCONSTRAINTS\n`,
    'language/python/run_tests.sh': `#!/bin/bash\nset -e\npython -m unittest discover -s tests\n`,
    'language/python/src/models.py': `# Define models and core data structures\n`,
    'language/python/src/store.py': `# Define storage layer\n`,
    'language/python/src/service.py': `class Service:\n    pass\n`,
    'language/python/tests/test_basic.py': `import unittest\n\nclass TestBasic(unittest.TestCase):\n    def test_basic(self):\n        pass\n\nif __name__ == "__main__":\n    unittest.main()\n`,
  };

  dirs.forEach(d => {
    const fullDir = path.join(baseDir, d);
    if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
  });

  Object.entries(files).forEach(([file, content]) => {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, content);
  });
}

console.log('Scaffolding completed successfully!');
