import { useMainContext } from "../../../../context/MainContext";

const TodoPanelInfoSidebar: React.FC = () => {
  const { currentAppTab } = useMainContext();

  return (
    <div className={`${currentAppTab === "todo-panel" ? '' : 'inactive'}`}>
      TODO PANEL INFO SIDEBAR
    </div>
  );
};

export default TodoPanelInfoSidebar;
