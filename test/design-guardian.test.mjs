import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyFile, assessChangedFiles, diffPaths } from '../scripts/design-guardian/audit.mjs';

test('approved brand and shell files need manual review', () => {
  for (const file of [
    'public/brand/blumark24-logo.svg', 'src/styles/design-tokens.css',
    'src/components/layout/Sidebar.tsx', 'src/components/ds/DsCard.tsx',
    'src/app/globals.css', 'src/app/layout.tsx'
  ]) assert.equal(classifyFile(file), 'IDENTITY_OR_DESIGN_SYSTEM');
});

test('dashboard and tasks edits are flagged but not applied', () => {
  const report = assessChangedFiles([
    'src/app/dashboard/page.tsx', 'src/components/tasks/TaskBoard.tsx',
    'public/brand/blumark24-logo.svg', 'docs/new-notes.md',
    'src/app/dashboard/page.tsx'
  ], { baseSha: 'a'.repeat(40), headSha: 'b'.repeat(40) });
  assert.equal(report.filesInspected, 4);
  assert.equal(report.visualChanges.length, 2);
  assert.equal(report.protectedChanges.length, 1);
  assert.equal(report.reviewRequired, true);
  assert.equal(report.conclusion, 'MANUAL_DESIGN_REVIEW_REQUIRED');
  assert.equal(report.visualComparisonStatus, 'NOT_PERFORMED');
  assert.equal(report.mergeAuthorized, false);
  assert.equal(report.productionDeploymentAuthorized, false);
  assert.equal(report.designChangedByTool, false);
});

test('no visual differences does NOT constitute design approval', () => {
  const report = assessChangedFiles(['docs/README.md', 'scripts/design-guardian/audit.mjs']);
  assert.equal(report.reviewRequired, false);
  assert.equal(report.conclusion, 'NO_VISUAL_SOURCE_DIFF_DETECTED_NOT_VISUAL_APPROVAL');
  assert.equal(report.screenshotsApproved, false);
});

test('unsafe shell refs cannot be executed', () => {
  let calls = 0;
  const stub = (binary, args) => {
    calls++;
    assert.equal(binary, 'git');
    assert.deepEqual(args.slice(0, 4), ['diff', '--name-only', '--diff-filter=ACMRTUXB', '-z']);
    return 'src/app/tasks/page.tsx\0docs/README.md\0';
  };
  assert.throws(() => diffPaths('main; echo secret', 'HEAD', stub),
    /EXPLICIT_IMMUTABLE_SHA/);
  assert.throws(() => diffPaths('a'.repeat(40), 'HEAD;rm -rf .', stub),
    /EXPLICIT_IMMUTABLE_SHA/);
  assert.equal(calls, 0);
  assert.deepEqual(diffPaths('a'.repeat(40), 'HEAD', stub),
    ['src/app/tasks/page.tsx', 'docs/README.md']);
  assert.equal(calls, 1);
});

test('invalid file paths fail closed', () => {
  const report = assessChangedFiles(['../private', '/etc/passwd', 'src\\app\\dashboard\\page.tsx']);
  assert.equal(report.invalidPaths.length, 3);
  assert.equal(report.conclusion, 'MANUAL_DESIGN_REVIEW_REQUIRED');
});
