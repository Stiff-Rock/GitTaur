import React, { useLayoutEffect, useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import BaseModal from "../BaseModal";
import "react-widgets/styles.css";
import { AlertIcon } from '@primer/octicons-react'

const PushRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification, activeRepoInfo } = useAppContext();

  //TODO: FILL THE DEFAULT VALUES WTH THE LOCAL BRANCH, ORIGIN REMOTE AND THE REQUIVALENT BRANCH IN REMOTE OR THE FIRST AS FALLBACK
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
        remoteBranch
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
          <div className={baseStyle.inputLabelContainer}>
            <span>Remote</span>
            <select
              className={baseStyle.modalInputSection}
              onChange={(e) => setRemote(e.target.value)}
              value={remote}
            >
              {Object.keys(activeRepoInfo.remotes).map((remote) => (
                <option value={remote} key={remote}>{remote}</option>
              ))}
            </select>
          </div>

          <div className={baseStyle.inputLabelContainer}>
            <span>Local branch</span>
            <select
              className={baseStyle.modalInputSection}
              onChange={(e) => setLocalBranch(e.target.value)}
              value={remote}
            >
              {activeRepoInfo.localBranches.map((branch) => (
                <option value={localBranch} key={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div className={baseStyle.inputLabelContainer}>
            <span>Remote branch</span>
            <select
              className={baseStyle.modalInputSection}
              onChange={(e) => setRemoteBranch(e.target.value)}
              value={remote}
            >
              {remote && activeRepoInfo.remotes[remote].map((branch) => (
                <option value={remoteBranch} key={branch}>{branch}</option>
              ))}
            </select>
          </div>
        </>
      }

      <div className="checkbox">
        <input
          type="checkbox"
          id="forcePush"
          checked={forcePush}
          onChange={(e) => setForcePush(e.target.checked)}
        />
        <label htmlFor="forcePush">Force push</label> <AlertIcon size={14} />
      </div>

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handlePushRemote}>Push</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>

    </BaseModal >
  );
};

export default PushRemoteModal;
