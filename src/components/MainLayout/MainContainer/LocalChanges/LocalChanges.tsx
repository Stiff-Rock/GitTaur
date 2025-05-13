import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import styles from './LocalChanges.module.css';
import FileChangeItem from "../../../Common/FileChangeItem/FileChangeItem";
import { listen } from "@tauri-apps/api/event";
import { useMainContext } from "../../../../context/MainContext";

interface LocalChangesProps {
  repoPath: string;
}

const LocalChanges: React.FC<LocalChangesProps> = ({ repoPath }) => {
  const { currentAppTab, repoInfo } = useMainContext();
  const { setNotification } = useAppContext();

  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);

  //TODO: DELETE ON RELEASE
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!repoInfo || hasLoaded.current) return;
    hasLoaded.current = true;

    invoke("watch_git_status", { repoPath })
      .catch(e => console.error("Error starting git watcher:", e));

    const unlistenPromise = listen<string>("git-status-changed", (event) => {
      if (event.payload === repoPath) {
        invoke<RepoStatus>("get_repo_status", { repoPath })
          .then(setRepoStatus)
          .catch(e => setNotification(e));
      }
    });

    invoke<RepoStatus>("get_repo_status", { repoPath })
      .then(setRepoStatus)
      .catch((e) => { console.error(e); setNotification(e); })

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [repoInfo]);

  return (
    <div className={`${styles.localChangesContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div className={styles.section}>
        {repoStatus && repoStatus.unstagedFiles.map((changes, index) => (
          <FileChangeItem key={index} fileName={changes.file} changeType={changes.changeType} />
        ))}
      </div>

      <div className={styles.section}>
        {repoStatus && repoStatus.stagedFiles.map((changes, index) => (
          <FileChangeItem key={index} fileName={changes.file} changeType={changes.changeType} />
        ))}
      </div>
    </div >
  );
};

export default LocalChanges;
