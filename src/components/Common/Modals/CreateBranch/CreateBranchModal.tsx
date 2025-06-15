import baseStyle from "../BaseModal.module.css";
import React, { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";
import Checkbox from "../../CheckBox/Checkbox";
import { isValidGitName } from "../../../../utils/gitUtils";

const CreateBranchModal: React.FC = () => {
  const { setActiveModal, setNotification, workspace } = useAppContext();

  const [branchName, setBranchName] = useState("");
  const [checkout, setCheckout] = useState(true);

  const handleCreateBranch = () => {
    if (!workspace) return;
    if (!branchName) { setNotification("Please enter a branch name"); return; }
    const repoPath = workspace.activeTab;

    invoke<string>("create_branch", { repoPath, branchName, checkout }).then((msg) => {
      setNotification(msg);
    }).catch((e) => {
      setNotification(e);
    }).finally(() => setActiveModal(""));
  }

  return (
    <BaseModal title="Create Branch">
      {branchName && !isValidGitName(branchName) &&
        <span className={baseStyle.errorMsg}>
          Branch name should not contain spaces,
          special characters (~^:?*[]\@),
          consecutive dots (..), or end with a slash.
        </span>}

      <InputField
        title="Branch name"
        type="text"
        placeholder="feature-branch"
        value={branchName}
        onChange={setBranchName}
        className={branchName && !isValidGitName(branchName) ? 'invalidInputData' : ''}
      />

      <Checkbox
        checkedValue={checkout}
        onChecked={setCheckout}
        label="Checkout"
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleCreateBranch}>Create branch</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default CreateBranchModal;
