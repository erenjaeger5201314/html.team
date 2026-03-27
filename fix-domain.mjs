import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const OLD = 'https://www.htmlcode.fun';
const NEW = 'https://html-team-three.vercel.app';

const files = [
  'src/app/api-docs/page.tsx',
  'src/app/api/deploy/content/route.ts',
  'scripts/sync-llms.mjs',
  'scripts/smoke-prod.mjs',
];

for (const file of files) {
  // Get clean content from the commit before our bad one
  const original = execSync(`git show f1d4bce:"${file}"`, { encoding: 'utf8' });
  const replaced = original
    .replaceAll(OLD, NEW)
    .replaceAll('htmlcode.fun Agent', 'html-team-three.vercel.app Agent');
  writeFileSync(file, replaced, { encoding: 'utf8' });
  console.log(`✓ Fixed: ${file}`);
}
