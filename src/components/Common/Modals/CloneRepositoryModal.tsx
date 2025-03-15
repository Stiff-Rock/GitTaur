import React, { useState } from "react";
import styles from "./CloneRepositoryModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useDialog } from "../../../hooks/useDialog";
import { useAppContext } from "../../../context/AppContext";

const CloneRepositoryModal: React.FC = () => {
  const { setCloneRepoModalActive } = useAppContext();
  const { openDirectoryDialog } = useDialog();

  const [parentFolder, setParentFolder] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  const chooseParentFolder = async () => {
    const path = await openDirectoryDialog();
    if (path) {
      setParentFolder(path);
    }
  };

  const handleClone = () => {
    console.log("Parent Folder:", parentFolder);
    console.log("Repository URL:", repoUrl);
  };

  return (
    <div className='modalOverlay' onClick={() => setCloneRepoModalActive(false)}>
      <div className='modal'>
        <div className={styles.clonePathField}>
          <input
            type="text"
            placeholder="Parent directory"
            value={parentFolder}
            readOnly
          />
          <button onClick={chooseParentFolder} className="actionButton">
            <FileDirectoryIcon />
          </button>
        </div>

        <input
          type="url"
          placeholder="Repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />

        <button onClick={handleClone}>Clone repository</button>
      </div>
    </div>
  );
};

export default CloneRepositoryModal;
