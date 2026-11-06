import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { analyzeBranches, deleteBranch } from '../src/scrubber.js';
import { PROTECTED_BRANCHES } from '../src/git.js';

describe('git-scrub-branch', () => {
  it('protects standard trunk branches from deletion', () => {
    assert.ok(PROTECTED_BRANCHES.has('main'));
    assert.ok(PROTECTED_BRANCHES.has('master'));
    assert.ok(PROTECTED_BRANCHES.has('develop'));
    assert.ok(PROTECTED_BRANCHES.has('production'));
  });

  it('detects merged branches and generates valid restore script', () => {
    const testDir = mkdtempSync(join(tmpdir(), 'git-scrub-test-'));

    try {
      execSync('git init -b main', { cwd: testDir, stdio: 'ignore' });
      execSync('git config user.name "Test Runner"', { cwd: testDir });
      execSync('git config user.email "test@example.com"', { cwd: testDir });

      // Initial commit on main
      writeFileSync(join(testDir, 'init.txt'), 'initial');
      execSync('git add . && git commit -m "initial commit"', { cwd: testDir, stdio: 'ignore' });

      // Create a feature branch and merge it into main
      execSync('git checkout -b feature-alpha', { cwd: testDir, stdio: 'ignore' });
      writeFileSync(join(testDir, 'alpha.txt'), 'alpha');
      execSync('git add . && git commit -m "add alpha"', { cwd: testDir, stdio: 'ignore' });

      // Switch back to main and merge
      execSync('git checkout main', { cwd: testDir, stdio: 'ignore' });
      execSync('git merge feature-alpha', { cwd: testDir, stdio: 'ignore' });

      const analysis = analyzeBranches(testDir, 'main');
      assert.equal(analysis.currentBranch, 'main');
      assert.equal(analysis.staleBranches.length, 1);
      assert.equal(analysis.staleBranches[0].name, 'feature-alpha');
      assert.ok(analysis.restoreScript.includes('git branch feature-alpha'));

      // Test delete branch
      const res = deleteBranch('feature-alpha', false, testDir);
      assert.equal(res.success, true);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

