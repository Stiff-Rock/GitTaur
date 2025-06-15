import baseStyle from "../BaseModal.module.css";
import BaseModal from "../BaseModal";
import { useAppContext } from "../../../../context/AppContext";

export interface ConfirmationModalProps {
  title: string,
  subTitle: string,
  warning?: string,
  onConfirmed: () => void;
};

const ConfirmationModal: React.FC = () => {
  const { setActiveModal, confirmationModalProps } = useAppContext();

  const { title, subTitle, warning, onConfirmed } = confirmationModalProps;

  return (
    <BaseModal title={title}>
      <span style={{ marginBottom: "12px", fontSize: "var(--font-size-tab)" }}>
        {subTitle}
      </span>

      {warning && <span style={{ marginBottom: "10px", fontSize: "var(--font-size-small)", color: "var(--warning-color)" }}>
        {warning}
      </span>}

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={onConfirmed}>Confirm</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal >
  );
};

export default ConfirmationModal;
