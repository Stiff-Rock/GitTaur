import { useState } from "react";
import { CopyIcon } from "@primer/octicons-react";
import styles from "./CommitInfoSidebar.module.css";
import { useAppContext } from "../../../../context/AppContext";

interface CopyShaButtonProps {
  sha: string;
}

const CopyShaButton: React.FC<CopyShaButtonProps> = ({ sha }) => {
  const [copied, setCopied] = useState(false);

  const { setNotification } = useAppContext();

  const copySha = () => {
    navigator.clipboard.writeText(sha)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
      })
      .catch(e => {
        const msg = `Falied to copy SHA: ${e}`;
        setNotification(msg);
        console.error(msg);
      });
  };

  return (
    <div className={styles.copyWrapper}>
      <button
        className={`${styles.copyBtn} actionButton`}
        onClick={copySha}
        title="Copy SHA"
      >
        <CopyIcon />
      </button>

      {copied && <span className={styles.tooltip}>Copied!</span>}
    </div>
  );
};

export default CopyShaButton;
