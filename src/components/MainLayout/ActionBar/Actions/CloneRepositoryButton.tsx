import { invoke } from "@tauri-apps/api/core";
import React, { useState } from 'react';
import { useDialog } from '../hooks/useDialog';

const ButtonCloneRepository: React.FC = () => {
  const [inputUrl, setInputUrl] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const { openDirectoryDialog } = useDialog();

  async function cloneRepo() {
    try {
      const path = await openDirectoryDialog();
      if (path) {
        const msg: string = await invoke("clone_repository", { path, repoUrl: inputUrl });
        setResultMsg(msg);
      }
    } catch (error) {
      console.error('Error clonando repositorio:', error)
    }
  }

  return (
    <div>
      <button onClick={cloneRepo}>Clonar repositorio</button>
      {resultMsg && <p>{resultMsg}</p>}
      <input type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="Url del repositorio..." ></input>
    </div >
  );
};

export default ButtonCloneRepository;
