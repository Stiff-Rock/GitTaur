import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../Common/ComboBox/ComboBox";
import { languageCodeFromName, languageNameFromCode, languageNames } from "../../utils/configUtils";
import InputField from "../Common/InputField/InputField";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useDialog } from "../../hooks/useDialog";

type ConfigTabs = "general" | "git" | "ui";

const ConfigPage: React.FC = () => {
  const { checkPageType, workspace, config, setConfig, setNotification } = useAppContext();
  const { selectFileDialog } = useDialog();

  const [newConfig, setNewConfig] = useState<Configuration | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTabs>("general");

  useLayoutEffect(() => {
    if (!config) return
    setNewConfig(config);
  }, [config]);

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
              {/*BUG: COMBOBOX IS SLIGHLTY WIDER*/}
              <ComboBox
                title="Language"
                onItemSelected={(value) => { setNewConfig({ ...newConfig, lang: languageCodeFromName(value) }) }}
                value={languageNameFromCode(newConfig.lang)}
                optionsArray={languageNames}
                className={styles.configInput}
              />

              <InputField
                title="Date format"
                type="text"
                placeholder="Default: YYYY-MM-DD"
                value={newConfig.dateFormat}
                onChange={(value) => setNewConfig({ ...newConfig, dateFormat: value })}
                className={styles.configInput}
              />

              {/*TODO: ADD STLYES TO SPINNER BUTTONS*/}
              {/*TODO: ADD MAXIMUN AND MINIMUM*/}
              <InputField
                title="Max commits"
                type="number"
                placeholder=""
                value={newConfig.maxCommits.toString()}
                onChange={(value) => setNewConfig({ ...newConfig, maxCommits: Number(value) })}
                className={styles.configInput}
              />

              {/*TODO: Maybe provide the path of the system default*/}
              <InputField
                title="Terminal app"
                type="text"
                placeholder="(Empty for system default)"
                value={newConfig.terminalApp}
                onChange={(value) => setNewConfig({ ...newConfig, maxCommits: Number(value) })}
                buttonIcon={<FileDirectoryIcon />}
                onButtonClick={selectFileDialog}
                className={styles.configInput}
              />
            </div>
          }

          {configTab === "git" &&
            <div className={styles.configSection}>
              <InputField
                title="Username"
                type="text"
                placeholder="Git username"
                value={newConfig.username}
                onChange={(value) => setNewConfig({ ...newConfig, username: value })}
                className={styles.configInput}
              />

              <InputField
                title="Email"
                type="email"
                placeholder="Git email"
                value={newConfig.email}
                onChange={(value) => setNewConfig({ ...newConfig, email: value })}
                className={styles.configInput}
              />
            </div>
          }

          {configTab === "ui" &&
            <div className={styles.configSection}>
              <ComboBox
                title="Theme"
                value={newConfig.theme}
                className={styles.configInput}
                onItemSelected={(value) => setNewConfig({ ...newConfig, theme: value })}
                //TODO: MAYBE MAKE ENUM
                optionsArray={["System Default", "Light", "Dark"]}
              />

              {/*TODO: TWEAK THIS A COLOR INPUT LTTLE BIT*/}
              <InputField
                title="Accent Color"
                type="color"
                placeholder="#50FA7B"
                value={newConfig.accentColor}
                onChange={(value) => setNewConfig({ ...newConfig, accentColor: value })}
                className={styles.configInput}
              />
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
