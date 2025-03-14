import { Tab } from "./tab";

export interface Workspace {
  tabs: Array<[string, Tab]>;
  activeTab: string;
}
