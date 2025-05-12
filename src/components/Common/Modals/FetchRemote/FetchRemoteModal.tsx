import React, { useLayoutEffect, useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import "react-widgets/styles.css";

const FetchRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo } = useAppContext();
  const [remote, setRemote] = useState<string>("");
  const [fetchAll, setFetchAll] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;
    setRemote(Object.keys(activeRepoInfo.remotes).includes("origin") ? "origin" : "Choose a remote")
  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handleFetchRemote = () => {
    if (!workspace) return;

    if (remote) {
      const repo_path = workspace.activeTab;

      invoke("fetch_remote", { repo_path, remote: remote, fetch_all: fetchAll }).then((msg) => {
        setActiveModal("");
        setNotification(msg as string);
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
          <option value={remote} id={remote}>{remote}</option>
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
        <button className='appButton' onClick={handleFetchRemote}>Fetch</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>

    </BaseModal >
  );
};

export default FetchRemoteModal;
