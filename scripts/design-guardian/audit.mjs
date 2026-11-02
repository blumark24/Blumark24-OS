/**
 * BLUMARK DESIGN GUARDIAN V1 — read-only source scope monitor.
 * Does not edit code, render customer data or approve design/deployment.
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const exactProtected = new Set([
  'src/styles/design-tokens.css', 'src/app/globals.css',
  'tailwind.config.ts', 'src/app/layout.tsx'
]);
const protectedRoots = [
  'public/brand/', 'src/components/brand/', 'src/components/ds/',
  'src/components/layout/'
];
const watchedRoots = [
  'src/app/dashboard/', 'src/app/tasks/', 'src/components/dashboard/',
  'src/components/tasks/', 'src/app/design-preview/',
  'src/components/design-preview/', 'src/components/ui/',
  'src/app/', 'src/components/', 'public/'
];
const visualExtension = /\.(?:css|scss|tsx|jsx|html|svg|png|jpe?g|webp|gif|avif|woff2?)$/i;

export function classifyFile(name) {
  if (typeof name !== 'string' || !name || name.startsWith('/') ||
      name.includes('\\') || name.split('/').includes('..')) return 'INVALID_PATH';
  if (exactProtected.has(name) || protectedRoots.some(root => name.startsWith(root)))
    return 'IDENTITY_OR_DESIGN_SYSTEM';
  if (name.startsWith('src/app/api/') || name.startsWith('src/app/auth/') ||
      name.startsWith('src/app/admin-recovery/')) return 'OUT_OF_SCOPE';
  if (watchedRoots.some(root => name.startsWith(root)) && visualExtension.test(name))
    return 'VISUAL_SURFACE';
  return 'OUT_OF_SCOPE';
}

export function assessChangedFiles(files, { baseSha = null, headSha = null } = {}) {
  if (!Array.isArray(files)) throw new TypeError('FILES_ARRAY_REQUIRED');
  const inspected = [...new Set(files)].sort().map(path => ({ path, scope: classifyFile(path) }));
  const protectedChanges = inspected.filter(x => x.scope === 'IDENTITY_OR_DESIGN_SYSTEM');
  const visualChanges = inspected.filter(x => x.scope === 'VISUAL_SURFACE');
  const invalidPaths = inspected.filter(x => x.scope === 'INVALID_PATH');
  const reviewRequired = Boolean(protectedChanges.length || visualChanges.length || invalidPaths.length);
  return Object.freeze({
    tool: 'BLUMARK_DESIGN_GUARDIAN_V1', mode: 'READ_ONLY_STATIC_SCOPE',
    baseSha, headSha, filesInspected: inspected.length,
    protectedChanges, visualChanges, invalidPaths, reviewRequired,
    visualComparisonStatus: 'NOT_PERFORMED', screenshotsApproved: false,
    designChangedByTool: false, productionDeploymentAuthorized: false,
    mergeAuthorized: false,
    conclusion: reviewRequired ? 'MANUAL_DESIGN_REVIEW_REQUIRED'
      : 'NO_VISUAL_SOURCE_DIFF_DETECTED_NOT_VISUAL_APPROVAL'
  });
}

function validateRef(value) {
  if (value === 'HEAD' || /^[a-f0-9]{40}$/i.test(value)) return value;
  throw new Error('EXPLICIT_IMMUTABLE_SHA_OR_HEAD_REQUIRED');
}

export function diffPaths(baseSha, headSha = 'HEAD', exec = execFileSync) {
  const base = validateRef(baseSha);
  const head = validateRef(headSha);
  const raw = exec('git', [
    'diff', '--name-only', '--diff-filter=ACMRTUXB', '-z', base, head, '--'
  ], { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  return raw.split('\0').filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const argv = process.argv.slice(2);
    if (argv.length !== 2 || argv[0] !== '--base') throw new Error('USAGE');
    const base = validateRef(argv[1]);
    if (base === 'HEAD') throw new Error('BASE_MUST_BE_IMMUTABLE_SHA');
    const head = execFileSync('git', ['rev-parse', 'HEAD'],
      { encoding: 'utf8', timeout: 10000 }).trim();
    process.stdout.write(JSON.stringify(assessChangedFiles(
      diffPaths(base), { baseSha: base, headSha: head }
    ), null, 2) + '\n');
  } catch (_) {
    process.stdout.write(JSON.stringify({
      tool: 'BLUMARK_DESIGN_GUARDIAN_V1', conclusion: 'AUDIT_UNAVAILABLE',
      mergeAuthorized: false, productionDeploymentAuthorized: false,
      visualComparisonStatus: 'NOT_PERFORMED'
    }) + '\n');
    process.exitCode = 2;
  }
}
