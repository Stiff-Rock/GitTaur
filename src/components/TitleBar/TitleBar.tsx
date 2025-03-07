import { listen } from '@tauri-apps/api/event';
import styles from "./TitleBar.module.css";
import { GoCodespaces, GoPlus } from "react-icons/go";
import { invoke } from '@tauri-apps/api/core';
import type { RepoInfo } from '../../types/repoInfo';
import { useAppContext } from '../../context/AppContext';
import WindowTabs from './WindowTabs/WindowTabs';
import WindowControls from './WindowControls/WindowControls';

const TitleBar: React.FC = () => {
  const { setRepoInfo } = useAppContext();

  async function openDefault() {
    const unlisten = await listen<RepoInfo>('repo-info', (event) => {
      setRepoInfo(event.payload);
      unlisten();
    });

    const path = "C:\\Users\\Yago\\Desktop\\PlateaApp";
    const msg: string = await invoke("open_repository", { path });
    console.log(msg);
  }

  return (
    <div className={`${styles.titleBar}`}>
      <div className={`${styles.windowTabs}`}>
        <GoCodespaces className={`${styles.workspaceIcon}`} />
        <WindowTabs />
        <GoPlus onClick={() => openDefault()} className={`${styles.workspaceIcon}`} />
      </div>

      <WindowControls />
    </div >
  );
};

export default TitleBar;
