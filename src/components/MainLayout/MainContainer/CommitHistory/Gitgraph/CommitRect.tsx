import React, { useEffect } from "react";
import {
  Commit as CommitCore,
} from "@gitgraph/core";
import { ReactSvgElement } from "./types";
import graphStyles from './GraphStyles.module.css';
import { RectDims, useGraphContext } from "../../../../../context/GraphContext";
import { useMainContext } from "../../../../../context/MainContext";
import { useAppContext } from "../../../../../context/AppContext";
import { Menu, MenuItemOptions } from "@tauri-apps/api/menu";
import { invoke } from "@tauri-apps/api/core";

interface CommitRectProps {
  commit: CommitCore<ReactSvgElement>;
}

const CommitRect: React.FC<CommitRectProps> = (props: CommitRectProps) => {
  const { commit } = props;
  const { bboxMap } = useGraphContext();
  const { selectedCommit, setSelectedCommit } = useMainContext();
  const { workspace, openContextMenu, openCreateTagModal, setNotification, openConfirmationModal } = useAppContext();

  const [isMouseOver, setIsMouseOver] = React.useState<boolean>(false);

  const [commitRectDimensions, setCommitRectDimensions] = React.useState<RectDims>({ width: 0, height: 0, x: 0, y: 0 });

  const rectXPadding = 10;

  //NOTE: PADDING FUCKS EVERYTHING UP
  const rectHeight = 35;
  const rectYPadding = 0;

  const commonEndLimit = 500;

  useEffect(() => {
    const bboxDims = bboxMap.get(commit.hash);
    if (bboxDims) {
      const dotR = commit.style.dot.size;
      const minWidth = bboxDims.width + rectXPadding;

      const x = bboxDims.x - (rectXPadding / 2);
      const y = (bboxDims.y + dotR) - (rectHeight / 2)

      const width = minWidth + (commonEndLimit - minWidth);
      const height = rectHeight + rectYPadding;

      const dims: RectDims = {
        x,
        y,
        width,
        height
      };

      setCommitRectDimensions(dims);
    }
  }, [bboxMap]);

  const handleOpenContextMenu = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (!workspace) return;

    setSelectedCommit(commit.hash);

    const repoPath = workspace.activeTab;

    let menuItems: MenuItemOptions[] = [];

    menuItems.push({
      id: "checkoutCommit",
      text: "Checkout",
      action: () => {
        invoke("checkout_commit", { repoPath, commitOid: commit.hash }).catch((e) => {
          console.error(e);
          setNotification(e);
        });
      },
    });

    menuItems.push({
      id: "revertCommit",
      text: "Revert",
      action: () => {
        openConfirmationModal({
          onConfirmed: () => {
            invoke("revert_commit", { repoPath, commitOid: commit.hash }).catch((e) => {
              console.error(e);
              setNotification(e);
            });
          },
          title: "Revert commit",
          subTitle: "Target: <" + commit.message + ">",
        });
      },
    });

    menuItems.push({
      id: "tagCommit",
      text: "Tag",
      action: () => {
        openCreateTagModal({
          commitOid: commit.hash,
        });
      },
    });

    menuItems.push({
      id: "copyCommitSha",
      text: "Copy commit SHA",
      action: () => {
        navigator.clipboard.writeText(commit.hash).catch(e =>
          console.error("Failed to copy remote URL:", e)
        );
      },
    });

    openContextMenu(await Menu.new({ items: menuItems }), event);
  };

  return (<rect
    onClick={() => setSelectedCommit(commit.hash)}
    onContextMenu={handleOpenContextMenu}
    onMouseOver={() => setIsMouseOver(true)}
    onMouseOut={() => setIsMouseOver(false)}
    x={`${commitRectDimensions.x}`}
    y={`${commitRectDimensions.y}`}
    width={`${commitRectDimensions.width}`}
    height={`${commitRectDimensions.height}`}
    fill="transparent"
    className={
      selectedCommit === commit.hash
        ? graphStyles.selected
        : isMouseOver
          ? graphStyles.hovered
          : graphStyles.unselected
    }
  />);
}

export default CommitRect;
