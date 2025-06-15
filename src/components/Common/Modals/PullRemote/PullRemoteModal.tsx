import baseStyle from "../BaseModal.module.css";
import React, { useLayoutEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import ComboBox from "../../ComboBox/ComboBox";
import Checkbox from "../../CheckBox/Checkbox";

export interface PullModalProps {
  selectedRemote?: string,
  sourceBranch?: string,
}

const PullRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo, pullModalProps, showLoadingDuringTask } = useAppContext();
  const { selectedRemote = "", sourceBranch = "" } = pullModalProps;

  const [remoteName, setRemoteName] = useState<string>(selectedRemote);
  const [branch, setBranch] = useState<string>(sourceBranch);
  const [pullAll, setPullAll] = useState<boolean>(true);

  const remotePlaceHolder = "Choose a remote";
  const branchPlaceHolder = "Choose a branch";

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remote_names = Object.keys(activeRepoInfo.remotes);
    const remotes = Object.values(activeRepoInfo.remotes);

    let remoteText = remotePlaceHolder;
    if (remotes.length > 0) {
      remoteText = remote_names.includes('origin')
        ? "origin"
        : remote_names[0];
    }
    setRemoteName(remoteText);

    let branchText = branchPlaceHolder;
    if (!remoteText.includes(remotePlaceHolder)) {
      branchText = activeRepoInfo.remotes[remoteText].branches[0];
    }
    setBranch(branchText)

    if (sourceBranch) {
      setBranch(sourceBranch);
      setPullAll(false);
    }
  }, [activeRepoInfo]);

  const handlePullRemote = () => {
    if (!workspace) return;

    if (branch && !branch.includes(remotePlaceHolder)) {
      const repoPath = workspace.activeTab;

      const b = pullAll ? "" : branch;

      const pullPromise = invoke<string>("pull_remote", { repoPath, remoteName, branch: b }).then((msg) => {
        setActiveModal("");
        setNotification(msg);
      }).catch((e) => {
        if (e) {
          setNotification(e);
        }
      });

      showLoadingDuringTask({
        title: "Pulling remote",
        liveFeedBack: true,
      }, pullPromise);
    } else {
      setNotification("You must select a valid remote")
    }
  }

  return (
    <BaseModal title="Pull Remote Changes">
      {activeRepoInfo ? (
        <>
          <ComboBox
            title="Remote"
            onItemSelected={setRemoteName}
            value={remoteName}
            optionsArray={Object.values(activeRepoInfo.remotes).map(r => r.name)}
          />

          <ComboBox
            title="Remote branch"
            disableCondition={pullAll}
            onItemSelected={setBranch}
            value={branch}
            optionsArray={activeRepoInfo.remotes[remoteName]?.branches ?? []}
          />

          <Checkbox
            checkedValue={pullAll}
            onChecked={setPullAll}
            label="Pull all branches"
          />
        </>
      ) : (
        <span>Failed to get active repository information, please report this issue</span>
      )}

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handlePullRemote}>Pull</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal >
  );
};

export default PullRemoteModal;
