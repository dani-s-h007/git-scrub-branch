/**
 * git-scrub-branch: CLI Interface
 */

import { parseArgs } from 'node:util';
import { analyzeBranches, deleteBranch } from './scrubber.js';

export async function runCli(argv = process.argv.slice(2)) {
  const options = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    apply: { type: 'boolean', short: 'a', default: false },
    force: { type: 'boolean', short: 'f', default: false },
    target: { type: 'string', short: 't' },
    json: { type: 'boolean', default: false }
  };

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { values } = parsed;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log('git-scrub-branch v1.0.0');
    return 0;
  }

  const cwd = process.cwd();
  let analysis;
  try {
    analysis = analyzeBranches(cwd, values.target);
  } catch (err) {
    console.error(`Error inspecting repository: ${err.message}`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify(analysis, null, 2));
    return 0;
  }

  console.log('\ngit-scrub-branch - Stale & Squash-Merged Branch Cleaner');
  console.log('========================================================================');
  console.log(`Current Branch: ${analysis.currentBranch}`);
  console.log(`Target Trunk:   ${analysis.targetBranch}`);
  console.log(`Found ${analysis.staleBranches.length} stale / merged branches.\n`);

  if (analysis.staleBranches.length === 0) {
    console.log(' Repository is completely clean! No stale branches found.');
    console.log('========================================================================\n');
    return 0;
  }

  for (const b of analysis.staleBranches) {
    console.log(`  • ${b.name} (${b.sha})`);
    console.log(`    └─ ${b.reason}`);
  }

  if (!values.apply) {
    console.log('\n[DRY-RUN] Mode (No branches were deleted)');
    console.log('-> To delete these branches, run:');
    console.log('   $ git-scrub-branch --apply');
    console.log('========================================================================\n');
    return 0;
  }

  console.log('\nApplying deletion...');
  console.log('--- SAFETY RESTORE SCRIPT (Save this if you ever need to restore) ---');
  console.log(analysis.restoreScript);
  console.log('---------------------------------------------------------------------\n');

  let deletedCount = 0;
  for (const b of analysis.staleBranches) {
    const res = deleteBranch(b.name, values.force || !b.canStandardDelete, cwd);
    if (res.success) {
      console.log(`[OK] Deleted: ${b.name}`);
      deletedCount++;
    } else {
      console.log(`[FAIL] Failed to delete ${b.name}: ${res.error}`);
    }
  }

  console.log(`\n[SUCCESS] Successfully deleted ${deletedCount} branches.`);
  console.log('========================================================================\n');
  return 0;
}

function printHelp() {
  console.log(`
git-scrub-branch - Intelligent Git Hygiene & Squash-Merge Branch Purger

USAGE:
  $ git-scrub-branch [flags]

FLAGS:
  -a, --apply           Execute the branch deletions (default is safe dry-run)
  -f, --force           Use force deletion (-D) when needed
  -t, --target <branch> Target comparison branch (e.g. main, master)
      --json            Output results as JSON
  -v, --version         Show version
  -h, --help            Show help

EXAMPLES:
  # Preview which branches are merged or squash-merged:
  $ git-scrub-branch

  # Safely delete all stale branches:
  $ git-scrub-branch --apply
`);
}

