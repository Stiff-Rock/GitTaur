import baseStyle from "../BaseModal.module.css";
import React, { useLayoutEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import BaseModal from "../BaseModal";
import { AlertIcon } from '@primer/octicons-react'
import ComboBox from "../../ComboBox/ComboBox";
import Checkbox from "../../CheckBox/Checkbox";

export interface PushModalProps {
  seletedLocalBranch?: string,
};

const PushRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo, pushModalProps } = useAppContext();
  const { seletedLocalBranch = "" } = pushModalProps;

  const [remoteName, setRemoteName] = useState<string>("");
  const [localBranch, setLocalBranch] = useState<string>(seletedLocalBranch);
  const [remoteBranch, setRemoteBranch] = useState<string>("");
  const [forcePush, setForcePush] = useState<boolean>(false);

  const [remoteBranches, setRemoteBranches] = useState<string[]>();

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remotesNames = Object.keys(activeRepoInfo.remotes);

    if (remotesNames.length <= 0) {
      setNotification("No remotes found for this repository");
      setActiveModal("");
      return;
    }

    const remotesArray = Object.values(activeRepoInfo.remotes);

    const defaultRemote = remotesNames.includes("origin") ? "origin" : remotesArray[0].name;
    setRemoteName(defaultRemote);

    const currentBranch = activeRepoInfo.currentBranch;
    setLocalBranch(currentBranch);

    const rbs = activeRepoInfo.remotes[defaultRemote].branches;
    if (!rbs.includes(currentBranch) && !rbs.includes(currentBranch + " (NEW)")) {
      const newUpstream = currentBranch + " (NEW)";
      rbs.push(newUpstream)
      setRemoteBranch(newUpstream);
    } else if (rbs.includes(currentBranch + " (NEW)")) {
      setRemoteBranch(currentBranch + " (NEW)");
    } else {
      setRemoteBranch(currentBranch);
    }
    setRemoteBranches(rbs);

  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handlePushRemote = () => {
    if (!workspace) return;

    if (remoteName && localBranch && remoteBranch) {
      let rb = remoteBranch;
      if (rb.endsWith(" (NEW)")) {
        rb = rb.trim();
        rb = rb.slice(0, -6);
      }
      const repoPath = workspace.activeTab;

      invoke<string>("push_remote", {
        repoPath, remoteName, localBranch,
        remoteBranch: rb, forcePush
      }).then((msg) => {
        setNotification(msg as string);
      }).catch((e) => {
        if (e) {
          setNotification(e);
          console.error(e);
        }
      }).finally(() => setActiveModal(""));
    } else {
      setNotification("You must select a valid options")
      console.error(`Invalid push args | Remote: ${remoteName} | lB: ${localBranch} | rB: ${remoteBranch}`);
    }
  }

  return (
    <BaseModal title="Push Changes">
      {activeRepoInfo ? (
        <>
          <ComboBox
            title="Remote"
            onItemSelected={setRemoteName}
            value={remoteName}
            optionsArray={Object.keys(activeRepoInfo.remotes ?? {})}
          />

          <ComboBox
            title="Local branch"
            onItemSelected={setLocalBranch}
            value={localBranch}
            optionsArray={activeRepoInfo.localBranches ?? []}
          />

          <ComboBox
            title="Remote branch"
            onItemSelected={setRemoteBranch}
            value={remoteBranch}
            optionsArray={remoteBranches ?? []}
          />
        </>
      ) : (
        <span>Failed to get active repository information, please report this issue</span>
      )
      }

      <Checkbox
        checkedValue={forcePush}
        onChecked={setForcePush}
        label="Force push"
        checkboxIcon={<AlertIcon size={14} />}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handlePushRemote}>Push</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal >
  );
};

export default PushRemoteModal;
