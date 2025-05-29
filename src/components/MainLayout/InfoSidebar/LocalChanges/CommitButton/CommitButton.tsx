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

  const { setNotification } = useAppContext();
  const { repoPath, } = useMainContext();

  const commitChanges = () => {
    //TODO: AFTER COMMITNG, CHANGES DONT UPDATE DONT KNOW WHY, CHECK THE BACKEND TOO
    invoke("commit", { repoPath, commitSummary, commitBody }).then(() => {
      setCommitSummary("");
      setCommitBody("");
    }).catch((e) => {
      const msg = `Error during commit - ${e}`;
      console.error(msg)
      setNotification(msg);
    });
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
