import styles from "./TitleBar.module.css";
import WindowTabs from './WindowTabs/WindowTabs';
import WindowControls from './WindowControls/WindowControls';

const TitleBar: React.FC = () => {
  return (
    <div className={styles.titleBar}>
      <WindowTabs />
      <WindowControls />
    </div >
  );
};

export default TitleBar;
