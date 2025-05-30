import { FeedTagIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu } from "@tauri-apps/api/menu";

const TagElement: React.FC<{ tag: string }> = ({ tag }) => {
  const { workspace, setNotification, openContextMenu } = useAppContext();

  const tagContextMenu = async (event: React.MouseEvent) => {
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
    <div onContextMenu={() => console.log(3)}>
      <FeedTagIcon />
      {tag}
    </div>
  );
};

export default TagElement;

