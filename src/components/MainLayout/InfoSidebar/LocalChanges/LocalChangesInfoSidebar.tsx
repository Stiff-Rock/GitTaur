import { useEffect, useState } from "react";
import { useMainContext } from "../../../../context/MainContext";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";

interface LocalChangesInfoSidebarProps {
  repoPath: string;
}

const LocalChangesInfoSidebar: React.FC<LocalChangesInfoSidebarProps> = (props) => {
  const { repoPath } = props; //TODO: PASS THIS
  const { setNotification } = useAppContext();
  const { currentAppTab } = useMainContext();

  const [unstagedFiles, setUnstagedFiles] = useState<FileChanges[] | null>(null);

  useEffect(() => {
    invoke<FileChanges[]>("get_unstaged_files", { repoPath }).then((changes) => {
      setUnstagedFiles(changes);
    }).catch((e) => { console.error(e); setNotification(e); })
  }, []);

  return (
    <div className={`${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      LOCAL CHANGES INFO SIDEBAR

      {unstagedFiles && unstagedFiles.map((changes, index) => (
        <div key={index} style={{ display: "flex", alignContent: "center", justifyContent: "center" }}>
          <span>{changes.changeType === "added" ? "+" : changes.changeType === "deleted" ? "-" : "="}</span>
          <span>{changes.file}</span>
        </div>
      ))
      }
    </div>
  );
};

export default LocalChangesInfoSidebar;
