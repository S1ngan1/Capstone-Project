import React, { createContext, useContext, ReactNode } from 'react';
import { CustomDialog } from '../components/CustomDialog';

interface DialogConfig {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive' | 'primary';
  }>;
  icon?: string;
  autoClose?: number;
}

interface DialogContextType {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  showDialog: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => ({});

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return children;
};

export default DialogProvider;
