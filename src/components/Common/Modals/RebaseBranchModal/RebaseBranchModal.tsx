import baseStyle from "../BaseModal.module.css";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import { useLayoutEffect, useState } from "react";
import ComboBox from "../../ComboBox/ComboBox";

export interface RebaseBranchModalProps {
  sourceBranch: string,
}

const RebaseBranchModal: React.FC = () => {
  const { setActiveModal, workspace, setNotification, rebaseBranchModalProps, activeRepoInfo } = useAppContext();
  const { sourceBranch } = rebaseBranchModalProps;

  const [targetBranch, setTargetBranch] = useState("");

  useLayoutEffect(() => {
    if (activeRepoInfo) {
      setTargetBranch(activeRepoInfo.localBranches[0]);
    }
  }, [activeRepoInfo]);

  const handleRebaseBranch = () => {
    if (!workspace) return;

    const repoPath = workspace.activeTab;

    invoke("rebase_branch", {
      repoPath,
      sourceBranch,
      targetBranch
    }).catch((e) => {
      console.error(e);
      setNotification(e);
    }).finally(() => setActiveModal(""));
  };

  return (
    <BaseModal title="Rebase branch">
      <ComboBox
        title="Target Branch"
        onItemSelected={setTargetBranch}
        value={targetBranch}
        optionsArray={activeRepoInfo?.localBranches ?? []}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleRebaseBranch}>Rebase</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default RebaseBranchModal;
