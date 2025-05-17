import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useState } from "react";

type ConfigTabs = "general" | "git";

const ConfigPage: React.FC = () => {
  const { checkPageType, workspace } = useAppContext();

  const [_configTab, _setConfigTab] = useState<ConfigTabs>("general");

  //TODO: MAKE CONFIG FILE
  return (
    <div className={`${styles.mainContainer} ${checkPageType("Config") || !workspace ? '' : 'inactive'}`}>
      CONFIG PAGE
    </div>
  );
}

export default ConfigPage;
