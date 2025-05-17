import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useState } from "react";

type ConfigTabs = "general" | "git" | "ui";

const ConfigPage: React.FC = () => {
  const { checkPageType, workspace } = useAppContext();

  const [configTab, setConfigTab] = useState<ConfigTabs>("general");

  //TODO: MAKE CONFIG FILE
  return (
    <div className={`${styles.mainContainer} ${checkPageType("Config") || !workspace ? '' : 'inactive'}`}>
      <aside className={styles.configTabSidebar}>
        <button className={`actionButton ${styles.configTabButton} ${configTab === "general" ? styles.selected : ''}`}
          onClick={() => setConfigTab("general")}
        >
          GENERAL
        </button>

        <button className={`actionButton ${styles.configTabButton} ${configTab === "git" ? styles.selected : ''}`}
          onClick={() => setConfigTab("git")}
        >
          GIT
        </button>

        <button className={`actionButton ${styles.configTabButton} ${configTab === "ui" ? styles.selected : ''}`}
          onClick={() => setConfigTab("ui")}
        >
          UI
        </button>
      </aside>

      <section className={styles.configsContainer}>
        <div className={styles.configTitle}>
          <span>{configTab.charAt(0).toUpperCase() + configTab.slice(1)} Configuration</span>
        </div>

        <div className={`${styles.configSection} ${configTab === "general" ? '' : 'inactive'}`}>
          <span>GENERAL</span>
        </div>

        <div className={`${styles.configSection} ${configTab === "git" ? '' : 'inactive'}`}>
          <span>GIT</span>
        </div>

        <div className={`${styles.configSection} ${configTab === "ui" ? '' : 'inactive'}`}>
          <span>UI</span>
        </div>
      </section >
    </div>
  );
}

export default ConfigPage;
