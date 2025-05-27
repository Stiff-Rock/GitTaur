import styles from "./LocalChangesInfoSidebar.module.css";
import { useMainContext } from "../../../../context/MainContext";
import CommitButton from "./CommitButton/CommitButton";
import { useState } from "react";

const LocalChangesInfoSidebar: React.FC = () => {
  const { currentAppTab } = useMainContext();

  const [commitSummary, setCommitSummary] = useState("");
  const [commitBody, setCommitBody] = useState("");

  const commitButtonProps = {
    commitSummary,
    setCommitSummary,
    commitBody,
    setCommitBody,
  };

  return (
    <div className={`${styles.mainContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div className={styles.diffSection}>
        IMPLEMENT!!!
      </div>

      <div className={styles.commitSection}>
        <span className={styles.commitSectionTitle}>Commit Options</span>

        <div className={styles.commitInputsContainer}>
          <div className={styles.commitSummaryContainer}>
            <input
              className={styles.commitSummaryInput}
              type="text"
              value={commitSummary}
              onChange={(e) => setCommitSummary(e.target.value)}
              placeholder="Commit summary"
            />

            <div className={styles.summarySeparator} />

            <span
              className={styles.summaryCount}
              style={commitSummary.length > 50 ? { color: 'var(--warning-color)' } : {}}
            >
              {commitSummary.length}/50
            </span>
          </div>

          <textarea
            className={styles.commitBodyInput}
            value={commitBody}
            onChange={(e) => setCommitBody(e.target.value)}
            placeholder="Commit body (optional)"
            style={{ resize: 'none' }}
          />
        </div>

        <CommitButton {...commitButtonProps} />
      </div>
    </div >
  );
};

export default LocalChangesInfoSidebar;
