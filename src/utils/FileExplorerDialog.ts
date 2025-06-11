import { open } from '@tauri-apps/plugin-dialog';

export async function selectDirectoryDialog() {
  return await open({
    directory: true,
    multiple: false,
    title: 'Select a directory',
  });
};

export async function sselectFileDialog() {
  return await open({
    directory: false,
    multiple: false,
    title: 'Select a file',
  });
};
