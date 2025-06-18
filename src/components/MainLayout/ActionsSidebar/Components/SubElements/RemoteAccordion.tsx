import { DatabaseIcon } from "@primer/octicons-react";
import Accordion from "../../../../Common/Accordion/Accordion";
import RemoteBranchElement from "./RemoteBranch";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

interface RemoteAccordionProps {
  containerClassName: string,
  headerClassName: string,
  remote: Remote,
  branches: string[]
}

const RemoteAccordion: React.FC<RemoteAccordionProps> = (props) => {
  const {
    containerClassName,
    headerClassName,
    remote,
    branches
  } = props;

  const { workspace, setNotification, openContextMenu, openConfirmationModal, setActiveModal } = useAppContext();

  const remoteContextMenu = async (event: React.MouseEvent) => {
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
          id: "fetchRemote",
          text: "Fetch",
          action: () => {
            const remotes: string[] = [remote.name];
            invoke<string>("fetch_remote", { repoPath, remotes }).then((msg) => {
              setNotification(msg);
            }).catch((e) => {
              if (e) {
                setNotification(e);
              }
            });
          },
        },
        {
          id: "deleteRemote",
          text: "Delete",
          action: () => {
            openConfirmationModal({
              onConfirmed: () => {
                invoke("delete_remote", { repoPath, remoteName: remote.name }).catch((e) => {
                  setNotification(e);
                }).finally(() => setActiveModal(""));
              },
              title: "Delete remote",
              subTitle: "Target: " + remote.name
            });
          },
        },
        {
          id: "copyUrl",
          text: "Copy Url",
          action: () => {
            navigator.clipboard.writeText(remote.url).catch(e => {
              setNotification(`Failed to copy remote URL: ${e}`);
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
      title={remote.name}
      icon={<DatabaseIcon />}
      onContextMenu={remoteContextMenu}
    >
      <ul>
        {branches.map((branchName, branchIndex) => (
          <li key={`${remote.name}-${branchName}-${branchIndex}`}>
            <RemoteBranchElement remote={remote.name} branchName={branchName} />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

export default RemoteAccordion;

