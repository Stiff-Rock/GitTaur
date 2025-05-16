import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";

const ConfigPage: React.FC = () => {
  const { isInConfigPage, workspace } = useAppContext();

  //TODO: MAKE CONFIG FILE
  return (
    <div className={`${styles.mainContainer} ${isInConfigPage || !workspace ? '' : 'inactive'}`}>
      CONFIG PAGE
    </div>
  );
}

export default ConfigPage;
