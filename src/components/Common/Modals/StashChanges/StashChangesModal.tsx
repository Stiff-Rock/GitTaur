import { useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import InputField from "../../InputField/InputField";
import BaseModal from "../BaseModal";
import baseStyle from "../BaseModal.module.css";
import { useMainContext } from "../../../../context/MainContext";

const StashChangesModal: React.FC = () => {
  const { setActiveModal } = useAppContext();
  const { stashChanges } = useMainContext();

  const [stashMsg, setStashMsg] = useState("");

  const handleStashChanges = async () => {
    await stashChanges(stashMsg);
    setActiveModal("");
  }

  return (
    <BaseModal title="Stash Changes">
      <InputField
        title="Message"
        type="text"
        placeholder="Optional stash message"
        value={stashMsg}
        onChange={setStashMsg}
      />

      <div className={baseStyle.buttonsContainer}>
        <button className='appButton' onClick={handleStashChanges}>Stash</button>
        <button className='appButton' onClick={() => setActiveModal("")}>Cancel</button>
      </div>
    </BaseModal>
  );
}

export default StashChangesModal;
