import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import CloneRepositoryModal from '../Common/Modals/CloneRepo/CloneRepositoryModal';
import CreateRepositoryModal from '../Common/Modals/CreateRepo/CreateRepositoryModal';
import styles from './WelcomePage.module.css';
import ScrollBar from '../Common/ScrollBar/ScrollBar';

function WelcomePage() {
  const { activeModal, workspace, setActiveRepoInfo, setActiveRepoHistory, checkPageType } = useAppContext();

  useEffect(() => {
    if (!checkPageType("Repo")) {
      setActiveRepoInfo(null);
      setActiveRepoHistory(null);
    }
  }, []);

  return (
    <div className={`${styles.main} ${checkPageType("Welcome") || !workspace ? '' : 'inactive'}`}>
      <div className={styles.subContainer}>
        <span className={styles.title}>Let's start working</span>
        {/*TODO: WELCOMEPAGE OPENED REPOS HISTORY WITH tauri-plugin-store*/}
        <ScrollBar containerHeight={100} autoHide={true} offset={5}>
          <div className={styles.history}>
            <span className={styles.noneFoundMsg}>No recently opened repositories found</span>
          </div>
        </ScrollBar>
      </div>

      {activeModal === "createRepo" && <CreateRepositoryModal />}
      {activeModal === "cloneRepo" && <CloneRepositoryModal />}
    </div>
  );
}

export default WelcomePage;
