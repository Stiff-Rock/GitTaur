import { open } from '@tauri-apps/plugin-dialog';

export const useDialog = () => {
  const openDirectoryDialog = async () => {
    return await open({
      directory: true,
      multiple: false,
      title: 'Selecciona un directorio',
    });
  };

  return { openDirectoryDialog };
};
