import React, { createContext, useContext, useState, useRef, ReactNode } from 'react'
import { findNodeHandle, UIManager, Platform } from 'react-native'

interface ElementPosition {
  x: number
  y: number
  width: number
  height: number
}

interface TutorialContextType {
  // Basic tutorial control
  startTutorial: () => void
  showTutorial: boolean
  currentStep: number
  isMinimized: boolean

  // Tutorial actions
  closeTutorial: () => void
  minimizeTutorial: () => void
  maximizeTutorial: () => void
  setCurrentStep: (step: number) => void

  // Navigation and interaction
  setNavigateToDemo: (fn: (screen: string) => void) => void
  getElementPosition: (elementId: string) => Promise<ElementPosition>
  setInteractionAllowed: (allowed: boolean) => void
  isReady: boolean
  isInteractionAllowed: boolean
  registerElement: (id: string, ref: any) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

interface TutorialProviderProps {
  children: ReactNode
}

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isReady, setIsReady] = useState(true)
  const [isInteractionAllowed, setIsInteractionAllowed] = useState(true)
  const elementRefs = useRef<Record<string, any>>({})
  const navigateToDemo = useRef<((screen: string) => void) | null>(null)

  const startTutorial = () => {
    setShowTutorial(true)
    setCurrentStep(0)
    setIsMinimized(false)
    console.log('Tutorial started')
  }

  const closeTutorial = () => {
    setShowTutorial(false)
    setCurrentStep(0)
    setIsMinimized(false)
  }

  const minimizeTutorial = () => {
    setIsMinimized(true)
  }

  const maximizeTutorial = () => {
    setIsMinimized(false)
  }

  const setNavigateToDemo = (fn: (screen: string) => void) => {
    navigateToDemo.current = fn
  }

  const registerElement = (id: string, ref: any) => {
    if (ref) {
      elementRefs.current[id] = ref
    }
  }

  const getElementPosition = async (elementId: string): Promise<ElementPosition> => {
    return new Promise((resolve) => {
      const element = elementRefs.current[elementId]

      if (!element) {
        // Return default position if element not found
        resolve({ x: 0, y: 0, width: 100, height: 50 })
        return
      }

      const nodeHandle = findNodeHandle(element)
      if (!nodeHandle) {
        resolve({ x: 0, y: 0, width: 100, height: 50 })
        return
      }

      if (Platform.OS === 'android') {
        UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
          resolve({ x, y, width, height })
        })
      } else {
        UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
          resolve({ x: pageX, y: pageY, width, height })
        })
      }
    })
  }

  const setInteractionAllowedState = (allowed: boolean) => {
    setIsInteractionAllowed(allowed)
  }

  const value: TutorialContextType = {
    // Basic tutorial control
    startTutorial,
    showTutorial,
    currentStep,
    isMinimized,

    // Tutorial actions
    closeTutorial,
    minimizeTutorial,
    maximizeTutorial,
    setCurrentStep,

    // Navigation and interaction
    setNavigateToDemo,
    getElementPosition,
    setInteractionAllowed: setInteractionAllowedState,
    isReady,
    isInteractionAllowed,
    registerElement,
  }

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}

export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}
