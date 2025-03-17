import React, { useState } from "react";
import styles from "./CloneRepositoryModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useDialog } from "../../../hooks/useDialog";
import { useAppContext } from "../../../context/AppContext";

const CloneRepositoryModal: React.FC = () => {
  const { setCloneRepoModalActive, cloneRepo } = useAppContext();
  const { openDirectoryDialog } = useDialog();

  const [path, setParentFolder] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const chooseParentFolder = async () => {
    const path = await openDirectoryDialog();
    if (path) {
      setParentFolder(path);
    }
  };

  const handleClone = async () => {
    await cloneRepo(path, repoUrl);
    setCloneRepoModalActive(false);
  };

  return (
    <div className='modalOverlay' onClick={() => setCloneRepoModalActive(false)}>
      <div className={`modal ${styles.container}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.clonePathField}>
          <input
            type="text"
            placeholder="Parent directory"
            value={path}
            readOnly
          />
          <button onClick={chooseParentFolder} className={`actionButton ${styles.actionButton}`}>
            <FileDirectoryIcon />
          </button>
        </div>

        <input
          type="url"
          placeholder="Repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />

        <div className={styles.buttonsContainer}>
          <button className='appButton' onClick={handleClone}>Clone repository</button>
          <button className='appButton' onClick={() => setCloneRepoModalActive(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CloneRepositoryModal;
