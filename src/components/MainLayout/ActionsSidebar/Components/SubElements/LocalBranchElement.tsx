import { GitBranchIcon } from "@primer/octicons-react";
import ActiveIndicator from "../../../../Common/ActiveIndicator";
import { useMainContext } from "../../../../../context/MainContext";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu, MenuItemOptions } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

interface LocalBranchElementProps {
  branchName: string,
  className: string,
}

const LocalBranchElement: React.FC<LocalBranchElementProps> = (props) => {
  const { branchName, className } = props;

  const {
    workspace,
    setNotification,
    openContextMenu,
    setActiveModal,
    openConfirmationModal,
    openRenameBranchModal,
    openCreateTagModal,
    openPushModal,
    openMergeBranchModal,
    openRebaseBranchModal
  } = useAppContext();

  const { repoInfo } = useMainContext();

  const localBranchContextMenu = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (!workspace) {
      console.warn("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    if (!repoInfo) {
      console.warn("Error opening context menu: Unexpected null repoInfo");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    const repoPath = workspace.activeTab;

    let menuItems: MenuItemOptions[] = [];

    menuItems.push({
      id: "pushBranch",
      text: "Push",
      action: () => {
        openPushModal({ seletedLocalBranch: branchName });
      },
    });

    menuItems.push({
      id: "tagBranch",
      text: "Tag",
      action: () => {
        openCreateTagModal({ branchName, isLocal: true });
      },
    });

    menuItems.push({
      id: "renameBranch",
      text: "Rename",
      action: () => {
        openRenameBranchModal({
          oldBranchName: branchName
        });
      },
    });

    if (repoInfo.currentBranch !== branchName) {
      menuItems.push({
        id: "checkoutBranch",
        text: "Checkout " + branchName,
        action: () => {
          openConfirmationModal({
            onConfirmed() {
              invoke("checkout_branch", { repoPath, branchName }).catch((e) => {
                setNotification(e);
              }).finally(() => setActiveModal(""));
            },
            title: "Checkout to branch",
            subTitle: "Target: " + branchName,
          });
        },
      });

      menuItems.push({
        id: "deleteBranch",
        text: "Delete",
        action: () => {
          openConfirmationModal({
            onConfirmed() {
              invoke("delete_branch", { repoPath, branchName, isLocal: true }).catch((e) => {
                setNotification(e);
              }).finally(() => setActiveModal(""));
            },
            title: "Delete branch",
            subTitle: "Target: " + branchName,
          });
        },
      });

      menuItems.push({
        id: "mergeBranch",
        text: "Merge",
        action: () => {
          openMergeBranchModal({ sourceBranch: branchName });
        },
      });

      menuItems.push({
        id: "rebaseBranch",
        text: "Rebase",
        action: () => {
          openRebaseBranchModal({ sourceBranch: branchName });
        },
      });
    }

    menuItems.push({
      id: "copyLocalBranchName",
      text: "Copy branch name",
      action: () => {
        navigator.clipboard.writeText(branchName).catch(e => {
          setNotification(`Failed to copy remote local branch name: ${e}`);
        });
      },
    });

    openContextMenu(await Menu.new({ items: menuItems }), event);
  }

  return (
    <div onContextMenu={localBranchContextMenu}>
      <GitBranchIcon />
      {branchName}
      <ActiveIndicator
        style={repoInfo?.currentBranch === branchName ? {} : { display: 'none' }}
        className={`${className}`}
      />
    </div>
  );
};

export default LocalBranchElement;
