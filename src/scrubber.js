/**
 * git-scrub-branch: Core Analysis & Deletion Logic
 */

import { execSync } from 'node:child_process';
import {
  detectDefaultBranch,
  getCurrentBranch,
  listLocalBranches,
  isMergedStandard,
  isSquashMerged,
  PROTECTED_BRANCHES
} from './git.js';

export function analyzeBranches(cwd = process.cwd(), targetBranch) {
  const current = getCurrentBranch(cwd);
  const target = targetBranch || detectDefaultBranch(cwd);
  const allBranches = listLocalBranches(cwd);

  const staleBranches = [];
  const activeBranches = [];

  for (const branch of allBranches) {
    // Never touch current branch or protected branches
    if (branch.name === current || PROTECTED_BRANCHES.has(branch.name)) {
      continue;
    }

    if (isMergedStandard(branch.name, target, cwd)) {
      staleBranches.push({
        ...branch,
        reason: 'Standard Merged',
        canStandardDelete: true
      });
    } else if (isSquashMerged(branch.name, target, cwd)) {
      staleBranches.push({
        ...branch,
        reason: 'Squash-Merged (Patch equivalent on ' + target + ')',
        canStandardDelete: false
      });
    } else if (branch.upstreamGone) {
      staleBranches.push({
        ...branch,
        reason: 'Remote tracking branch was deleted [gone]',
        canStandardDelete: false
      });
    } else {
      activeBranches.push(branch);
    }
  }

  // Generate undo restoration commands
  const restoreScript = staleBranches
    .map((b) => `git branch ${b.name} ${b.sha}`)
    .join('\n');

  return {
    currentBranch: current,
    targetBranch: target,
    staleBranches,
    activeBranches,
    restoreScript
  };
}

export function deleteBranch(branchName, force = false, cwd = process.cwd()) {
  const flag = force ? '-D' : '-d';
  try {
    execSync(`git branch ${flag} ${branchName}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.stderr?.trim() || err.message };
  }
}

