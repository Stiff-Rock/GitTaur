//TODO: MAKE IT A NORMAL UTILITY
import { open } from '@tauri-apps/plugin-dialog';

export const useDialog = () => {
  const selectDirectoryDialog = async () => {
    return await open({
      directory: true,
      multiple: false,
      title: 'Select a directory',
    });
  };

  const selectFileDialog = async () => {
    return await open({
      directory: false,
      multiple: false,
      title: 'Select a file',
    });
  };

  return { selectDirectoryDialog, selectFileDialog };
};
