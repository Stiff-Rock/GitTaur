import { invoke } from "@tauri-apps/api/core";
import React, { useState } from 'react';
import { useDialog } from '../hooks/useDialog';

const ButtonOpenRepository: React.FC = () => {

  const [resultMsg, setResultMsg] = useState("");
  const { openDirectoryDialog } = useDialog();

  async function openRepo() {
    try {
      const path = await openDirectoryDialog();
      if (path) {
        const msg: string = await invoke("open_repository", { path });
        setResultMsg(msg);
      }
    } catch (error) {
      console.error('Error abriendo repositorio:', error)
    }
  }

  return (
    <div>
      <button onClick={openRepo}>Abrir repositorio</button>

      {resultMsg && <p>Repositorio abierto: {resultMsg}</p>}
    </div>
  );
};

export default ButtonOpenRepository;
