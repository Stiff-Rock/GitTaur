import { invoke } from "@tauri-apps/api/core";
import React, { useState } from 'react';
import { useDialog } from '../../../hooks/useDialog';

const CreateRepositoryButton: React.FC = () => {
  const [resultMsg, setResultMsg] = useState("");
  const { openDirectoryDialog } = useDialog();

  async function createRepo() {
    try {
      const repoPath = await openDirectoryDialog();
      if (repoPath) {
        const msg: string = await invoke("create_repo", { repoPath });
        setResultMsg(msg);
      }
    } catch (error) {
      console.error('Error creando repositorio:', error)
    }
  }

  return (
    <div>
      <button onClick={createRepo}>Crear repositorio</button>
      {resultMsg && <p>{resultMsg}</p>}
    </div>
  );
};

export default CreateRepositoryButton;
