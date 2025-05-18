import { ReactNode } from 'react';
import styles from './InputField.module.css';

interface InputField {
  title?: string;
  type: string,
  placeholder: string,
  value: string,
  onChange: (value: string) => void,
  buttonIcon?: ReactNode,
  onButtonClick?: () => void;
  className?: string;
}

const InputField: React.FC<InputField> = (props) => {
  const { title, type, placeholder, value, onChange, buttonIcon, onButtonClick, className } = props;

  return (
    <div className={`${styles.inputFieldContainer} ${className}`}>
      {title && <span>{title}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {buttonIcon &&
        <button onClick={onButtonClick} className={`actionButton ${styles.actionButton}`}>
          {buttonIcon}
        </button>}
    </div>
  );
}

export default InputField;
