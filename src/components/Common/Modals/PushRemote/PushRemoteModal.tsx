import baseStyle from "../BaseModal.module.css";
import React, { useLayoutEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import BaseModal from "../BaseModal";
import { AlertIcon } from '@primer/octicons-react'
import ComboBox from "../../ComboBox/ComboBox";
import Checkbox from "../../CheckBox/Checkbox";

const PushRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo } = useAppContext();

  const [remote, setRemote] = useState<string>("");
  const [localBranch, setLocalBranch] = useState<string>("");
  const [remoteBranch, setRemoteBranch] = useState<string>("");
  const [forcePush, setForcePush] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (!activeRepoInfo) return;

    const remotesArray = Object.keys(activeRepoInfo.remotes);

    const defaultRemote = remotesArray.includes("origin") ? "origin" : remotesArray[0];
    setRemote(defaultRemote);

    const currentBranch = activeRepoInfo.currentBranch;
    setLocalBranch(currentBranch);

    const remoteBranches = activeRepoInfo.remotes[defaultRemote];
    const remoteBranch = remoteBranches.includes(currentBranch) ? currentBranch : activeRepoInfo.remotes[remote][0];
    setRemoteBranch(remoteBranch);
  }, [activeRepoInfo]);

  //TODO: LOADING INDICATOR
  const handlePushRemote = () => {
    if (!workspace) return;

    if (remote && localBranch && remoteBranch) {
      const repoPath = workspace.activeTab;

      invoke<string>("push_remote", {
        repoPath, remote, localBranch,
        remoteBranch, forcePush
      }).then((msg) => {
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
      setNotification("You must select a valid options")
      console.error(`Invalid push args | Remote: ${remote} | lB: ${localBranch} | rB: ${remoteBranch}`);
    }
  }

  return (
    <BaseModal title="Push Changes">
      {/*TODO: LABEL INPUTS ON ALL MODALS*/}
      {activeRepoInfo &&
        <>
          <ComboBox
            title="Remote"
            onItemSelected={setRemote}
            value={remote}
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
            optionsArray={activeRepoInfo.remotes[remote] ?? []}
          />
        </>
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
