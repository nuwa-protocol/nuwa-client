import { createContext, type ReactNode, useContext, useState } from 'react';
import type { CapStoreSidebarSection } from '../types';

interface CapStoreModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  activeSection: CapStoreSidebarSection;
  setActiveSection: (section: CapStoreSidebarSection) => void;
}


const initialActiveSection = {
  id: 'all',
  label: 'All Caps',
  type: 'section' as const,
};

const defaultContextValue: CapStoreModalContextValue = {
  isOpen: false,
  openModal: () => { },
  closeModal: () => { },
  toggleModal: () => { },
  activeSection: initialActiveSection,
  setActiveSection: () => { },
};

const CapStoreModalContext = createContext<CapStoreModalContextValue>(
  defaultContextValue
);

interface CapStoreModalProviderProps {
  children: ReactNode;
}

export function CapStoreModalProvider({
  children,
}: CapStoreModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);


  const [activeSection, setActiveSection] =
    useState<CapStoreSidebarSection>(initialActiveSection);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setActiveSection(initialActiveSection);
  };
  const toggleModal = () => setIsOpen((prev) => !prev);

  const value: CapStoreModalContextValue = {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    activeSection,
    setActiveSection,
  };

  return (
    <CapStoreModalContext.Provider value={value}>
      {children}
    </CapStoreModalContext.Provider>
  );
}

export function useCapStoreModal() {
  const context = useContext(CapStoreModalContext);

  if (!context) {
    throw new Error(
      'useCapStoreModal must be used within a CapStoreModalProvider'
    );
  }

  return context;
}

export { CapStoreModalContext };