import baseStyle from "../BaseModal.module.css";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../../ComboBox/ComboBox";

export interface MergeBranchModalProps {
  sourceBranch: string,
}

const MergeBranchModal: React.FC = () => {
  const { setActiveModal, workspace, setNotification, mergeBranchModalProps, activeRepoInfo } = useAppContext();
  const { sourceBranch } = mergeBranchModalProps;

  const [targetBranch, setTargetBranch] = useState("");

  useLayoutEffect(() => {
    if (activeRepoInfo) {
      setTargetBranch(activeRepoInfo.localBranches[0]);
    }
  }, [activeRepoInfo]);

  const handleMergeBranch = () => {
    if (!workspace) return;

    const repoPath = workspace.activeTab;

    invoke("merge_branch", {
      repoPath,
      sourceBranch,
      targetBranch
    }).catch((e) => {
      setNotification(e);
    }).finally(() => setActiveModal(""));
  };

  return (
    <BaseModal title="Merge Branch">
      <ComboBox
        title="Target Branch"
        onItemSelected={setTargetBranch}
        value={targetBranch}
        optionsArray={activeRepoInfo?.localBranches ?? []}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleMergeBranch}>Merge</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
}

export default MergeBranchModal;
