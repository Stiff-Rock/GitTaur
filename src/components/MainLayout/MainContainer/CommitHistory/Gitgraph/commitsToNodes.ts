
export interface CommitNode {
  id: string;
  position: {
    x: number;
    y: number;
  };
  nodeColor: string,
  branchColor: string,
  data: Commit;
}

const COLORS = [
  "#1CA085",
  "#C0392B",
  "#8E44AD",
  "#F39C12",
  "#2980B9",
  "#F1C40F",
  "#F194EB",
  "#34495E",
  "#D35400",
  "#7F8C8D",
  "#F1948A",
];

let currentColorIndex = 0;
export function getColor(): string {
  const color = COLORS[currentColorIndex];
  currentColorIndex = (currentColorIndex + 1) % COLORS.length;
  if (currentColorIndex === 0) currentColorIndex++;
  return color;
}

export default function createCommitNodes(
  commitMap: Map<string, Commit>,
  x_spacing: number,
  y_spacing: number,
  maxCommits: number
): Map<string, CommitNode> {
  const commitHistory = [...commitMap.values()].slice(-maxCommits);

  currentColorIndex = 0;

  // Step 1: Build topological order (roots to tips)
  // Initialize indegree (number of parents in the graph) and find root commits (no parents in graph)
  const indegree = new Map<string, number>();
  const queue: string[] = [];
  for (const [_, commit] of commitMap) {
    const parentsInGraph = commit.parents.filter(p => commitMap.has(p));
    indegree.set(commit.id, parentsInGraph.length);

    if (indegree.get(commit.id) === 0) {
      queue.push(commit.id);
    }
  };

  const lanes: (string | null)[] = []; // Contains the tips of each branch in the respective lane index

  // Helper function to obtain empty lane index
  const findFreeLane = (): number => {
    const index = lanes.indexOf(null);
    return index !== -1 ? index : lanes.length;
  };

  // Helper function to store branch tips to lanes array
  const addTipToLanes = (currentLaneIndex: number, commitId: string) => {
    if (currentLaneIndex === lanes.length) {
      lanes.push(commitId);

      // Occupy existen lane
    } else {
      lanes[currentLaneIndex] = commitId;
    }
  };

  // Step 2: Lane assignment
  const nodeMap: Map<string, CommitNode> = new Map();
  const commitLane = new Map<string, number>(); // Map of lanes and their commits
  const processedChildren = new Map<string, number>();
  const commitsToFreeLane = new Set<string>;
  const branchStartLanes = new Map<string, Set<number>>;

  /*TODO: FOR MORE ACCURATE BRANCH LANE ASSINGMENT, USE DATE SYSTEM, 
   * WHERE IN A RECORD OF SOME KIND WE STORE WHAT LANES ARE OCCUPIED
   * AT THAT DATE RANGE */

  let proccessOnlyMasterBranch = true;
  // First procces only the main/master branch to ensure that it takes the first lane entirely, then process the rest
  for (let i = 0; i < 2; i++) {
    commitHistory.forEach((commit, index) => {
      if (proccessOnlyMasterBranch !== commit.isFromMainBranch) return;

      const commitId = commit.id;

      let currentLaneIndex: number = 0;

      const firstParentId = commit.parents[0] ?? null;
      const firstParentCommit = commitMap.get(firstParentId) ?? null;

      // Root commit (no parents): find new lane (usually the first for master/main init commit)
      if (!firstParentCommit) {
        currentLaneIndex = findFreeLane();
        addTipToLanes(currentLaneIndex, commitId);
        // Normal commit: get first parent (main lineage)
      } else {
        // Parent not in graph: treat as root (graph has been cut off)
        if (!firstParentCommit) {
          currentLaneIndex = findFreeLane();
          addTipToLanes(currentLaneIndex, commitId);

          // Has parent: position respective to parent
        } else {
          const parentLane = commitLane.get(firstParentId);

          if (parentLane !== undefined) {
            // Check for branching
            if (firstParentCommit.children.length > 1) {
              // Obtain how many children of that parent have been proccesed
              const count = processedChildren.get(firstParentId) || 0;

              // First child (not branching): use parent's lane
              if (count === 0) {
                currentLaneIndex = parentLane;
                processedChildren.set(firstParentId, 1);

                // Other children (branching): new lane
              } else {
                //HACK:
                currentLaneIndex = findFreeLane();

                const occupiedLanesFromParent = branchStartLanes.get(firstParentId) ?? new Set();
                while (occupiedLanesFromParent.has(currentLaneIndex)) {
                  currentLaneIndex++;
                }
                occupiedLanesFromParent.add(currentLaneIndex);
                branchStartLanes.set(firstParentId, occupiedLanesFromParent)

                processedChildren.set(firstParentId, count + 1);
              }

              // Only one child (no branching): use parent's lane
            } else {
              currentLaneIndex = parentLane;
            }
          } else {
            currentLaneIndex = findFreeLane();
          }

          // Update lane tip with last proccesed commit
          lanes[currentLaneIndex] = commitId;

          // Free merged branches' lanes
          if (proccessOnlyMasterBranch) {
            if (commit.parents.length > 1) {
              const merge_parents = commit.parents.slice(1);

              for (const parentId of merge_parents) {
                if (!commitMap.has(parentId)) {
                  console.error(`Id not found in commit map during lane freeing:\n- Commit: ${commit.subject}\n- ParentId: ${parentId} `)
                  continue
                };

                commitsToFreeLane.add(parentId);
              }
            }
          } else if (commitsToFreeLane.has(commitId)) {
            if (commit.children.length > 1) {
              commitsToFreeLane.delete(commitId);
              const secondChildId = commit.children[1];
              commitsToFreeLane.add(secondChildId);
            } else {
              lanes[currentLaneIndex] = null;
            }
          }
        }
      }

      // Record lane assignment
      commitLane.set(commitId, currentLaneIndex);

      // Create node with position
      const x = currentLaneIndex * x_spacing;
      const y = (commitHistory.length - 1 - index) * y_spacing;

      let color: string;
      if (firstParentCommit && commitLane.get(firstParentId) === currentLaneIndex) {
        color = nodeMap.get(firstParentId)!.nodeColor;
      } else {
        color = getColor();
      }

      nodeMap.set(commitId, {
        id: commitId,
        position: {
          x,
          y
        },
        nodeColor: color,
        branchColor: color,
        data: commit
      });
    });

    proccessOnlyMasterBranch = false;
  }

  return nodeMap;
}
