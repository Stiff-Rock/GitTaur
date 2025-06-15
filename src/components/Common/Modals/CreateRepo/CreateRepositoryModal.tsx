import React, { useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";
import { selectDirectoryDialog } from "../../../../utils/FileExplorerDialog";

const CreateRepositoryModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo, showLoadingDuringTask } = useAppContext();

  const [path, setParentFolder] = useState("");

  const chooseParentFolder = async () => {
    const path = await selectDirectoryDialog();
    if (path) setParentFolder(path);
  };

  const handleCreateRepo = () => {
    if (path) {
      const createRepoPromise = invoke("create_repo", { repoPath: path }).then((msg) => {
        setActiveModal("");
        openNewRepo(path);
        setNotification(msg as string);
      }).catch((e) => {
        setNotification(e);
      });


      showLoadingDuringTask({
        title: "Creating repository",
      }, createRepoPromise);
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
