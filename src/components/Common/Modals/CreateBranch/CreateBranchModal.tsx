import baseStyle from "../BaseModal.module.css";
import React, { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";
import Checkbox from "../../CheckBox/Checkbox";

const CreateBranchModal: React.FC = () => {
  const { setActiveModal, setNotification, workspace } = useAppContext();


  const [branchName, setBranchName] = useState("");
  const [checkout, setCheckout] = useState(true);

  //TODO: LOADING INDICATOR
  const handleCreateBranch = () => {
    if (!workspace) return;
    if (!branchName) { setNotification("Please enter a branch name"); return; }
    const repoPath = workspace.activeTab;

    invoke<string>("create_branch", { repoPath, branchName, checkout }).then((msg) => {
      setNotification(msg);
    }).catch((e) => {
      setNotification(e);
      console.error(e)
    }).finally(() => setActiveModal(""));

  }

  return (
    <BaseModal title="Create Branch">
      <InputField
        title="Branch name"
        type="text"
        placeholder="feature-branch"
        value={branchName}
        onChange={setBranchName}
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
