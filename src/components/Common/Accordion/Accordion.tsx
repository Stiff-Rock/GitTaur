import React, { ReactNode } from 'react';
import styles from './Acordion.module.css'
import Collapsible from 'react-collapsible';
import { ChevronRightIcon } from "@primer/octicons-react";

interface AccordionProps {
  containerClassName?: string;
  headerClassName?: string;
  childrenContainerClassName?: string;
  title: string;
  icon: ReactNode
  children: ReactNode;
}

const Accordion: React.FC<AccordionProps> = (props) => {
  const { containerClassName, headerClassName, childrenContainerClassName, title, icon, children } = props;

  return (
    <div className={`${styles.accordion} ${containerClassName}`}>
      <Collapsible
        trigger={
          <div className={`${headerClassName} ${styles.accordionHeader}`}>
            <ChevronRightIcon className={`${styles.arrow}`} />
            {icon}
            <span>{title}</span>
          </div>
        }
        triggerWhenOpen={
          <div className={`${headerClassName} ${styles.accordionHeader}`}>
            <ChevronRightIcon className={`${styles.arrow}  ${styles.open}`} />
            {icon}
            <span>{title}</span>
          </div>
        }
        transitionTime={100}
      >
        <div className={`${childrenContainerClassName} ${styles.accordionContent} ${styles.customChildStyles}`}>
          {children}
        </div>
      </Collapsible>
    </div>
  );
};

export default Accordion;
