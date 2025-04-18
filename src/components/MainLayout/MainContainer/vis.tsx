import { useEffect, useState } from "react";
import { Gitgraph, templateExtend, TemplateName, GitgraphCore, GitgraphCommitOptions, GitgraphBranchOptions } from "@gitgraph/react";
import { invoke } from "@tauri-apps/api/core";

// Define interfaces for the git data structures
interface CommitInfo {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  parent_ids: string[];
}

interface BranchInfo {
  name: string;
  commit_id: string;
}

interface TagInfo {
  name: string;
  commit_id: string;
}

interface GitData {
  commits: CommitInfo[];
  branches: BranchInfo[];
  tags: TagInfo[];
}

// Interface for mapping commit IDs to commits in the graph
interface CommitMap {
  [commitId: string]: any; // GitgraphCommit type is not exported from the library
}

// Interface for mapping branch names to branches in the graph
interface BranchMap {
  [branchName: string]: any; // GitgraphBranch type is not exported from the library
}

function GitGraphVisualizer() {
  const [gitData, setGitData] = useState<GitData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch git data
  useEffect(() => {
    const fetchGitData = async () => {
      const repoPath = "C:\\Users\\Yago\\Desktop\\PlateaApp";

      try {
        // Call the Rust command to extract git data, passing repo path directly
        const data = await invoke<GitData>("extract_git_data", { repoPath });
        setGitData(data);
      } catch (err) {
        setError(typeof err === "string" ? err : "Failed to load git data");
        console.error(err);
      }
    };

    fetchGitData();
  }, []);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!gitData) {
    return <div className="loading">Loading git data...</div>;
  }

  return (
    <Gitgraph options={{
      template: templateExtend(TemplateName.Metro, {
        colors: ["#1CA085", "#C0392B", "#8E44AD", "#F39C12", "#2980B9"],
        branch: {
          lineWidth: 4,
          spacing: 50,
        },
        commit: {
          spacing: 60,
          dot: {
            size: 12,
          },
          message: {
            displayAuthor: true,
            displayHash: true,
          },
        },
      }),
    }}>
      {(gitgraph) => {
        // Maps to keep track of commits and branches
        const commitMap: CommitMap = {};
        const branchMap: BranchMap = {};
        const commitBranchMap: BranchMap = {};

        // Create all branches first
        gitData.branches.forEach(branch => {
          branchMap[branch.name] = gitgraph.branch(branch.name);
        });

        // Find main branch (master or main)
        const mainBranchName: string = gitData.branches.find(b =>
          b.name === "master" || b.name === "main")?.name || gitData.branches[0]?.name;

        // Default branch if needed
        const defaultBranch = branchMap[mainBranchName] || gitgraph.branch("master");

        // Sort commits by timestamp (oldest first)
        const sortedCommits: CommitInfo[] = [...gitData.commits].sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // First pass: Create all commits on the main branch
        for (const commit of sortedCommits) {
          // Start by placing all commits on the main branch
          // We'll correct branch placements in the second pass
          const shortMessage: string = commit.message.split('\n')[0];
          const shortHash: string = commit.id.substring(0, 7);

          const commitOptions: GitgraphCommitOptions = {
            subject: shortMessage,
            author: commit.author ? `${commit.author}` : undefined,
            hash: shortHash,
          };

          const gitgraphCommit = defaultBranch.commit(commitOptions);

          // Store in our maps
          commitMap[commit.id] = gitgraphCommit;
          commitBranchMap[commit.id] = defaultBranch;
        }

        // Second pass: Correct branches and add merges
        for (const commit of sortedCommits) {
          // If this is a merge commit (has multiple parents)
          if (commit.parent_ids.length > 1) {
            // Find the branches for each parent
            const mainParentId: string = commit.parent_ids[0];
            const mergedParentId: string = commit.parent_ids[1];

            // Find branches that point to these commits
            const mainBranch = commitBranchMap[mainParentId];
            const mergedBranch = commitBranchMap[mergedParentId];

            if (mainBranch && mergedBranch && mainBranch !== mergedBranch) {
              // This is a simplified approach - in real scenarios, 
              // you would need to analyze the commit graph more carefully
              mainBranch.merge(mergedBranch);
            }
          }
        }

        // Add tags
        gitData.tags.forEach(tag => {
          if (commitMap[tag.commit_id]) {
            commitMap[tag.commit_id].tag(tag.name);
          }
        });
      }}
    </Gitgraph>
  );
}

export default GitGraphVisualizer;
