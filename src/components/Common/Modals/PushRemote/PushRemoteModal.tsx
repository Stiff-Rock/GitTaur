import React, { useLayoutEffect, useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import "react-widgets/styles.css";

const PushRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo, setRepoUpdateTrigger } = useAppContext();
  const [remote, setRemote] = useState<string>("");
  const [fetchAll, setFetchAll] = useState<boolean>(false);

  const placeHolder = "Choose a remote";

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;
    setRemote(Object.keys(activeRepoInfo.remotes).includes("origin") ? "origin" : placeHolder)
  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handlePushRemote = () => {
    if (!workspace) return;

    if (remote && !remote.includes(placeHolder)) {
      const repoPath = workspace.activeTab;

      const remotes: Array<string> = fetchAll ? Object.keys(activeRepoInfo!.remotes) : new Array(remote);

      invoke<string>("push_remote", { repoPath, remotes }).then((msg) => {
        if (msg.includes("Successfully"))
          setRepoUpdateTrigger(prev => prev + 1);

        setActiveModal("");
        setNotification(msg as string);
        //TODO: MAYBE ADD release_repo call to all catch claues from here
      }).catch((e) => {
        if (e) {
          setNotification(e);
          console.error(e);
        }
      });
    } else {
      setNotification("You must select a valid remote")
    }
  }

  return (
    <BaseModal title="Create Repository">

      <select
        className={baseStyle.modalInputSection}
        disabled={fetchAll}
        onChange={(e) => setRemote(e.target.value)}
        value={remote}
      >
        {activeRepoInfo && Object.keys(activeRepoInfo.remotes).map((remote) => (
          <option value={remote} key={remote}>{remote}</option>
        ))}
      </select>

      <div className="checkbox">
        <input
          type="checkbox"
          id="fetchAllRemotes"
          checked={fetchAll}
          onChange={(e) => setFetchAll(e.target.checked)}
        />
        <label htmlFor="fetchAllRemotes">Fetch all remotes</label>
      </div>

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handlePushRemote}>Fetch</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>

    </BaseModal >
  );
};

export default PushRemoteModal;
