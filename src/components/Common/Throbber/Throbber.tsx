import React from 'react';
import styles from './Throbber.module.css';

interface ThrobberProps {
  size?: 'small' | 'medium' | 'large';
  isVisible?: boolean;
}

const Throbber: React.FC<ThrobberProps> = ({
  size = 'medium',
  isVisible = false
}) => {
  const sizeValue = {
    small: '12px',
    medium: '24px',
    large: '32px'
  }[size];

  return (
    <div
      style={{
        width: sizeValue,
        height: sizeValue,
        minWidth: sizeValue,
        minHeight: sizeValue,
        padding: '7px',
        visibility: isVisible ? 'visible' : 'hidden'
      }}>
      <div
        className={styles.throbber}
        style={{
          width: sizeValue,
          height: sizeValue,
          minWidth: sizeValue,
          minHeight: sizeValue,
        }}
      />
    </div>
  );
};

export default Throbber;
