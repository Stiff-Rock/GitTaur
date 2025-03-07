import React, { useState } from "react";
import styles from "./WindowTabs.module.css";

const WindowTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Tab1");

  return (
    <div className={`${styles.tabs}`}>

      <div onClick={() => setActiveTab("Tab1")} className={`${styles.tab} ${activeTab === 'Tab1' && styles.active}`}>
        <span>PlateaApp</span>
      </div>

      <div onClick={() => setActiveTab("Tab2")} className={`${styles.tab} ${activeTab === 'Tab2' && styles.active}`}>
        <span>PythonShit</span>
      </div>

    </div>
  );
};

export default WindowTabs;
