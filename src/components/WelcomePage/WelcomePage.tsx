import styles from './WelcomePage.module.css';
import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import CloneRepositoryModal from '../Common/Modals/CloneRepo/CloneRepositoryModal';
import CreateRepositoryModal from '../Common/Modals/CreateRepo/CreateRepositoryModal';
import ScrollBar from '../Common/ScrollBar/ScrollBar';
import { Menu, MenuItemOptions } from '@tauri-apps/api/menu';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';

function WelcomePage() {
  const {
    activeModal,
    setActiveModal,
    workspace,
    setWorkspace,
    setActiveRepoInfo,
    setActiveRepoHistory,
    isType,
    openContextMenu,
    setNotification,
    openConfirmationModal,
    openNewRepo
  } = useAppContext();

  useEffect(() => {
    if (!isType("Repo")) {
      setActiveRepoInfo(null);
      setActiveRepoHistory(null);
    }
  }, []);

  const handleOpenContextMenu = async (event: React.MouseEvent, repoPath: string, repoName: string) => {
    event.preventDefault();

    if (!workspace) {
      console.warn("Error opening context menu: Unexpected null workspace");
      setNotification("An internal error has occurred, please report this issue");
      return;
    }

    const menuItems: MenuItemOptions[] = [];

    menuItems.push({
      id: "openRepo",
      text: "Open repository",
      action: () => {
        openNewRepo(repoPath);
      },
    })

    menuItems.push({
      id: "openRepoDir",
      text: "Open in file explorer",
      action: () => {
        openPath(repoPath).catch((e) => {
          setNotification(e);
        })
      },
    })

    menuItems.push({
      id: "openInTerminal",
      text: "Open in terminal",
      action: () => {
        invoke("open_terminal", { path: repoPath }).catch((e) => {
          setNotification(e);
        });
      },
    })

    menuItems.push({
      id: "copyPath",
      text: "Copy Path",
      action: () => {
        navigator.clipboard.writeText(repoPath).catch(e => {
          setNotification(`Falied to copy path: ${e}`);
        });
      },
    })

    menuItems.push({
      id: "deleteRepo",
      text: "Delete",
      action: () => {
        openConfirmationModal({
          onConfirmed: () => {
            setWorkspace(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                recentRepos: prev.recentRepos.filter(repo => repo !== repoPath)
              };
            });
            setActiveModal("");
          },
          title: "Delete recent repository",
          subTitle: "Target: " + repoName,
        });
      },
    })

    openContextMenu(await Menu.new({ items: menuItems }), event);
  };

  return (
    <div className={`${styles.main} ${isType("Welcome") || !workspace ? '' : 'inactive'}`}>
      <div className={styles.subContainer}>
        <span className={styles.title}>Let's start working</span>
        <ScrollBar containerHeight={100} autoHide={true} offset={5}>
          <div className={styles.history}>
            {workspace && workspace.recentRepos && workspace.recentRepos.length > 0 ? (
              workspace.recentRepos.map((repoPath, index) => {
                const parts = repoPath.replaceAll("\\", "/").split("/");
                const repoName = parts[parts.length - 1];

                return (
                  <div
                    key={index}
                    className={styles.repoItem}
                    onClick={() => openNewRepo(repoPath)}
                    onContextMenu={(e) => handleOpenContextMenu(e, repoPath, repoName)}
                  >
                    <span>{repoName}</span>
                    <span className={styles.path}>{repoPath}</span>
                  </div>
                );
              })
            ) : (
              <span className={styles.noneFoundMsg}>No recently opened repositories found</span>
            )}
          </div>
        </ScrollBar>
      </div >

      {activeModal === "createRepo" && <CreateRepositoryModal />
      }
      {activeModal === "cloneRepo" && <CloneRepositoryModal />}
    </div >
  );
}

export default WelcomePage;
