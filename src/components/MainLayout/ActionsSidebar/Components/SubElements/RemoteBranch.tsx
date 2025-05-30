import { GitBranchIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";

const RemoteBranchElement: React.FC<{ branchName: string }> = ({ branchName }) => {
  const { workspace, setNotification, openContextMenu } = useAppContext();

  const remoteBranchContextMenu = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (!workspace) {
      console.error("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    let contextMenu = await Menu.new({
      items: [
        {
          id: "asdad",
          text: "ASDASD",
          action: () => {

          },
        },
        {
          id: "asdad",
          text: "ASDASD",
          action: () => {

          },
        },
        {
          id: "asdad",
          text: "ASDASD",
          action: () => {

          },
        },
      ],
    });

    openContextMenu(contextMenu, event);
  }

  return (
    <div style={{ marginLeft: 0 }} onContextMenu={() => console.log(2)}>
      <GitBranchIcon />
      {branchName}
    </div>
  );
};

export default RemoteBranchElement;

