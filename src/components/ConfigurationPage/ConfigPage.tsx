import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../Common/ComboBox/ComboBox";
import { languageCodeFromStr, languageCodes } from "../../utils/configUtils";
import InputField from "../Common/InputField/InputField";

type ConfigTabs = "general" | "git" | "ui";

const ConfigPage: React.FC = () => {
  const { checkPageType, workspace, config, setConfig, setNotification } = useAppContext();

  const [newConfig, setNewConfig] = useState<Configuration | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTabs>("general");

  useLayoutEffect(() => {
    if (!config) return
    setNewConfig(config);
  }, [config]);

  useLayoutEffect(() => {
    console.log("UPDATED NEW CONFIG: ", newConfig)
  }, [newConfig]);

  const applyChanges = () => {
    if (!newConfig || config === newConfig) return;
    setConfig(newConfig);
    setNotification("Succesfully applied new configuration!");
  }

  const cancel = () => {
    setNewConfig(config);
  }

  //TODO: MAKE CONFIG FILE
  return (
    <div className={`${styles.mainContainer} ${checkPageType("Config") || !workspace ? '' : 'inactive'}`}>
      <aside className={styles.configTabSidebar}>
        <button className={`actionButton ${styles.configTabButton} ${configTab === "general" ? styles.selected : ''}`}
          onClick={() => setConfigTab("general")}
        >
          General
        </button>

        <button className={`actionButton ${styles.configTabButton} ${configTab === "git" ? styles.selected : ''}`}
          onClick={() => setConfigTab("git")}
        >
          Git
        </button>

        <button className={`actionButton ${styles.configTabButton} ${configTab === "ui" ? styles.selected : ''}`}
          onClick={() => setConfigTab("ui")}
        >
          Ui
        </button>
      </aside>


      {newConfig &&
        <section className={styles.configsContainer}>
          <div className={styles.configTitle}>
            <span>{configTab.charAt(0).toUpperCase() + configTab.slice(1)} Configuration</span>
          </div>

          {configTab === "general" &&
            <div className={styles.configSection}>
              <ComboBox
                title="Language"
                onItemSelected={(value) => setNewConfig({ ...newConfig, lang: languageCodeFromStr(value) })}
                value={newConfig.lang}
                optionsArray={languageCodes}
                className={styles.configInput}
              />

              <InputField
                title="Date format"
                type="text"
                value={newConfig.dateFormat}
                placeholder="Default: YYYY-MM-DD"
                onChange={(value) => setNewConfig({ ...newConfig, dateFormat: value })}
                className={styles.configInput}
              />
            </div>
          }

          {configTab === "git" &&
            <div className={styles.configSection}>
              <span>GIT</span>
            </div>
          }

          {configTab === "ui" &&
            <div className={styles.configSection}>
              <span>UI</span>
            </div>
          }

          <div className={styles.buttonsContainer}>
            <button className='appButton' onClick={cancel}>Cancel</button>
            <button className='appButton' onClick={applyChanges}>Apply</button>
          </div>
        </section >
      }
    </div>
  );
}

export default ConfigPage;
