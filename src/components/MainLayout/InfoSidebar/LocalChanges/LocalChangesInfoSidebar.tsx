import { useMainContext } from "../../../../context/MainContext";

const LocalChangesInfoSidebar: React.FC = () => {
  const { currentAppTab } = useMainContext();

  return (
    <div className={`${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      LOCAL CHANGES INFO SIDEBAR
    </div>
  );
};

export default LocalChangesInfoSidebar;
