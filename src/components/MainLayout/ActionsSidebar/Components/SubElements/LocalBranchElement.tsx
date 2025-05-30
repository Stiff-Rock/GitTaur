import { GitBranchIcon } from "@primer/octicons-react";
import ActiveIndicator from "../../../../Common/ActiveIndicator";
import { useMainContext } from "../../../../../context/MainContext";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";

interface LocalBranchElementProps {
  branchName: string,
  className: string,
}

const LocalBranchElement: React.FC<LocalBranchElementProps> = (props) => {
  const { branchName, className } = props;

  const { workspace, setNotification, openContextMenu } = useAppContext();
  const { repoInfo } = useMainContext();

  const localBranchContextMenu = async (event: React.MouseEvent) => {
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
    <div onContextMenu={() => console.log(1)}>
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
