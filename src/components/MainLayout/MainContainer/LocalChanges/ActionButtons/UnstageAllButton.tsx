import { FoldUpIcon } from '@primer/octicons-react'

const UnstageAllButton: React.FC = () => {
  return (
    <button onClick={() => removeFromStagingArea([])} className={`actionButton`} title='Unstage all files'>
      <FoldUpIcon />
    </button >
  );
}

export default UnstageAllButton;
