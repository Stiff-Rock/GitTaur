import baseStyle from "../BaseModal.module.css";
import React, { useLayoutEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import ComboBox from "../../ComboBox/ComboBox";
import { useMainContext } from "../../../../context/MainContext";

export interface PullModalProps {
  selectedRemote?: string,
  sourceBranch?: string,
}

const PullRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo, pullModalProps, showLoadingDuringTask } = useAppContext();
  const { repoInfo } = useMainContext();
  const { selectedRemote = "", sourceBranch = "" } = pullModalProps;

  const [remoteName, setRemoteName] = useState<string>(selectedRemote);
  const [branch, setBranch] = useState<string>(sourceBranch);

  const remotePlaceHolder = "Choose a remote";
  const branchPlaceHolder = "Choose a branch";

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remote_names = Object.keys(activeRepoInfo.remotes);
    const remotes = Object.values(activeRepoInfo.remotes);

    let remoteText = remotePlaceHolder;
    if (!remoteName || remoteName.trim() === "") {
      if (remotes.length > 0) {
        remoteText = remote_names.includes('origin')
          ? "origin"
          : remote_names[0];
      }
      setRemoteName(remoteText);
    }

    if (!branch || branch.trim() === "") {
      if (!remoteText.includes(remotePlaceHolder)) {
        const availableRemoteBranches = activeRepoInfo.remotes[remoteText]?.branches || [];

        const currentBranch = repoInfo?.currentBranch || "";
        const branchExists = availableRemoteBranches.includes(currentBranch);

        const branchText = branchExists ? currentBranch :
          (availableRemoteBranches.length > 0 ? availableRemoteBranches[0] : branchPlaceHolder);

        setBranch(branchText);
      }
    }

    if (sourceBranch && activeRepoInfo.remotes[remoteText]?.branches.includes(sourceBranch)) {
      setBranch(sourceBranch);
    }
  }, [activeRepoInfo]);

  const handlePullRemote = () => {
    if (!workspace) return;

    if (branch && !branch.includes(remotePlaceHolder)) {
      const repoPath = workspace.activeTab;

      const pullPromise = invoke<string>("pull_remote", { repoPath, remoteName, branch }).then((msg) => {
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
            onItemSelected={setBranch}
            value={branch}
            optionsArray={activeRepoInfo.remotes[remoteName]?.branches ?? []}
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
