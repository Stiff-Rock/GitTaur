import styles from "./ConfigPage.module.css";
import { useAppContext } from "../../context/AppContext";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../Common/ComboBox/ComboBox";
import { parseTheme } from "../../utils/configUtils";
import InputField from "../Common/InputField/InputField";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { selectDirectoryDialog } from "../../utils/FileExplorerDialog";

type ConfigTabs = "general" | "git" | "ui";
const ConfigPage: React.FC = () => {
  const {
    newConfig,
    setNewConfig,
    isType,
    workspace,
    config,
    applyNewConfig,
    setNotification,
    openConfirmationModal,
    setActiveModal
  } = useAppContext();

  const [configTab, setConfigTab] = useState<ConfigTabs>("general");

  useLayoutEffect(() => {
    if (!config) return
    setNewConfig(config);
  }, [config]);

  const cancel = () => {
    setNewConfig(config);
  }

  const resetToDefault = () => {
    openConfirmationModal({
      onConfirmed: () => {
        invoke<Configuration>("restore_config_defaults").then(applyNewConfig).catch((e) => {
          setNotification(e);
        }).finally(() => setActiveModal(""));
      },
      title: "Restore default configuration",
      subTitle: "¿Are you sure you want to restore ALL the default configuration values?",
    })
  };

  return (
    <div className={`${styles.mainContainer} ${isType("Config") || !workspace ? '' : 'inactive'}`}>
      <aside className={styles.configTabSidebar}>
        <button
          className={`actionButton ${styles.configTabButton} ${configTab === "general" ? styles.selected : ''}`}
          onClick={() => setConfigTab("general")}
        >
          General
        </button>

        <button
          className={`actionButton ${styles.configTabButton} ${configTab === "git" ? styles.selected : ''}`}
          onClick={() => setConfigTab("git")}
        >
          Git
        </button>

        <button
          className={`actionButton ${styles.configTabButton} ${configTab === "ui" ? styles.selected : ''}`}
          onClick={() => setConfigTab("ui")}
        >
          Ui
        </button>

        <button
          className={`appButton ${styles.resetButton}`}
          onClick={resetToDefault}
        >
          Reset to Default
        </button>
      </aside>


      {
        newConfig &&
        <section className={styles.configsContainer}>
          <div className={styles.configTitle}>
            <span>{configTab.charAt(0).toUpperCase() + configTab.slice(1)} Configuration</span>
          </div>

          {configTab === "general" &&
            <div className={styles.configSection}>
              {/*NOTE: Internacionalización
              <ComboBox
                title="Language"
                onItemSelected={(value) => { setNewConfig({ ...newConfig, lang: languageCodeFromName(value) }) }}
                value={languageNameFromCode(newConfig.lang)}
                optionsArray={languageNames}
                className={styles.configInput}
              />*/}

              <InputField
                title="Date format"
                type="text"
                placeholder="Default: YYYY-MM-DD"
                value={newConfig.dateFormat}
                onChange={(value) => setNewConfig({ ...newConfig, dateFormat: value })}
                className={styles.configInput}
              />

              {/*NODE: BENCHMARK HOW MANY CAN I REASONABLY RENDER*/}
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

              <ComboBox
                title="Create TodoList file"
                onItemSelected={(value) => { setNewConfig({ ...newConfig, createTodo: value === "true" }) }}
                value={`${newConfig.createTodo}`}
                optionsArray={['true', 'false']}
                className={styles.configInput}
              />

              {/*Maybe provide the path of the system default*/}
              {/*<InputField
                title="Terminal app"
                type="text"
                placeholder="(Empty for system default)"
                value={newConfig.terminalApp}
                onChange={(value) => setNewConfig({ ...newConfig, maxCommits: Number(value) })}
                buttonIcon={<FileDirectoryIcon />}
                onButtonClick={selectFileDialog}
                className={styles.configInput}
              />*/}
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
                onChange={(value) => setNewConfig({ ...newConfig, clonePath: value })}
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
                  const accentColor = selectedTheme !== 'gittaur' ? "#50FA7B" : "#06b6d4";

                  if (selectedTheme !== "system") {
                    setNewConfig({
                      ...newConfig,
                      themeConfig: selectedTheme,
                      themeValue: selectedTheme,
                      accentColor
                    });
                  } else {
                    getCurrentWindow().theme().then((theme) => {
                      const sysTheme = theme ? parseTheme(theme) : "dark";
                      setNewConfig({
                        ...newConfig,
                        themeConfig: selectedTheme,
                        themeValue: sysTheme,
                        accentColor
                      });
                    })
                  }
                }}
                optionsArray={["GitTaur", "Light", "Dark", "Custom", "System"]}
              />

              {newConfig.themeConfig === 'custom' &&
                <>
                  {/* Background colors */}
                  <InputField
                    title="Background #1"
                    type="color"
                    placeholder="#0f172a"
                    value={newConfig.customTheme.primaryBg}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.primaryBg = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Background #2"
                    type="color"
                    placeholder="#1e293b"
                    value={newConfig.customTheme.secondaryBg}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.secondaryBg = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Background #3"
                    type="color"
                    placeholder="#334155"
                    value={newConfig.customTheme.tertiaryBg}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.tertiaryBg = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Highlight background"
                    type="color"
                    placeholder="#475569"
                    value={newConfig.customTheme.lighterBg}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.lighterBg = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Border color"
                    type="color"
                    placeholder="#64748b"
                    value={newConfig.customTheme.borderColor}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.borderColor = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  {/* Text colors */}
                  <InputField
                    title="Primary text"
                    type="color"
                    placeholder="#d1d5db"
                    value={newConfig.customTheme.primaryText}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.primaryText = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Secondary text"
                    type="color"
                    placeholder="#868e96"
                    value={newConfig.customTheme.secondaryText}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.secondaryText = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Tertiary text"
                    type="color"
                    placeholder="#404040"
                    value={newConfig.customTheme.tertiaryText}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.tertiaryText = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />

                  <InputField
                    title="Contrast text"
                    type="color"
                    placeholder="#0f172a"
                    value={newConfig.customTheme.contrastText}
                    onChange={(value) => {
                      let newCustomTheme = { ...newConfig.customTheme };
                      newCustomTheme.contrastText = value;
                      setNewConfig({ ...newConfig, customTheme: newCustomTheme })
                    }}
                    className={styles.configInput}
                  />
                </>
              }

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
            <button className='appButton' onClick={() => applyNewConfig(newConfig)}>Apply</button>
          </div>
        </section >
      }
    </div >
  );
}

export default ConfigPage;
