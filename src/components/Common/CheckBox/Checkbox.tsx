import { ReactNode } from "react";

interface CheckboxProps {
  checkedValue: boolean,
  onChecked: (isChecked: boolean) => void,
  label: string,
  checkboxIcon?: ReactNode,
  className?: string,
}

const Checkbox: React.FC<CheckboxProps> = (props) => {
  const { checkedValue, onChecked, label, checkboxIcon, className } = props;

  return (
    <div className={`checkbox ${className}`}>
      <input
        type="checkbox"
        checked={checkedValue}
        onChange={(e) => onChecked(e.target.checked)}
      />
      <label htmlFor={label}>{label}</label>
      {checkboxIcon}
    </div>
  );
}

export default Checkbox;
