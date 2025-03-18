import { useState } from "react";
import { CopyIcon } from "@primer/octicons-react";
import styles from "./CommitInfoSidebar.module.css";

interface CopyShaButtonProps {
  sha: string;
}

const CopyShaButton: React.FC<CopyShaButtonProps> = ({ sha }) => {
  const [copied, setCopied] = useState(false);

  const copySha = () => {
    navigator.clipboard.writeText(sha)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Hide after 2 seconds
      })
      .catch(err => {
        console.error("Failed to copy SHA:", err);
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
