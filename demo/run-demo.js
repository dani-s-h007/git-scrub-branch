#!/usr/bin/env node
/**
 * git-scrub-branch: Interactive Live Demo
 */

import { PROTECTED_BRANCHES } from '../src/git.js';

console.log('\n=== [DEMO] Starting git-scrub-branch ===\n');

console.log('Protected Trunk Branches (Guaranteed Safe from Accidental Deletion):');
console.log('------------------------------------------------------------');
Array.from(PROTECTED_BRANCHES).forEach((b) => console.log(` - ${b}`));
console.log('------------------------------------------------------------\n');

console.log('Simulating Branch Clean Analysis:');
const simulatedStaleBranches = [
  { name: 'feature/payment-v2', sha: 'a1b2c3d', reason: 'Squash-Merged on main (Commit patch verified)' },
  { name: 'fix/login-modal', sha: 'e4f5a6b', reason: 'Standard Merged into main' },
  { name: 'chore/update-readme', sha: '9988776', reason: 'Upstream remote tracking branch was deleted [gone]' }
];

simulatedStaleBranches.forEach((b) => {
  console.log(` • Branch "${b.name}" (${b.sha})`);
  console.log(`   └─ Status: ${b.reason}`);
});

console.log('\nAutomatic Safety Restore Script Generated:');
console.log('------------------------------------------------------------');
simulatedStaleBranches.forEach((b) => console.log(`git branch ${b.name} ${b.sha}`));
console.log('------------------------------------------------------------');
console.log('[SUCCESS] Demo completed successfully.\n');

