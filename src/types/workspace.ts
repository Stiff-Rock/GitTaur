import { Tab } from "./tab";

export interface Workspace {
  tabs: { [key: string]: Tab };
  activeTab: string;
}
