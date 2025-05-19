import React, { useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useDialog } from "../../../../hooks/useDialog";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";
//TODO: THIS MODAL AN OTHERS, PROPERS LOADING INDICATORS AND BLOCKING
const CloneRepositoryModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo } = useAppContext();
  const { selectDirectoryDialog } = useDialog();

  const [path, setParentFolder] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const chooseParentFolder = async () => {
    const path = await selectDirectoryDialog();
    if (path) setParentFolder(path);
  };

  //TODO: LOADING SCREEN
  const handleClone = () => {
    if (!path && !repoUrl) {
      setNotification("You have to select a path and a Url");
      return;
    }

    if (!path) {
      setNotification("You have to select a path");
      return;
    }

    if (!repoUrl) {
      setNotification("You have to input a clone Url");
      return;
    }

    invoke<string>("clone_repo", { path, repoUrl })
      .then((msg) => {
        openNewRepo(path);
        setNotification(msg);
      })
      .catch((e) => {
        console.error(e);
        setNotification(e);
      })
      .finally(() => setActiveModal(""));
  };

  return (
    <BaseModal title="Clone Repository">
      <InputField
        type="text"
        placeholder="Parent directory"
        value={path}
        onChange={setParentFolder}
        buttonIcon={<FileDirectoryIcon />}
        onButtonClick={chooseParentFolder}
      />

      {/*TODO: ADD BUTTON THAT GETS YOU YOUR GITHUB REPOS TO CLONE*/}
      <InputField
        type="url"
        placeholder="Repository URL"
        value={repoUrl}
        onChange={setRepoUrl}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleClone}>Clone repository</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
};

export default CloneRepositoryModal;
