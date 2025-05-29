import { FoldUpIcon } from '@primer/octicons-react'
import { useMainContext } from '../../../../../context/MainContext';

const UnstageAllButton: React.FC = () => {
  const { removeFromStagingArea } = useMainContext();

  return (
    <button onClick={() => removeFromStagingArea([])} className={`actionButton`} title='Unstage all files'>
      <FoldUpIcon />
    </button >
  );
}

export default UnstageAllButton;
