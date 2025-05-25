import { Menu } from '@tauri-apps/api/menu';

export async function setupStagedFileCM(selectedElRef: React.MutableRefObject<HTMLElement | null>) {
  let selectedEl = selectedElRef.current as HTMLElement;

  const contextMenu = await Menu.new({
    items: [
      {
        id: 'shitMyPants',
        text: 'MECAGOENTUPUTAMADRE',
        action: () => {
          console.log('MECAGOENTUPUTAMADRE pressed');
        },
      },
    ],
  });

  return contextMenu;
}
