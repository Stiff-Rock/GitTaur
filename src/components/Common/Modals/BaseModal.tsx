import style from './BaseModal.module.css';
import React, { ReactNode } from "react";
import { useAppContext } from "../../../context/AppContext";

interface BaseModalProps {
  title: string;
  children: ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = (props) => {
  const { title, children } = props;
  const { setActiveModal } = useAppContext();

  return (
    <div className={style.modalOverlay} onClick={() => setActiveModal("")}>
      <div className={style.modal} onClick={(e) => e.stopPropagation()}>
        <span className={style.modalTitle}>{title}</span>
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
