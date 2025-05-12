import React, { useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { useDialog } from "../../../../hooks/useDialog";
import { invoke } from "@tauri-apps/api/core";

const CreateBranchModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo } = useAppContext();
  const { openDirectoryDialog } = useDialog();

  const [path, setParentFolder] = useState("");

  const chooseParentFolder = async () => {
    const path = await openDirectoryDialog();
    if (path) setParentFolder(path);
  };

  //TODO: LOADING INDICATOR
  const handleCreateBranch = () => {
    if (path) {
      invoke("create_repo", { repoPath: path }).then((msg) => {
        setActiveModal("");
        openNewRepo(path);
        setNotification(msg as string);
      }).catch((e) => {
        setNotification(e);
        console.error(e)
      });
    } else {
      setNotification("A directory path is needed")
    }
  }

  return (
    <BaseModal title="Create Repository">

      <div className={baseStyle.modalInputSection}>
        <input
          type="text"
          placeholder="Parent directory"
          value={path}
          onChange={(e) => setParentFolder(e.target.value)}
        />
        <button onClick={chooseParentFolder} className={`actionButton ${baseStyle.actionButton}`}>
          <FileDirectoryIcon />
        </button>
      </div>

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleCreateBranch}>Create repository</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>

    </BaseModal>
  );
};

export default CreateBranchModal;
