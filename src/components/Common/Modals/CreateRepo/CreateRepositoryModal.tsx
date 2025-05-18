import React, { useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { useDialog } from "../../../../hooks/useDialog";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";

const CreateRepositoryModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo } = useAppContext();
  const { selectDirectoryDialog } = useDialog();

  const [path, setParentFolder] = useState("");

  const chooseParentFolder = async () => {
    const path = await selectDirectoryDialog();
    if (path) setParentFolder(path);
  };

  //TODO: LOADING INDICATOR
  const handleCreateRepo = () => {
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
      <InputField
        type="text"
        placeholder="Parent directory"
        value={path}
        onChange={setParentFolder}
        buttonIcon={<FileDirectoryIcon />}
        onButtonClick={chooseParentFolder}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleCreateRepo}>Create repository</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default CreateRepositoryModal;
