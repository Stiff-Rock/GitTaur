import styles from './TodoPanel.module.css';
import { useCallback, useEffect, useRef, useState } from "react";
import { useMainContext } from "../../../../context/MainContext";
import { useAppContext } from '../../../../context/AppContext';
import MDEditor, { ICommand } from 'stiff-rock-react-md-editor';
import { invoke } from '@tauri-apps/api/core';

const TodoPanel: React.FC<{ isAcitve: boolean }> = ({ isAcitve }) => {
  const { workspace, config, setNotification, isType } = useAppContext();
  const { currentAppTab } = useMainContext();
  const [inEditMode, setInEditMode] = useState(true);
  const [todoText, setTodoText] = useState("");

  const commandsToHide = ['preview'];
  const commandFilter = (command: ICommand, _: boolean): false | ICommand => {
    if (commandsToHide.includes(command.name ?? "")) {
      return false;
    }
    return command;
  };

  const [todoListLocation, setTodoListLocation] = useState("");

  // File creation at component mount
  useEffect(() => {
    if (!config || !config.createTodo || !workspace) return;
    const location = workspace.activeTab;
    if (!isType("Repo", location) || !isAcitve) return;
    setTodoListLocation(location);
    invoke<string>("create_todo_file", { repoPath: workspace.activeTab }).then(setTodoText)
      .catch((e) => {
        setNotification(e);
      });
  }, [config]);

  const saveTimerRef = useRef<number | null>(null);

  // Saving function, hooks and calls
  const saveTodoFile = (repoPath: string, todoText: string) => {
    invoke("save_todo_file", { repoPath, todoText }).catch((e) => {
      setNotification(e);
    });
  }

  const debouncedSave = useCallback((text: string, path: string) => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      if (path) {
        saveTodoFile(path, text);
      }
      saveTimerRef.current = null;
    }, 500);
  }, [setNotification]);

  useEffect(() => {
    if (!config || !config.createTodo || !workspace) return;
    if (!isType("Repo", workspace.activeTab) || !isAcitve) return;

    if (todoText && todoListLocation) {
      debouncedSave(todoText, todoListLocation);
    }

    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [todoText, todoListLocation, debouncedSave]);

  // Add keyboard shortcut for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the current tab is active
      if (currentAppTab !== "todo-panel") return;

      // Check for Ctrl+S (or Command+S on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog

        // If we have text and a location, save immediately
        if (todoText && todoListLocation) {
          // Clear any pending debounced save
          if (saveTimerRef.current !== null) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
          }

          // Save immediately
          saveTodoFile(todoListLocation, todoText);

          // Optional: show a save confirmation
          setNotification("Todo list saved!");
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentAppTab, todoText, todoListLocation, setNotification]);

  return (
    <div className={`${styles.mainContainer} ${currentAppTab === "todo-panel" ? '' : 'inactive'}`}>
      <div className={styles.tabs}>
        <button
          className={`appButton ${styles.tabButton} ${inEditMode ? styles.activeTab : ''}`}
          onClick={() => setInEditMode(true)}
        >
          Edit
        </button>
        <div className={styles.buttonSeparator} />
        <button
          className={`appButton ${styles.tabButton} ${!inEditMode ? styles.activeTab : ''}`}
          onClick={() => setInEditMode(false)}
        >
          View
        </button>
      </div>

      {inEditMode ? (
        <MDEditor
          value={todoText}
          onChange={(t) => setTodoText(t ?? "")}
          preview='edit'
          visibleDragbar={false}
          commandsFilter={commandFilter}
          className={styles.editor}
        />
      ) : (
        <MDEditor.Markdown
          source={todoText}
          className={styles.preview}
        />
      )}
    </div>
  );
};

export default TodoPanel;
