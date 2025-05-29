import { FoldDownIcon } from '@primer/octicons-react'
import { useMainContext } from '../../../../../context/MainContext';

const StageAllButton: React.FC = () => {
  const { addToStagingArea } = useMainContext();

  return (
    <button onClick={() => addToStagingArea([])} className={`actionButton`} title='Stage all files'>
      <FoldDownIcon />
    </button>
  );
}

export default StageAllButton;
