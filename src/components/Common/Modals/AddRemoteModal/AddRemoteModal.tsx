import baseStyle from "../BaseModal.module.css";
import { useState } from "react";
import InputField from "../../InputField/InputField";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";
import { invoke } from "@tauri-apps/api/core";

const AddRemoteModal: React.FC = () => {
  const { workspace, setActiveModal, setNotification } = useAppContext();

  const [remoteName, setRemoteName] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");

  const handleAddRemote = () => {
    if (!workspace) return;

    if (!remoteName) {
      setNotification("Please enter a name for the remote");
      return;
    }

    if (!remoteUrl) {
      setNotification("Please enter the url of the remote");
      return;
    }

    const repoPath = workspace.activeTab;

    invoke("add_remote", { repoPath, remoteName, remoteUrl })
      .then(() => { setActiveModal(""); setNotification("Remote added succesfully"); }).catch((e) => {
        const msg = `Error adding remote: ${e}`;
        console.error(msg)
        setNotification(msg);
      });
  };

  return (
    <BaseModal title="Add Remote">
      <InputField
        title="Name"
        type="text"
        placeholder="origin"
        value={remoteName}
        onChange={setRemoteName}
      />

      <InputField
        title="Url"
        type="url"
        placeholder="Http/Ssh url"
        value={remoteUrl}
        onChange={setRemoteUrl}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleAddRemote}>Add</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
}

export default AddRemoteModal;
