import { useAppContext } from '../../context/AppContext';
import styles from './WelcomePage.module.css';

function WelcomePage() {
  const { openRepo } = useAppContext();
  return (
    <div className={styles.main}>
      <span className={styles.title}>Let's start working</span>
      <span className={styles.option} onClick={openRepo}>Open local repository</span>
      <span className={styles.option}>Clone repository</span>
    </div>
  );
}

export default WelcomePage;
