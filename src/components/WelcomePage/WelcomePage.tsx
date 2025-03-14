import styles from './WelcomePage.module.css';
import { Scrollbars } from 'react-custom-scrollbars-2';

function WelcomePage() {
  return (
    <div className={styles.main}>
      <div className={styles.subContainer}>
        <span className={styles.title}>Let's start working</span>
        <Scrollbars
          autoHide
          autoHideTimeout={500}
          autoHideDuration={300}
          renderThumbVertical={({ style, ...props }) => (
            <div
              {...props}
              className={styles.scrollbar}
            />
          )}
          renderTrackVertical={({ style, ...props }) => (
            <div
              {...props}
              className={styles.trackVertical}
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
    </div>
  );
}

export default WelcomePage;
