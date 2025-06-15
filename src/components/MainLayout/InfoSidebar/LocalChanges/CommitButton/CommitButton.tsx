import { useAppContext } from "../../../../../context/AppContext";
import { useMainContext } from "../../../../../context/MainContext";
import styles from "./CommitButton.module.css";
import { invoke } from "@tauri-apps/api/core";

interface CommitButtonProps {
  commitSummary: string;
  setCommitSummary: React.Dispatch<React.SetStateAction<string>>;
  commitBody: string;
  setCommitBody: React.Dispatch<React.SetStateAction<string>>;
}

const CommitButton: React.FC<CommitButtonProps> = (props) => {
  const { commitSummary, setCommitSummary, commitBody, setCommitBody } = props;

  const { setNotification, showLoadingDuringTask } = useAppContext();
  const { repoPath, repoStatus } = useMainContext();

  const commitChanges = () => {
    if (!repoStatus || repoStatus.stagedFiles.length <= 0) {
      setNotification("Error: You must stage some changes to commit");
      return;
    }

    if (!commitSummary) {
      setNotification("Error: You must write a summary for the commit");
      return;
    }

    const commitPromise = invoke("commit", { repoPath, commitSummary, commitBody }).then(() => {
      setCommitSummary("");
      setCommitBody("");
    }).catch((e) => {
      setNotification(e);
    });

    const shortSummary = commitSummary.length > 25 ? commitSummary.slice(0, 25) + "..." : commitSummary;
    showLoadingDuringTask({
      title: "Creating commit \"" + shortSummary + "\""
    }, commitPromise)
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
