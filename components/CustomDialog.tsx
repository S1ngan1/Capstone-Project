import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
interface CustomDialogProps {
  visible: boolean
  onClose: () => void
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  buttons?: Array<{
    text: string
    onPress: () => void
    style?: 'default' | 'cancel' | 'destructive' | 'primary'
  }>
  icon?: string
  autoClose?: number // Auto close after milliseconds
}
const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
export const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  onClose,
  title,
  message,
  type,
  buttons,
  icon,
  autoClose,
}) => {
  const [animation] = useState(new Animated.Value(0))
  const [scaleAnimation] = useState(new Animated.Value(0.8))
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start()
      // Auto close functionality
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => {
          onClose()
        }, autoClose)
        return () => clearTimeout(timer)
      }
    } else {
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible, autoClose])
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45a049', '#388e3c'],
          iconName: icon || 'checkmark-circle',
          iconColor: '#4CAF50',
        }
      case 'error':
        return {
          colors: ['#F44336', '#e53935', '#d32f2f'],
          iconName: icon || 'close-circle',
          iconColor: '#F44336',
        }
      case 'warning':
        return {
          colors: ['#FF9800', '#f57c00', '#e65100'],
          iconName: icon || 'warning',
          iconColor: '#FF9800',
        }
      case 'info':
        return {
          colors: ['#2196F3', '#1976d2', '#1565c0'],
          iconName: icon || 'information-circle',
          iconColor: '#2196F3',
        }
      case 'confirm':
        return {
          colors: ['#4A90E2', '#357ABD', '#2E5B8A'],
          iconName: icon || 'help-circle',
          iconColor: '#4A90E2',
        }
      default:
        return {
          colors: ['#6c757d', '#5a6268', '#495057'],
          iconName: icon || 'information-circle',
          iconColor: '#6c757d',
        }
    }
  }
  const getButtonStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'primary':
        return styles.primaryButton
      case 'destructive':
        return styles.destructiveButton
      case 'cancel':
        return styles.cancelButton
      default:
        return styles.defaultButton
    }
  }
  const getButtonTextStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'primary':
        return styles.primaryButtonText
      case 'destructive':
        return styles.destructiveButtonText
      case 'cancel':
        return styles.cancelButtonText
      default:
        return styles.defaultButtonText
    }
  }
  const typeConfig = getTypeConfig()
  const defaultButtons = buttons || [
    {
      text: 'OK',
      onPress: onClose,
      style: 'primary' as const,
    },
  ]
  if (!visible) return null
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: animation,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              transform: [{ scale: scaleAnimation }],
              opacity: animation,
            },
          ]}
        >
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.dialog}
          >
            {/* Header with icon */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${typeConfig.iconColor}15` }]}>
                <Ionicons
                  name={typeConfig.iconName as any}
                  size={32}
                  color={typeConfig.iconColor}
                />
              </View>
            </View>
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {defaultButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button.style),
                    defaultButtons.length === 1 && styles.singleButton,
                    index === 0 && defaultButtons.length > 1 && styles.firstButton,
                    index === defaultButtons.length - 1 && defaultButtons.length > 1 && styles.lastButton,
                  ]}
                  onPress={button.onPress}
                  activeOpacity={0.8}
                >
                  {button.style === 'primary' ? (
                    <LinearGradient
                      colors={typeConfig.colors}
                      style={styles.buttonGradient}
                    >
                      <Text style={getButtonTextStyle(button.style)}>
                        {button.text}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={getButtonTextStyle(button.style)}>
                      {button.text}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}
// Convenience functions for common dialog types
export const showSuccessDialog = (
  title: string,
  message: string,
  onClose?: () => void,
  autoClose?: number
) => {
  // This would be used with a dialog context or state management
  return {
    type: 'success' as const,
    title,
    message,
    onClose: onClose || (() => {}),
    autoClose,
  }
}
export const showErrorDialog = (
  title: string,
  message: string,
  onClose?: () => void
) => {
  return {
    type: 'error' as const,
    title,
    message,
    onClose: onClose || (() => {}),
  }
}
export const showConfirmDialog = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  return {
    type: 'confirm' as const,
    title,
    message,
    buttons: [
      {
        text: 'Cancel',
        onPress: onCancel || (() => {}),
        style: 'cancel' as const,
      },
      {
        text: 'Confirm',
        onPress: onConfirm,
        style: 'primary' as const,
      },
    ],
  }
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogContainer: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    marginHorizontal: 20,
  },
  dialog: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  singleButton: {
    marginHorizontal: 20,
  },
  firstButton: {
    marginRight: 6,
  },
  lastButton: {
    marginLeft: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: 'transparent',
  },
  defaultButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  destructiveButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  destructiveButtonText: {
    color: '#e53e3e',
    fontSize: 16,
    fontWeight: '600',
  },
})
export default CustomDialog
