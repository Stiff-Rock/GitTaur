import styles from './ComboBox.module.css';

interface ComboBoxProps {
  title?: string,
  disableCondition?: boolean,
  onItemSelected: (value: string) => void,
  value: string,
  optionsArray: Array<string>,
  className?: string,
}


const ComboBox: React.FC<ComboBoxProps> = (props) => {
  const { title, disableCondition, onItemSelected, value, optionsArray, className } = props;

  return (
    <div className={`${styles.comboBoxContainer} ${className}`}>
      {title && <span>{title}</span>}
      <select
        className={styles.comboBox}
        disabled={disableCondition}
        onChange={(e) => onItemSelected(e.target.value)}
        value={value}
      >
        {optionsArray.map((value, i) => (
          <option value={value} key={i}>{value}</option>
        ))}
      </select>
    </div>
  );
}

export default ComboBox;
