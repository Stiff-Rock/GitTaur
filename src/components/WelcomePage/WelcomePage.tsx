import { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import CloneRepositoryModal from '../Common/Modals/CloneRepo/CloneRepositoryModal';
import CreateRepositoryModal from '../Common/Modals/CreateRepo/CreateRepositoryModal';
import styles from './WelcomePage.module.css';
import { Scrollbars } from 'react-custom-scrollbars-2';

function WelcomePage() {
  const { activeModal, isInWelcomePage, workspace, setActiveRepoInfo } = useAppContext();

  useEffect(() => {
    if (isInWelcomePage) {
      setActiveRepoInfo(null);
    }
  }, []);

  return (
    <div className={`${styles.main} ${isInWelcomePage || !workspace ? '' : 'inactive'}`}>
      <div className={styles.subContainer}>
        <span className={styles.title}>Let's start working</span>
        <Scrollbars
          autoHide
          autoHideTimeout={500}
          autoHideDuration={300}
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
          <div className={styles.history}>
            <span className={styles.noneFoundMsg}>No recently opened repositories found</span>
          </div>
        </Scrollbars>
      </div>

      {activeModal === "createRepo" && <CreateRepositoryModal />}
      {activeModal === "cloneRepo" && <CloneRepositoryModal />}
    </div>
  );
}

export default WelcomePage;
