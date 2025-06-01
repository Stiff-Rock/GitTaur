import baseStyle from "../BaseModal.module.css";
import InputField from "../../InputField/InputField";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface RenameBranchModalProps {
  oldBranchName: string,
};

const RenameBranchModal: React.FC = () => {
  const { setActiveModal, renameBranchModalProps, setNotification, workspace } = useAppContext();
  const { oldBranchName } = renameBranchModalProps;

  const [newBranchName, setNewBranchName] = useState(oldBranchName);

  const handleRenameBranch = () => {
    if (!workspace) return;
    const repoPath = workspace.activeTab;

    invoke("rename_branch", { repoPath, oldBranchName, newBranchName }).catch((e) => {
      console.error(e);
      setNotification(e);
    }).finally(() => setActiveModal(""));
  };

  return (
    <BaseModal title="Rename Branch">
      <InputField
        title="Branch name"
        type="text"
        placeholder="new-name"
        value={newBranchName}
        onChange={setNewBranchName}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleRenameBranch}>Rename</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default RenameBranchModal;
