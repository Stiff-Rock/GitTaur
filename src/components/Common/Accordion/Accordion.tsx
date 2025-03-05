import React from 'react';
import '../../../assets/styles/variables.css';
import styles from './Acordion.module.css'
import Collapsible from 'react-collapsible';
import { GoChevronRight } from 'react-icons/go';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  return (
    <div className={`${styles.accordion}`}>
      <Collapsible
        trigger={
          <div className={`${styles.accordionHeader}`}>
            <GoChevronRight className={`${styles.icon} ${styles.closed}`} />
            <span>{title}</span>
          </div>
        }
        triggerWhenOpen={
          <div className={`${styles.accordionHeader}`}>
            <GoChevronRight className={`${styles.icon}  ${styles.open}`} />
            <span>{title}</span>
          </div>
        }
        transitionTime={100}
      >
        <div className={`${styles.accordionContent}`}>{children}</div>
      </Collapsible>
    </div>
  );
};

export default Accordion;
