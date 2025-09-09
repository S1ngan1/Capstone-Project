import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  showDialog: (config: Omit<DialogConfig, 'visible'>) => void;
  showSuccess: (title: string, message: string, autoClose?: number) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showConfirm: (;
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showDialog = (config: Omit<DialogConfig, 'visible'>) => {
    setDialogConfig({
      ...config,
      visible: true,
    });
  };

  const hideDialog = () => {
    setDialogConfig(prev => ({
      ...prev,
      visible: false,
    }));
  };

  const showSuccess = (title: string, message: string, autoClose?: number) => {
    showDialog({
      title,
      message,
      type: 'success',
      autoClose,
      buttons: [;
        {
          text: 'Great!',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  };

  const showError = (title: string, message: string) => {;
    showDialog({
      title,
      message,
      type: 'error',
      buttons: [;
        {
          text: 'OK',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  };

  const showWarning = (title: string, message: string) => {;
    showDialog({
      title,
      message,
      type: 'warning',
      buttons: [;
        {
          text: 'Understood',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  };

  const showInfo = (title: string, message: string) => {;
    showDialog({
      title,
      message,
      type: 'info',
      buttons: [;
        {
          text: 'Got it',
          onPress: hideDialog,
          style: 'primary',
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showDialog({
      title,
      message,
      type: 'confirm',
      buttons: [;
        {
          text: 'Cancel',
          onPress: () => {;
            hideDialog();
            onCancel?.();
          },
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {;
            hideDialog();
            onConfirm();
          },
          style: 'primary',
        },
      ],
    });
  };

  const contextValue: DialogContextType = {;
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    hideDialog,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <CustomDialog
        visible={dialogConfig.visible}
        onClose={hideDialog}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        buttons={dialogConfig.buttons}
        icon={dialogConfig.icon}
        autoClose={dialogConfig.autoClose}
      />
    </DialogContext.Provider>
  );
};

export default DialogProvider;
