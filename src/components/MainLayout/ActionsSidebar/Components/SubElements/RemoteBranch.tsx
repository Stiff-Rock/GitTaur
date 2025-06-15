import { GitBranchIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

const RemoteBranchElement: React.FC<{ branchName: string }> = ({ branchName }) => {
  const {
    workspace,
    setNotification,
    openContextMenu,
    setActiveModal,
    openConfirmationModal,
    openCreateTagModal,
    openMergeBranchModal,
    openRebaseBranchModal
  } = useAppContext();

  const remoteBranchContextMenu = async (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (!workspace) {
      console.warn("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    const repoPath = workspace.activeTab;

    let contextMenu = await Menu.new({
      items: [
        {
          id: "pullRemoteBranch",
          text: "Pull " + branchName,
          action: () => {

          },
        },
        {
          id: "mergeRemoteBranch",
          text: "Merge",
          action: () => {
            openMergeBranchModal({ sourceBranch: branchName });
          },
        },
        {
          id: "rebaseRemoteBranch",
          text: "Rebase",
          action: () => {
            openRebaseBranchModal({ sourceBranch: branchName });
          },
        },
        {
          id: "deleteRemoteBranch",
          text: "Delete " + branchName,
          action: () => {
            openConfirmationModal({
              onConfirmed() {
                invoke("delete_branch", { repoPath, branchName, isLocal: false }).catch((e) => {
                  setNotification(e);
                }).finally(() => setActiveModal(""));
              },
              title: "Delete branch",
              subTitle: "Target: " + branchName,
            });

          },
        },
        {
          id: "createTagRemoteBranch",
          text: "Create tag",
          action: () => {
            openCreateTagModal({ branchName, isLocal: false });
          },
        },
        {
          id: "copyRemoteBranchName",
          text: "Copy branch name",
          action: () => {
            navigator.clipboard.writeText(branchName).catch(e =>
              setNotification(`Failed to copy remote branch name: ${e}`)
            );
          }
        },
      ],
    });

    openContextMenu(contextMenu, event);
  }

  return (
    <div style={{ marginLeft: 0 }} onContextMenu={remoteBranchContextMenu}>
      <GitBranchIcon />
      {branchName}
    </div>
  );
};

export default RemoteBranchElement;

