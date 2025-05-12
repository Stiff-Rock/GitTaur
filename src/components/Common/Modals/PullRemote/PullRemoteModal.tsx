import React, { useLayoutEffect, useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import "react-widgets/styles.css";

const PullRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo, setRepoUpdateTrigger } = useAppContext();
  const [remoteName, setRemote] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [pullAll, setPullAll] = useState<boolean>(true);

  const remotePlaceHolder = "Choose a remote";
  const branchPlaceHolder = "Choose a branch";

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remoteNames = Object.keys(activeRepoInfo.remotes);
    let remoteText = remotePlaceHolder;
    if (remoteNames.length > 0) {
      remoteText = remoteNames.includes("origin")
        ? "origin"
        : remoteNames[0];
    }
    setRemote(remoteText);

    let branchText = branchPlaceHolder;
    if (!remoteText.includes(remotePlaceHolder)) {
      branchText = activeRepoInfo.remotes[remoteText][0]
    }
    setBranch(branchText)
  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handlePullRemote = () => {
    if (!workspace) return;

    if (branch && !branch.includes(remotePlaceHolder)) {
      const repoPath = workspace.activeTab;

      const branches: Array<string> = pullAll ? activeRepoInfo!.remotes[remoteName] : new Array(branch);

      invoke<string>("pull_remote", { repoPath, remoteName, branches }).then((msg) => {
        if (msg.includes("Successfully"))
          setRepoUpdateTrigger(prev => prev + 1);

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
    <BaseModal title="Pull Remote Changes">
      <select
        className={baseStyle.modalInputSection}
        onChange={(e) => setRemote(e.target.value)}
        value={remoteName}
      >
        {activeRepoInfo && Object.keys(activeRepoInfo.remotes).map((remote) => (
          <option value={remote} key={remote}>{remote}</option>
        ))}
      </select>

      <select
        className={baseStyle.modalInputSection}
        disabled={pullAll}
        onChange={(e) => setBranch(e.target.value)}
        value={branch}
      >
        {remoteName && activeRepoInfo && activeRepoInfo.remotes[remoteName].map((branch) => (
          <option value={branch} key={branch}>{branch}</option>
        ))}
      </select>

      <div className="checkbox">
        <input
          type="checkbox"
          id="pullAllBranches"
          checked={pullAll}
          onChange={(e) => setPullAll(e.target.checked)}
        />
        <label htmlFor="pullAllBranches">Pull all branches</label>
      </div>

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handlePullRemote}>Pull</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>

    </BaseModal >
  );
};

export default PullRemoteModal;
