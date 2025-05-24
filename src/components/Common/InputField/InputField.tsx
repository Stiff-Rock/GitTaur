import { ReactNode } from 'react';
import styles from './InputField.module.css';

interface InputField {
  title?: string;
  type: string,
  placeholder: string,
  value: string,
  onChange: (value: string) => void,
  buttonIcon?: ReactNode,
  onButtonClick?: () => Promise<string | void>,
  min?: number,
  max?: number,
  className?: string;
}

const InputField: React.FC<InputField> = (props) => {
  const { title, type, placeholder, value, onChange, buttonIcon, onButtonClick, min, max, className } = props;

  const handleButtonClick = () => {
    if (!onButtonClick) return;
    onButtonClick().then((value) => {
      if (!value) return;
      onChange(value);
    });
  }

  return (
    <div className={`${styles.inputFieldContainer} ${className}`}>
      {title && <span>{title}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={`${type == "color" && styles.colorInput}`}
      />

      {buttonIcon &&
        <button onClick={handleButtonClick} className={`actionButton ${styles.actionButton}`}>
          {buttonIcon}
        </button>}
    </div>
  );
}

export default InputField;
