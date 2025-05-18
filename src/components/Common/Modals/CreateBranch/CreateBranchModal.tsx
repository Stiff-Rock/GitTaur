import React, { useState } from "react";
import baseStyle from "../BaseModal.module.css";
import { FileDirectoryIcon } from "@primer/octicons-react";
import { useAppContext } from "../../../../context/AppContext";
import BaseModal from "../BaseModal";
import { invoke } from "@tauri-apps/api/core";

const CreateBranchModal: React.FC = () => {
  const { setActiveModal, setNotification, openNewRepo } = useAppContext();

  const [branchName, setBranchName] = useState("");

  //TODO: LOADING INDICATOR
  const handleCreateBranch = () => {
    if (branchName) {
      invoke("create_branch", { repoPath: branchName }).then((msg) => {
        setActiveModal("");
        openNewRepo(branchName);
        setNotification(msg as string);
      }).catch((e) => {
        setNotification(e);
        console.error(e)
      });
    } else {
      setNotification("ERRRROOOOOORRRRRR")
    }
  }

  return (
    <BaseModal title="Create Branch">

      <span>BRANCH</span>

    </BaseModal>
  );
};

export default CreateBranchModal;
