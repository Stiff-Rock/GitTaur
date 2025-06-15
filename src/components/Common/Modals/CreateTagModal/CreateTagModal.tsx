import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";
import baseStyle from "../BaseModal.module.css";
import BaseModal from "../BaseModal";
import { useState } from "react";
import InputField from "../../InputField/InputField";
import { isValidGitName } from "../../../../utils/gitUtils";

export interface CreateTagModalProps {
  commitOid?: string,
  branchName?: string,
  isLocal?: boolean
};

const TagBranchModal: React.FC = () => {
  const { workspace, setNotification, setActiveModal, createTagModalProps, showLoadingDuringTask } = useAppContext();
  const { commitOid, branchName, isLocal } = createTagModalProps;

  const [tagName, setTagName] = useState("");
  const [tagMsg, setTagMsg] = useState("");

  const handleCreateTag = () => {
    if (!workspace) return;

    if (!tagName) {
      setNotification("Write a name for the tag");
      return
    }

    const repoPath = workspace.activeTab;

    let tagPromise;
    if (commitOid) {
      tagPromise = invoke<void>("tag_commit", { repoPath, commitOid, tagName, tagMsg });
    } else if (branchName) {
      tagPromise = invoke<void>("tag_branch_tip", { repoPath, branchName, tagName, tagMsg, isLocal });
    } else {
      console.log("No commit oid nor branch name has been provided:", commitOid, branchName);
      setNotification("Internal error during tag creation, please report this issue")
      return;
    }

    tagPromise.catch((e) => {
      setNotification(e);
    }).finally(() => setActiveModal(""));

    showLoadingDuringTask({
      title: "Creating Tag",
    }, tagPromise);
  };

  return (
    <BaseModal title="Create Tag">
      {tagName && !isValidGitName(tagName) &&
        <span className={baseStyle.errorMsg}>
          Tag name should not contain spaces,
          special characters (~^:?*[]\@),
          consecutive dots (..),
          slashes (/),
          or start with a dot.
        </span>}

      <InputField
        title="Tag Name"
        type="text"
        placeholder="tagName"
        value={tagName}
        onChange={setTagName}
        className={branchName && !isValidGitName(branchName) ? 'invalidInputData' : ''}
      />

      <InputField
        title="Tag Message"
        type="text"
        placeholder="Optional tag message"
        value={tagMsg}
        onChange={setTagMsg}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleCreateTag}>Create tag</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default TagBranchModal;
