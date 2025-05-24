import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../Common/ComboBox/ComboBox";
import { languageCodeFromName, languageNameFromCode, languageNames, parseTheme } from "../../utils/configUtils";
import InputField from "../Common/InputField/InputField";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useDialog } from "../../hooks/useDialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

type ConfigTabs = "general" | "git" | "ui";

const ConfigPage: React.FC = () => {
  const { checkPageType, workspace, config, setConfig, setNotification } = useAppContext();
  const { selectFileDialog, selectDirectoryDialog } = useDialog();

  const [newConfig, setNewConfig] = useState<Configuration | null>(null);
  const [configTab, setConfigTab] = useState<ConfigTabs>("general");

  useLayoutEffect(() => {
    if (!config) return
    setNewConfig(config);
  }, [config]);

  const applyChanges = () => {
    if (!config || !newConfig || config === newConfig) return;

    if (newConfig.username != config.username || newConfig.email != config.email) {
      const username = newConfig.username != config.username ? newConfig.username : "";
      const email = newConfig.email != config.email ? newConfig.email : "";

      invoke("set_global_git_user_id", { username, email }).catch((e) => {
        const msg = `Error updating git global identification - ${e}`;
        console.error(msg)
        setNotification(msg);
      });
    }

    if (newConfig.themeValue != config.themeValue) {
      document.documentElement.setAttribute('data-theme', newConfig.themeValue);
    }

    if (newConfig.accentColor != config.accentColor) {
      document.documentElement.style.setProperty('--active-color', newConfig.accentColor);
    }

    setConfig(newConfig);
    setNotification("Succesfully applied new configuration!");
  }

  const cancel = () => {
    setNewConfig(config);
  }

  //TODO: ARE YOU SURE? dialog when trying to close the tab

  //TODO: ADD GRAPH COLOR THEMING
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

              {/*TODO: BENCHMARK HOW MANY CAN I REASONABLY RENDER || ALSO APPLY LIMIT TO GRAPH*/}
              <InputField
                title="Max commits"
                type="number"
                placeholder=""
                value={newConfig.maxCommits.toString()}
                onChange={(value) => setNewConfig({ ...newConfig, maxCommits: Math.min(Math.max(Number(value), 0), 100000) })}
                className={styles.configInput}
                min={0}
                max={100000}
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

              <InputField
                title="Clone directory"
                type="text"
                placeholder="path/to/directory"
                value={newConfig.clonePath}
                onChange={(value) => {
                  console.log("NEWPATH: ", value)
                  setNewConfig({ ...newConfig, clonePath: value })
                }}
                buttonIcon={<FileDirectoryIcon />}
                onButtonClick={selectDirectoryDialog}
                className={styles.configInput}
              />
            </div>
          }

          {configTab === "ui" &&
            <div className={styles.configSection}>
              <ComboBox
                title="Theme"
                value={newConfig.themeConfig.charAt(0).toUpperCase() + newConfig.themeConfig.slice(1)}
                className={styles.configInput}
                onItemSelected={(value) => {
                  const selectedTheme = parseTheme(value);
                  if (selectedTheme != "system") {
                    setNewConfig({ ...newConfig, themeConfig: selectedTheme, themeValue: selectedTheme });
                  } else {
                    getCurrentWindow().theme().then((theme) => {
                      const sysTheme = theme ? parseTheme(theme) : "dark";
                      setNewConfig({ ...newConfig, themeConfig: selectedTheme, themeValue: sysTheme });
                    })
                  }
                }}
                optionsArray={["Light", "Dark", "System"]}
              />

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

          {/*TODO: ADD RESET DEFAULTS BUTTON*/}
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
