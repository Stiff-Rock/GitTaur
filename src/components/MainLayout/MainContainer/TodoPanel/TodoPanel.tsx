import { useMainContext } from "../../../../context/MainContext";

const TodoPanel: React.FC = () => {
  const { currentAppTab } = useMainContext();
  return (
    <div className={currentAppTab === "todo-panel" ? '' : 'inactive'}>
      <span>
        TodoPanel
      </span>
    </div>
  );
};

export default TodoPanel;
