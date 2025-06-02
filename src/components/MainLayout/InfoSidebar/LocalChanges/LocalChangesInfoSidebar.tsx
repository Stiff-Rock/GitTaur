import styles from "./LocalChangesInfoSidebar.module.css";
import { useMainContext } from "../../../../context/MainContext";
import CommitButton from "./CommitButton/CommitButton";
import { useLayoutEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../../../../context/AppContext";

const LocalChangesInfoSidebar: React.FC = () => {
  const { setNotification, workspace } = useAppContext();
  const { currentAppTab, inChangesTab, lastSelectedChange, fileDiff, setFileDiff } = useMainContext();

  const [commitSummary, setCommitSummary] = useState("");
  const [commitBody, setCommitBody] = useState("");

  const commitButtonProps = {
    commitSummary,
    setCommitSummary,
    commitBody,
    setCommitBody,
  };

  useLayoutEffect(() => {
    if (!lastSelectedChange || !workspace) return;

    const repoPath = workspace.activeTab;
    const filePath = lastSelectedChange.name;
    const status = lastSelectedChange.status;

    invoke<string>("get_file_diff", { repoPath, filePath, status })
      .then(setFileDiff)
      .catch((e) => {
        console.error(e);
        setNotification(e);
      });
  }, [lastSelectedChange])

  return (
    <div className={`${styles.mainContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div
        className={`${styles.diffSection} ${!inChangesTab && styles.stashChangesSection}`}
        dangerouslySetInnerHTML={
          fileDiff
            ? { __html: fileDiff }
            : {
              __html: lastSelectedChange && !fileDiff
                ? "New file or no content changes"
                : "Select a file to see diff"
            }
        }
      />

      <div className={`${styles.commitSection} ${inChangesTab ? '' : 'inactive'}`}>
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
