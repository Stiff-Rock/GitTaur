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

  const placeHolder = "No remotes aviable";

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remoteNames = Object.keys(activeRepoInfo.remotes);

    let text = placeHolder;
    if (remoteNames.length > 0) {
      text = remoteNames.includes("origin")
        ? "origin"
        : remoteNames[0];
    }

    setRemote(text);
  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handleFetchRemote = () => {
    if (!workspace) return;

    if (remote && !remote.includes(placeHolder)) {
      const repoPath = workspace.activeTab;

      const remotes: Array<string> = fetchAll ? Object.keys(activeRepoInfo!.remotes) : new Array(remote);

      invoke<string>("fetch_remote", { repoPath, remotes }).then((msg) => {
        setActiveModal("");
        setNotification(msg);
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
    <BaseModal title="Fetch Remote Changes">

      <div className={baseStyle.inputLabelContainer}>
        <span>Remote</span>
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
      </div>

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
