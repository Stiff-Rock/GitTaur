import { DatabaseIcon } from "@primer/octicons-react";
import Accordion from "../../../../Common/Accordion/Accordion";
import RemoteBranchElement from "./RemoteBranch";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

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

    const repoPath = workspace.activeTab;

    let contextMenu = await Menu.new({
      items: [
        {
          id: "fetchRemote",
          text: "Fetch",
          action: () => {
            const remotes: string[] = [remoteName];
            invoke<string>("fetch_remote", { repoPath, remotes }).then((msg) => {
              setNotification(msg);
            }).catch((e) => {
              if (e) {
                console.error(e);
                setNotification(e);
              }
            });
          },
        },
        {
          id: "deleteRemote",
          text: "Delete",
          action: () => {
            invoke("delete_remote", { repoPath, remoteName }).catch((e) => {
              console.error(e);
              setNotification(e);
            });;
          },
        },
        {
          id: "copyUrl",
          text: "Copy Url",
          action: () => {
            //TODO: IN THE BACKEND, ASLO SEND THE REMOTE URL NOT JUST THE NAME (make remote interface)
            navigator.clipboard.writeText(remoteName).catch(e => {
              console.error("Failed to copy remote URL:", e);
            });
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

