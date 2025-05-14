import styles from "./CommitButton.module.css";
import { invoke } from "@tauri-apps/api/core";

const CommitButton: React.FC = () => {
  const commitChanges = () => {
    invoke("", {});
  }

  return (
    <button onClick={commitChanges}
      className={`appButton ${styles.button}`}
      title='Commit changes'
    >
      Commit changes
    </button>
  );
}

export default CommitButton;
