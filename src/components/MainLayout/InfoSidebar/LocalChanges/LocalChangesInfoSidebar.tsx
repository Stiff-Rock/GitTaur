import styles from "./LocalChangesInfoSidebar.module.css";
import { useMainContext } from "../../../../context/MainContext";
import CommitButton from "./CommitButton/CommitButton";
import { useState } from "react";
import Scrollbars from "react-custom-scrollbars-2";

const LocalChangesInfoSidebar: React.FC = () => {
  const { currentAppTab } = useMainContext();

  const [commitSummary, setCommitSummary] = useState("");
  const [commitBody, setCommitBody] = useState("");

  return (
    <div className={`${styles.mainContainer} ${currentAppTab === "local-changes" ? '' : 'inactive'}`}>
      <div className={styles.diffSection}>
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

          {/*TODO: REVISE AND STANDARDIZE SCROLBARS*/}
          <Scrollbars
            renderThumbVertical={({ style, ...props }) => (
              <div
                {...props}
                className='scrollbar'
              />
            )}
            renderTrackVertical={({ style, ...props }) => (
              <div
                {...props}
                style={{
                  ...style,
                  width: '10px',
                  bottom: '2px',
                  right: '0',
                  top: '2px',
                  borderRadius: '4px',
                }}
              />
            )}
          >
            <textarea
              className={styles.commitBodyInput}
              value={commitBody}
              onChange={(e) => setCommitBody(e.target.value)}
              placeholder="Commit body (optional)"
              style={{ resize: 'none' }}
              rows={4}
            />
          </Scrollbars>
        </div>

        <CommitButton />
      </div>
    </div >
  );
};

export default LocalChangesInfoSidebar;
