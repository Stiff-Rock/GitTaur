import { forwardRef } from 'react';
import styles from './ScrollBar.module.css';
import Scrollbars from 'react-custom-scrollbars-2';

interface ScrollBarProps {
  children: React.ReactNode;
  containerHeight: number;
  width?: number,
  offset?: number,
  autoHide?: boolean,
  autoHideTimeout?: number,
  autoHideDuration?: number
  className?: string,
}

const ScrollBar = forwardRef<Scrollbars, ScrollBarProps>((props, ref) => {
  const {
    children,
    containerHeight,
    width = 10,
    offset = 0,
    autoHide,
    autoHideTimeout = 500,
    autoHideDuration = 300,
    className
  } = props;

  return (
    <Scrollbars
      style={{ height: `${containerHeight}%` }}
      autoHide={autoHide}
      autoHideTimeout={autoHideTimeout}
      autoHideDuration={autoHideDuration}
      renderThumbVertical={({ style, ...props }) => (
        <div
          {...props}
          className={styles.renderThumbVertical}
        />
      )}
      renderTrackVertical={({ style, ...props }) => (
        <div
          {...props}
          style={
            {
              ...style,
              width: `${width}px`,
              right: `${offset}px`
            }
          }
          className={styles.renderTrackVertical}
        />
      )}
      ref={ref}
      className={className}
    >
      {children}
    </Scrollbars >
  );
});

export default ScrollBar;
