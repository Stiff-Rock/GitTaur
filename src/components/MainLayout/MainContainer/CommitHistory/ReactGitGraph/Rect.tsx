import React from "react";
import { CommitNode } from "./commitsToNodes";
import { useGitGraphContext } from "./GitGraphContext";
import { useMainContext } from "../../../../../context/MainContext";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu, MenuItemOptions } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

const Rect: React.FC<{ node: CommitNode }> = ({ node }) => {
  const { showLoadingDuringTask } = useAppContext();
  const { GRAPH_PADDING, Y_SPACING } = useGitGraphContext();

  const {
    workspace,
    openContextMenu,
    openCreateTagModal,
    setNotification,
    openConfirmationModal,
    setActiveModal
  } = useAppContext();

  const { selectedCommit, setSelectedCommit, repoInfo } = useMainContext();

  const [isHovered, setIsHovered] = React.useState(false);

  const y = node.position.y + GRAPH_PADDING - (Y_SPACING / 2);

  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (!workspace) return;

    setSelectedCommit(node.id);

    const subject = node.data.subject;
    const shortSubject = subject.length > 25 ? subject.slice(0, 25) + "..." : subject;

    const repoPath = workspace.activeTab;

    let menuItems: MenuItemOptions[] = [];

    menuItems.push({
      id: "checkoutCommit",
      text: "Checkout to this commit",
      action: () => {
        openConfirmationModal({
          onConfirmed() {
            const checkoutPromise = invoke<void>("checkout_commit", { repoPath, commitOid: node.id }).then(() => {
              setNotification("Successfully checked out to \"" + shortSubject + "\"")
            }).catch((e) => {
              setNotification(e);
            }).finally(() => setActiveModal(""));

            showLoadingDuringTask({
              title: "Checking out to " + shortSubject,
            }, checkoutPromise);
          },
          title: "Checkout to commit",
          subTitle: "Target: " + shortSubject,
          warning: "Unsaved changes will be discarded!!"
        });
      },
    });

    for (const ref of node.data.refs) {
      const parts = ref.split(':');
      const labelType = parts[0];

      if (labelType === 'tag' || labelType === 'other') continue;

      const labelText = parts[1];

      if (repoInfo?.currentBranch === labelText) continue;

      menuItems.push({
        id: "checkoutBranch" + labelText,
        text: "Checkout to " + labelText,
        action: () => {
          openConfirmationModal({
            onConfirmed() {
              const checkoutPromise = invoke<void>("checkout_branch", { repoPath, branchName: labelText }).then(() => {
                setNotification("Successfully checked out to \"" + labelText + "\"")
              }).catch((e) => {
                setNotification(e);
              }).finally(() => setActiveModal(""));

              showLoadingDuringTask({
                title: "Checking out to " + labelText,
              }, checkoutPromise);
            },
            title: "Checkout to branch",
            subTitle: "Target: " + labelText,
            warning: "Unsaved changes will be discarded!!"
          });
        },
      });
    }

    menuItems.push({
      id: "revertCommit",
      text: "Revert",
      action: () => {
        openConfirmationModal({
          onConfirmed: () => {
            const revertPromise = invoke<void>("revert_commit", {
              repoPath,
              commitOid: node.id,
              isMergeCommit: node.data.parents.length > 1
            }).catch((e) => {
              setNotification(e);
            }).finally(() => setActiveModal(""));

            showLoadingDuringTask({
              title: "Reverting \"" + shortSubject + "\"",
            }, revertPromise);
          },
          title: "Revert commit",
          subTitle: "Target: <" + node.data.subject + ">",
        });
      },
    });

    menuItems.push({
      id: "tagCommit",
      text: "Tag",
      action: () => {
        openCreateTagModal({
          commitOid: node.id,
        });
      },
    });

    menuItems.push({
      id: "copyCommitSha",
      text: "Copy commit SHA",
      action: () => {
        navigator.clipboard.writeText(node.id).catch(e => {
          setNotification(`Failed to copy commit SHA: ${e}`);
        });
      },
    });

    openContextMenu(await Menu.new({ items: menuItems }), event);
  };

  return (
    <rect
      x={0}
      y={y}
      onClick={() => setSelectedCommit(node.id)}
      onContextMenu={handleOpenContextMenu}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      fill={
        selectedCommit === node.id
          ? 'rgba(120, 120, 120, 0.4)'
          : isHovered
            ? 'rgba(70, 70, 70, 0.4)'
            : 'transparent'
      }
      width="100%"
      height={Y_SPACING}
    />
  );
};

export default Rect;
