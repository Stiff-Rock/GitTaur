import styles from './ScrollBar.module.css';
import Scrollbars from 'react-custom-scrollbars-2';

interface ScrollBarProps {
  children: React.ReactNode;
  width?: number,
  offset?: number,
  autoHide?: boolean,
  autoHideTimeout?: number,
  autoHideDuration?: number
  ref?: React.MutableRefObject<Scrollbars | null>,
  className?: string,
}

const ScrollBar: React.FC<ScrollBarProps> = (props) => {
  const {
    children,
    width = 10,
    offset = 0,
    autoHide,
    autoHideTimeout = 500,
    autoHideDuration = 300,
    ref,
    className
  } = props;

  return (
    <Scrollbars
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
}

export default ScrollBar;
