import { DatabaseIcon } from "@primer/octicons-react";
import Accordion from "../../../../Common/Accordion/Accordion";
import RemoteBranchElement from "./RemoteBranch";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";

interface RemoteAccordionProps {
  containerClassName: string,
  headerClassName: string,
  remoteName: string,
  branches: string[]
}

const RemoteAccordion: React.FC<RemoteAccordionProps> = (props) => {
  const {
    containerClassName,
    headerClassName,
    remoteName,
    branches
  } = props;

  const { workspace, setNotification, openContextMenu } = useAppContext();

  //TODO: fecth, delete, copy url
  const remoteContextMenu = async (event: React.MouseEvent) => {
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
    <Accordion
      containerClassName={containerClassName}
      headerClassName={headerClassName}
      title={remoteName}
      icon={<DatabaseIcon />}
      onContextMenu={remoteContextMenu}
    >
      <ul>
        {branches.map((branchName, branchIndex) => (
          <li key={`${remoteName}-${branchName}-${branchIndex}`}>
            <RemoteBranchElement branchName={branchName} />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

export default RemoteAccordion;

