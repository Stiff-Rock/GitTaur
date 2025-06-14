import styles from './LoadingIndicator.module.css';
import Throbber from "../../Throbber/Throbber";
import { useAppContext } from '../../../../context/AppContext';

export interface LoadingIndicatorProps {
  title: string;
  liveFeedBack?: boolean;
  feedbackText?: string;
}

const LoadingIndicator: React.FC = () => {
  const { loadingIndicatorProps } = useAppContext();

  const { title, liveFeedBack = false, feedbackText = "Starting operation..." } = loadingIndicatorProps;

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.stopPropagation()}>
      <div className={styles.throbberContainer}>
        <h3>{title}</h3>
        <Throbber isVisible={true} size="huge" />
        {liveFeedBack && <span>{feedbackText}</span>}
      </div>
    </div>
  );
};

export default LoadingIndicator;
