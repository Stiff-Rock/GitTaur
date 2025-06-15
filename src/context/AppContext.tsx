import { createContext, useState, useContext, useEffect, useLayoutEffect, Dispatch, SetStateAction, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { dtoToWorkspace, workspaceToDto } from '../utils/workspaceUtils';
import { Menu } from '@tauri-apps/api/menu';
import { getCurrentWindow, PhysicalPosition, Window } from '@tauri-apps/api/window';
import { ConfirmationModalProps } from '../components/Common/Modals/ConfirmationModal/ConfirmationModal';
import { RenameBranchModalProps } from '../components/Common/Modals/RenameBranchModal/RenameBranchModal';
import { CreateTagModalProps as CreateTagModalProps } from '../components/Common/Modals/CreateTagModal/CreateTagModal';
import { PushModalProps } from '../components/Common/Modals/PushRemote/PushRemoteModal';
import { RebaseBranchModalProps } from '../components/Common/Modals/RebaseBranchModal/RebaseBranchModal';
import { MergeBranchModalProps } from '../components/Common/Modals/MergeBranchModal/MergeBranchModal';
import { PullModalProps } from '../components/Common/Modals/PullRemote/PullRemoteModal';
import { selectDirectoryDialog } from '../utils/FileExplorerDialog';
import { LoadingIndicatorProps } from '../components/Common/Modals/LoadingIndicator/LoadingIndicator';
import { listen } from '@tauri-apps/api/event';

interface AppContextType {
  // State 
  workspace: Workspace | null;
  config: Configuration | null;
  newConfig: Configuration | null;

  activeModal: AppModals;
  notification: string;

  activeRepoInfo: RepoInfo | null;
  activeRepoHistory: Commit[] | undefined | null;

  // Setters 
  setWorkspace: Dispatch<SetStateAction<Workspace | null>>;
  setConfig: Dispatch<SetStateAction<Configuration | null>>;
  setNewConfig: Dispatch<SetStateAction<Configuration | null>>;

  setActiveModal: Dispatch<SetStateAction<AppModals>>;
  setNotification: Dispatch<SetStateAction<string>>;

  setActiveRepoInfo: Dispatch<SetStateAction<RepoInfo | null>>;
  setActiveRepoHistory: Dispatch<SetStateAction<Commit[] | undefined | null>>;

  // Global Functions
  openContextMenu: (menu: Menu, event: React.MouseEvent) => void;
  openNewRepo: (path: string) => void;
  setActiveTab: (tabId: string) => void;
  closeWorkspaceTab: (tabKey: string) => void;
  openWelcomePage: () => void;
  openConfigPage: () => void;
  isType: (desiredType: "Config" | "Welcome" | "Repo", tabKey?: string) => boolean;

  // Modal states and functions
  confirmationModalProps: ConfirmationModalProps;
  openConfirmationModal: (props: ConfirmationModalProps) => void;

  renameBranchModalProps: RenameBranchModalProps;
  openRenameBranchModal: (props: RenameBranchModalProps) => void;

  createTagModalProps: CreateTagModalProps;
  openCreateTagModal: (props: CreateTagModalProps) => void;

  pushModalProps: PushModalProps;
  openPushModal: (props: PushModalProps) => void;

  pullModalProps: PullModalProps;
  openPullModal: (props: PullModalProps) => void;

  mergeBranchModalProps: MergeBranchModalProps;
  openMergeBranchModal: (props: MergeBranchModalProps) => void;

  rebaseBranchModalProps: RebaseBranchModalProps;
  openRebaseBranchModal: (props: RebaseBranchModalProps) => void;

  loadingIndicatorProps: LoadingIndicatorProps;
  showLoadingIndicator: boolean;
  setShowLoadingIndicator: Dispatch<SetStateAction<boolean>>;
  showLoadingDuringTask: (props: LoadingIndicatorProps, promise: Promise<void>) => void
  updateLiveFeedback: (text: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined);

let initWorkspace: Workspace | null = null;
let initConfig: Configuration | null = null;
(() => {
  if (window.__WORKSPACE_DTO__)
    initWorkspace = dtoToWorkspace(window.__WORKSPACE_DTO__);

  if (window.__APP_CONFIG__)
    initConfig = window.__APP_CONFIG__;
})();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mainWindow, setMainWindow] = useState<Window | null>(null);

  const [workspace, setWorkspace] = useState<Workspace | null>(initWorkspace);

  const [config, setConfig] = useState<Configuration | null>(initConfig);
  const [newConfig, setNewConfig] = useState<Configuration | null>(null);

  const [activeModal, setActiveModal] = useState<AppModals>("");
  const [notification, setNotification] = useState("");

  const [activeRepoInfo, setActiveRepoInfo] = useState<RepoInfo | null>(null);
  const [activeRepoHistory, setActiveRepoHistory] = useState<Commit[] | undefined | null>(undefined);

  const [confirmationModalProps, setConfirmationModalProps] = useState<ConfirmationModalProps>({
    title: "",
    subTitle: "",
    warning: "",
    onConfirmed: () => { },
  });
  const openConfirmationModal = (props: ConfirmationModalProps) => {
    setConfirmationModalProps(props);
    setActiveModal("confirmation");
  };

  const [renameBranchModalProps, setRenameBranchModalProps] = useState<RenameBranchModalProps>({
    oldBranchName: "",
  });
  const openRenameBranchModal = (props: RenameBranchModalProps) => {
    setRenameBranchModalProps(props);
    setActiveModal("renameBranch");
  };

  const [createTagModalProps, setCreateTagModalProps] = useState<CreateTagModalProps>({
    commitOid: "",
    branchName: "",
  });
  const openCreateTagModal = (props: CreateTagModalProps) => {
    setCreateTagModalProps(props);
    setActiveModal("createTag");
  };

  const [pushModalProps, setPushModalProps] = useState<PushModalProps>({
    seletedLocalBranch: "",
  });
  const openPushModal = (props: PushModalProps) => {
    setPushModalProps(props);
    setActiveModal("push");
  };

  const [pullModalProps, setPullModalProps] = useState<PullModalProps>({
    selectedRemote: "",
    sourceBranch: "",
  })
  const openPullModal = (props: PullModalProps) => {
    setPullModalProps(props);
    setActiveModal("pull");
  };

  const [mergeBranchModalProps, setMergeBranchModalProps] = useState<MergeBranchModalProps>({
    sourceBranch: "",
  });
  const openMergeBranchModal = (props: MergeBranchModalProps) => {
    setMergeBranchModalProps(props);
    setActiveModal("merge");
  };

  const [rebaseBranchModalProps, setRebaseBranchProps] = useState<RebaseBranchModalProps>({
    sourceBranch: "",
  });
  const openRebaseBranchModal = (props: RebaseBranchModalProps) => {
    setRebaseBranchProps(props);
    setActiveModal("rebase");
  };

  useLayoutEffect(() => {
    setMainWindow(getCurrentWindow());
  }, []);

  useLayoutEffect(() => {
    // If theres already a workspace loaded, do not make api call
    if (!initWorkspace) {
      invoke<WorkspaceDTO>("get_workspace")
        .then((dto) => setWorkspace(dtoToWorkspace(dto)))
        .catch((e) => setNotification(e));
    }

    if (!initConfig) {
      invoke<Configuration>("get_config")
        .then(setConfig)
        .catch((e) => setNotification(e));
    }
  }, []);

  const openContextMenu = (menu: Menu, event: React.MouseEvent) => {
    event.preventDefault();
    if (!mainWindow) return;

    const position = new PhysicalPosition(event.clientX, event.clientY);
    menu.popup(position, mainWindow);
  }

  const isType = (desiredType: "Config" | "Welcome" | "Repo", tabKey?: string) => {
    if (!workspace) return false;

    if (!tabKey) tabKey = workspace.activeTab;

    if (tabKey === "ConfigPage") {
      return desiredType === "Config";
    } else if (/^Welcome Page:\d+$/.test(tabKey)) {
      return desiredType === "Welcome";
    } else {
      return desiredType === "Repo";
    }
  }

  useEffect(() => {
    if (!workspace) return;

    if (workspace.tabs.size <= 0) {
      openWelcomePage();
    } else if (workspace.activeTab === "" || !workspace.tabs.has(workspace.activeTab)) {
      console.warn(`Found not valid active tab ${workspace.activeTab}. Attempting fallback...`)
      const fallbackTab = [...workspace.tabs][workspace.tabs.size - 1][0]
      setActiveTab(fallbackTab);
    }

    const workspaceDto = workspaceToDto(workspace);

    invoke<Workspace>("save_workspace", { workspaceDto })
      .catch((e) => console.error(e));
  }, [workspace]);

  useLayoutEffect(() => {
    if (!config) return;

    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (config.themeValue !== currentTheme) {
      let theme: string;
      if (config.themeValue === "system") {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        theme = config.themeValue;
      }
      document.documentElement.setAttribute('data-theme', theme);
    }

    const currentAccentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--active-color').trim();
    if (config.accentColor !== currentAccentColor)
      document.documentElement.style.setProperty('--active-color', config.accentColor);

    invoke("save_config", { newConfig: config })
      .catch((e) => console.error(e));
  }, [config]);

  const setActiveTab = (tabKey: string) => {
    isType("Config", tabKey);
    setWorkspace(prev => {
      if (!prev) return prev;
      return { ...prev, activeTab: tabKey };
    });
  };

  const openNewRepo = async (path: string = "") => {
    if (!workspace) return;

    const repoPath = path || await selectDirectoryDialog();
    if (!repoPath) return;

    // If already present in worksapce, just show that tab (early return)
    if (workspace.tabs.has(repoPath)) {
      setActiveTab(repoPath);
      return;
    }

    try {
      const result = await invoke<string>("open_repo", { repoPath });
      setNotification(result);
    } catch (e) {
      const error = e as string;
      setNotification(error);
      return;
    }

    const split = repoPath.replace(/\\/g, '/').split("/");
    const label = split[split.length - 1];
    const newTab: Tab = { label, repoPath }
    openWorkspaceTab(repoPath, newTab);
  }

  const closeWorkspaceTab = (tabKey: string, updatedConfig = newConfig) => {
    if (!workspace) return;

    const tabs = new Map<string, Tab>(workspace.tabs);

    // If it is the only tab and it's a welcome page, don't close it
    if (tabs.size === 1 && isType("Welcome", tabKey)) return;

    if (isType("Config", tabKey) && config !== updatedConfig) {
      console.warn("CONFIG NOT CLOSE")
      openConfirmationModal({
        onConfirmed: () => {
          setActiveModal("");
          setNewConfig(config);
          closeWorkspaceTab(tabKey, config);
        },
        title: "Discard Changes?",
        subTitle: "You have unsaved changes. Close without saving?"
      })
      return;
    }

    if (isType("Repo", tabKey)) {
      invoke("stop_git_watcher", { repoPath: tabKey }).catch((e) => {
        setNotification(e);
      });
    }

    // Gets the position that tab was in before removing it
    const removedTabIndex = [...tabs.keys()].indexOf(tabKey);
    if (removedTabIndex === -1) {
      console.error("Error: Could not find tab on workspace (returned -1): " + tabKey)
      return;
    }

    // Removes the closed tab from the workspace
    tabs.delete(tabKey);

    // Checks whether there is any other tab opened and activates that instead, if not, goes to welcome page
    let activeTab = workspace.activeTab;
    if (tabKey === activeTab) {
      if (tabs.size > 0) {
        if (removedTabIndex < tabs.size) {
          activeTab = [...tabs.keys()][removedTabIndex];
        }
        else {
          activeTab = [...tabs.keys()][removedTabIndex - 1];
        }
      } else {
        activeTab = "None";
      }
    }

    const newWorkspace: Workspace = { tabs, activeTab, recentRepos: workspace.recentRepos }

    setWorkspace(newWorkspace);
  };

  const openWorkspaceTab = (newTabKey: string, newTab: Tab) => {
    if (!workspace) return;

    // Gets the workspace tabs
    let tabs = new Map<string, Tab>(workspace.tabs);

    // Adds the new tab. If it is a welcome page, just push it, otherwise replace the welcome tab with the new one
    const entries = [...workspace.tabs.entries()];
    if (!isType("Repo", newTabKey)) {
      entries.push([newTabKey, newTab]);
    } else {
      const index = [...workspace.tabs.keys()].indexOf(workspace.activeTab);
      entries.splice(index, 1, [newTabKey, newTab]);
    }

    tabs = new Map(entries);

    let recentRepos = workspace.recentRepos;
    if (recentRepos && !recentRepos.includes(newTabKey) && isType("Repo", newTabKey)) {
      recentRepos.push(newTabKey)
    }

    setWorkspace({ activeTab: newTabKey, tabs, recentRepos });
  };

  const openWelcomePage = () => {
    if (!workspace) return;

    const label = "Welcome Page";
    const repoPath = label + ":" + Date.now();;
    const key = repoPath;

    const newTab = {
      label,
      repoPath,
    };

    openWorkspaceTab(key, newTab);
  };

  const openConfigPage = () => {
    if (!workspace) return;
    const key = "ConfigPage";
    openWorkspaceTab(key, {
      label: "Configuration",
      repoPath: key,
    });
  };

  const loadingIndicatorPropsDefault = { title: "", liveFeedBack: false, feedbackText: "" }
  const [loadingIndicatorProps, setLoadingIndicatorProps] = useState<LoadingIndicatorProps>(loadingIndicatorPropsDefault)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const showLoadingDuringTask = async (props: LoadingIndicatorProps, promise: Promise<void>) => {
    const unlisten = await listen<string>("operation-progress", (event) => {
      updateLiveFeedback(event.payload)
    });

    setLoadingIndicatorProps(props);
    setShowLoadingIndicator(true);
    await promise;
    setShowLoadingIndicator(false);
    setLoadingIndicatorProps(loadingIndicatorPropsDefault)

    unlisten();
  };

  const updateLiveFeedback = (text: string) => {
    setLoadingIndicatorProps(prev => {
      if (!prev) return prev;
      return { ...prev, feedbackText: text };
    });
  };

  return (
    <AppContext.Provider value={{
      // States and Setters
      workspace, setWorkspace,
      config, setConfig,
      newConfig, setNewConfig,

      activeModal, setActiveModal,
      notification, setNotification,

      activeRepoInfo, setActiveRepoInfo,
      activeRepoHistory, setActiveRepoHistory,

      // Global Functions
      openContextMenu,
      openNewRepo,
      closeWorkspaceTab,
      setActiveTab,
      openWelcomePage,
      openConfigPage,
      isType,

      // Modal states and functions
      confirmationModalProps,
      openConfirmationModal,

      renameBranchModalProps,
      openRenameBranchModal,

      createTagModalProps,
      openCreateTagModal,

      pushModalProps,
      openPushModal,

      pullModalProps,
      openPullModal,

      mergeBranchModalProps,
      openMergeBranchModal,

      rebaseBranchModalProps,
      openRebaseBranchModal,

      loadingIndicatorProps,
      showLoadingIndicator,
      setShowLoadingIndicator,
      showLoadingDuringTask,
      updateLiveFeedback
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
