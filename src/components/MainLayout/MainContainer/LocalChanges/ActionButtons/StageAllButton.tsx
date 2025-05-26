import { FoldDownIcon } from '@primer/octicons-react'

const StageAllButton: React.FC<{ addToStagingArea: (files: Array<string>) => void }> = ({ addToStagingArea }) => {
  return (
    <button onClick={() => addToStagingArea([])} className={`actionButton`} title='Stage all files'>
      <FoldDownIcon />
    </button>
  );
}

export default StageAllButton;
