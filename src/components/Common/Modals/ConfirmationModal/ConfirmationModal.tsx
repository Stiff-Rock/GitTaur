import baseStyle from "../BaseModal.module.css";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";

export interface ConfirmationModalProps {
  title: string,
  subTitle: string,
  onConfirmed: () => void;
};

const ConfirmationModal: React.FC = () => {
  const { setActiveModal, confirmationModalProps } = useAppContext();

  const { title, subTitle, onConfirmed } = confirmationModalProps;

  return (
    <BaseModal title={title}>
      <span style={{ marginBottom: "12px", fontSize: "var(--font-size-tab)" }}>{subTitle}</span>
      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={onConfirmed}>Confirm</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal >
  );
};

export default ConfirmationModal;
