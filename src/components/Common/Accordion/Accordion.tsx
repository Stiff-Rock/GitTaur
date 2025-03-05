import React, { ReactNode } from 'react';
import '../../../assets/styles/variables.css';
import styles from './Acordion.module.css'
import Collapsible from 'react-collapsible';
import { GoChevronRight } from 'react-icons/go';

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
            <GoChevronRight className={`${styles.arrow}`} />
            {icon}
            <span>{title}</span>
          </div>
        }
        triggerWhenOpen={
          <div className={`${styles.accordionHeader}`}>
            <GoChevronRight className={`${styles.arrow}  ${styles.open}`} />
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
