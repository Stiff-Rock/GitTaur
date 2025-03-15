import React, { ReactNode } from 'react';
import styles from './Acordion.module.css'
import Collapsible from 'react-collapsible';
import { ChevronRightIcon } from "@primer/octicons-react";

interface AccordionProps {
  title: string;
  icon: ReactNode
  children: ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon, children }) => {
  return (
    <div className={`${styles.accordion}`}>
      <Collapsible
        trigger={
          <div className={`${styles.accordionHeader}`}>
            <ChevronRightIcon className={`${styles.arrow}`} />
            {icon}
            <span>{title}</span>
          </div>
        }
        triggerWhenOpen={
          <div className={`${styles.accordionHeader}`}>
            <ChevronRightIcon className={`${styles.arrow}  ${styles.open}`} />
            {icon}
            <span>{title}</span>
          </div>
        }
        transitionTime={100}
      >
        <div className={`${styles.accordionContent} ${styles.customChildStyles}`}>
          {children}
        </div>
      </Collapsible>
    </div>
  );
};

export default Accordion;
