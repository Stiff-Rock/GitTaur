import React, { useLayoutEffect, useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";
import InputField from "../../InputField/InputField";
import { selectDirectoryDialog } from "../../../../utils/FileExplorerDialog";
//TODO: THIS MODAL AN OTHERS, PROPER LOADING INDICATORS AND BLOCKING
const CloneRepositoryModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo, config } = useAppContext();

  const [path, setParentFolder] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  useLayoutEffect(() => {
    if (!config || !config.clonePath) return;
    setParentFolder(config.clonePath);
  }, [config]);

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

    invoke<[string, string]>("clone_repo", { repoPath: path, repoUrl })
      .then((payload) => {
        const [repoPath, msg] = payload;
        openNewRepo(repoPath);
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
