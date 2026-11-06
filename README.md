# git-scrub-branch 🌿

[![CI](https://github.com/dani-s-h007/git-scrub-branch/actions/workflows/ci.yml/badge.svg)](https://github.com/dani-s-h007/git-scrub-branch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

> **Intelligent git hygiene & squash-merge branch purger with patch-id comparison and safety restore scripts.**

When teams merge pull requests using GitHub's **Squash and Merge**, the commit SHA-1 created on `main` is completely different from the commit SHAs on your local feature branch. As a result, standard `git branch -d` throws an error (`error: The branch is not fully merged`), leaving developers with dozens of abandoned branches lingering locally. `git-scrub-branch` inspects commit patch-ids to safely detect both standard-merged and squash-merged branches, provides dry-run safety by default, and outputs instant undo scripts before any branch is touched.

---

## ✨ Features

- **Squash-Merge Detection**: Compares commit cherry patch-ids to detect branches whose actual code changes landed on `main`, even when commit SHAs don't match.
- **Upstream Deletion Tracking**: Identifies local branches whose remote branch was already deleted (`[gone]`).
- **Protected Trunk Guard**: Strictly safeguards `main`, `master`, `dev`, `develop`, `staging`, `production`, and your currently checked-out branch.
- **Safety Undo Script**: Automatically prints exact `git branch <name> <sha>` commands so you can restore any deleted branch with a single paste if needed.
- **Safe Dry-Run by Default**: Never deletes anything without explicit `--apply` confirmation.
- **Zero Runtime Dependencies**: Ultra-fast execution with zero third-party dependencies.

---

## 🚀 Installation

```bash
# Run on-demand with npx
npx git-scrub-branch --help

# Or install globally
npm install -g git-scrub-branch
```

---

## 🛠️ CLI Usage

### Preview Stale Branches (Dry-Run)
```bash
# Safely inspect merged and squash-merged branches:
git-scrub-branch
```

### Apply Deletion
```bash
# Delete all stale branches and print safety recovery script:
git-scrub-branch --apply
```

### Target Custom Default Branch
```bash
git-scrub-branch --target develop --apply
```

---

## 💻 Programmatic TypeScript API

```typescript
import { analyzeBranches, deleteBranch } from 'git-scrub-branch';

const analysis = analyzeBranches(process.cwd(), 'main');
console.log(`Found ${analysis.staleBranches.length} stale branches.`);

for (const branch of analysis.staleBranches) {
  console.log(`${branch.name}: ${branch.reason}`);
}
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📄 License

MIT © Essentials Toolkit Authors

