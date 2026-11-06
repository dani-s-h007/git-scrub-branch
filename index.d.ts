export interface StaleBranch {
  name: string;
  sha: string;
  upstreamGone: boolean;
  reason: string;
  canStandardDelete: boolean;
}

export interface BranchAnalysis {
  currentBranch: string;
  targetBranch: string;
  staleBranches: StaleBranch[];
  activeBranches: Array<{ name: string; sha: string; upstreamGone: boolean }>;
  restoreScript: string;
}

export declare function analyzeBranches(cwd?: string, targetBranch?: string): BranchAnalysis;
export declare function deleteBranch(branchName: string, force?: boolean, cwd?: string): { success: boolean; error?: string };

