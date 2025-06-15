import { FeedTagIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

const TagElement: React.FC<{ tagName: string }> = ({ tagName }) => {
  const {
    workspace,
    setNotification,
    openContextMenu,
    openConfirmationModal,
    setActiveModal
  } = useAppContext();

  const tagContextMenu = async (event: React.MouseEvent) => {
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
          id: "copyTag",
          text: "Copy tag name",
          action: () => {
            navigator.clipboard.writeText(tagName).catch(e => {
              setNotification(`Failed to copy tag name: ${e}`);
            });
          },
        },
        {
          id: "deleteTag",
          text: "Delete",
          action: () => {
            openConfirmationModal({
              onConfirmed: () => {
                invoke("delete_tag", { repoPath, tagName }).catch((e) => {
                  setNotification(e);
                }).finally(() => setActiveModal(""))
              },
              title: "Delete Tag",
              subTitle: "Target: " + tagName,
            });
          },
        },
      ],
    });

    openContextMenu(contextMenu, event);
  }

  return (
    <div onContextMenu={tagContextMenu}>
      <FeedTagIcon />
      {tagName}
    </div>
  );
};

export default TagElement;

