/**
 * git-scrub-branch: Git Plumbing Engine
 */

import { execSync } from 'node:child_process';

export const PROTECTED_BRANCHES = new Set([
  'main',
  'master',
  'dev',
  'develop',
  'staging',
  'production',
  'trunk'
]);

function runGit(cmd, cwd = process.cwd()) {
  try {
    return execSync(`git ${cmd}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (err) {
    throw new Error(`Git error: ${err.stderr?.trim() || err.message}`);
  }
}

/**
 * Detects the primary default branch (main or master or origin/HEAD)
 * @param {string} cwd
 * @returns {string}
 */
export function detectDefaultBranch(cwd = process.cwd()) {
  try {
    const headRef = runGit('symbolic-ref refs/remotes/origin/HEAD', cwd);
    return headRef.replace(/^refs\/remotes\/origin\//, '');
  } catch {
    // Fallback: check if main or master exist locally
    try {
      runGit('rev-parse --verify main', cwd);
      return 'main';
    } catch {
      try {
        runGit('rev-parse --verify master', cwd);
        return 'master';
      } catch {
        return 'main';
      }
    }
  }
}

/**
 * Gets currently checked out branch name
 * @param {string} cwd
 * @returns {string}
 */
export function getCurrentBranch(cwd = process.cwd()) {
  return runGit('branch --show-current', cwd);
}

/**
 * Lists all local branches with their HEAD sha and upstream status
 * @param {string} cwd
 * @returns {Array<{ name: string, sha: string, upstreamGone: boolean }>}
 */
export function listLocalBranches(cwd = process.cwd()) {
  // %(refname:short)|%(objectname:short)|%(upstream:track)
  const format = '%(refname:short)|%(objectname:short)|%(upstream:track)';
  const out = runGit(`branch --format="${format}"`, cwd);
  if (!out) return [];

  const branches = [];
  const lines = out.split('\n');

  for (const line of lines) {
    const [name, sha, track] = line.split('|');
    if (!name) continue;
    branches.push({
      name: name.trim(),
      sha: sha ? sha.trim() : '',
      upstreamGone: track ? track.includes('[gone]') : false
    });
  }

  return branches;
}

/**
 * Checks if a branch is fully merged into target branch
 * @param {string} branchName
 * @param {string} targetBranch
 * @param {string} cwd
 */
export function isMergedStandard(branchName, targetBranch, cwd = process.cwd()) {
  try {
    const mergedList = runGit(`branch --merged ${targetBranch}`, cwd)
      .split('\n')
      .map((b) => b.replace(/^\*?\s+/, '').trim());
    return mergedList.includes(branchName);
  } catch {
    return false;
  }
}

/**
 * Checks if all commits from branchName have patch equivalents on targetBranch
 * (Detects GitHub Squash-Merged branches!)
 * @param {string} branchName
 * @param {string} targetBranch
 * @param {string} cwd
 */
export function isSquashMerged(branchName, targetBranch, cwd = process.cwd()) {
  try {
    // git cherry <targetBranch> <branchName>
    // Lines starting with '-' indicate that the commit has an equivalent in targetBranch.
    // Lines starting with '+' indicate new unmerged commits.
    const cherryOutput = runGit(`cherry ${targetBranch} ${branchName}`, cwd);
    if (!cherryOutput) return true; // No commits between them
    const lines = cherryOutput.split('\n').filter(Boolean);
    // If every commit is marked with '-', the branch was squash-merged!
    return lines.length > 0 && lines.every((l) => l.startsWith('-'));
  } catch {
    return false;
  }
}

