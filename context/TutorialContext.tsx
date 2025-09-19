import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface TutorialContextType {
  showTutorial: boolean
  currentStep: number
  isMinimized: boolean
  completedSteps: string[]
  isFirstTimeUser: boolean
  startTutorial: () => void
  closeTutorial: () => void
  minimizeTutorial: () => void
  maximizeTutorial: () => void
  setCurrentStep: (step: number) => void
  markStepCompleted: (stepId: string) => void
  resetTutorial: () => void
  checkFirstTimeUser: () => Promise<void>
  navigateToDemo?: (screen: string) => void
  setNavigateToDemo: (fn: (screen: string) => void) => void
}

const defaultContextValue: TutorialContextType = {
  showTutorial: false,
  currentStep: 0,
  isMinimized: false,
  completedSteps: [],
  isFirstTimeUser: true,
  startTutorial: () => {},
  closeTutorial: () => {},
  minimizeTutorial: () => {},
  maximizeTutorial: () => {},
  setCurrentStep: () => {},
  markStepCompleted: () => {},
  resetTutorial: () => {},
  checkFirstTimeUser: async () => {},
  setNavigateToDemo: () => {},
}

const TutorialContext = createContext<TutorialContextType>(defaultContextValue)

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentStep, setCurrentStepState] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
  const [navigateToDemo, setNavigateToDemo] = useState<((screen: string) => void) | undefined>()

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial')
      const completed = await AsyncStorage.getItem('completedTutorialSteps')

      setIsFirstTimeUser(hasSeenTutorial !== 'true')

      if (completed) {
        setCompletedSteps(JSON.parse(completed))
      }
    } catch (error) {
      console.error('Error checking first time user:', error)
    }
  }

  const startTutorial = () => {
    setShowTutorial(true)
    setCurrentStepState(0)
    setIsMinimized(false)
  }

  const closeTutorial = async () => {
    setShowTutorial(false)
    setIsMinimized(false)
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true')
      setIsFirstTimeUser(false)
    } catch (error) {
      console.error('Error saving tutorial completion:', error)
    }
  }

  const minimizeTutorial = () => {
    setIsMinimized(true)
  }

  const maximizeTutorial = () => {
    setIsMinimized(false)
  }

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step)
  }

  const markStepCompleted = async (stepId: string) => {
    const updatedSteps = [...completedSteps, stepId]
    setCompletedSteps(updatedSteps)

    try {
      await AsyncStorage.setItem('completedTutorialSteps', JSON.stringify(updatedSteps))
    } catch (error) {
      console.error('Error saving completed step:', error)
    }
  }

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenTutorial')
      await AsyncStorage.removeItem('completedTutorialSteps')
      setIsFirstTimeUser(true)
      setCompletedSteps([])
      setCurrentStepState(0)
      setIsMinimized(false)
    } catch (error) {
      console.error('Error resetting tutorial:', error)
    }
  }

  useEffect(() => {
    checkFirstTimeUser()
  }, [])

  const contextValue: TutorialContextType = {
    showTutorial,
    currentStep,
    isMinimized,
    completedSteps,
    isFirstTimeUser,
    startTutorial,
    closeTutorial,
    minimizeTutorial,
    maximizeTutorial,
    setCurrentStep,
    markStepCompleted,
    resetTutorial,
    checkFirstTimeUser,
    navigateToDemo,
    setNavigateToDemo,
  }

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  )
}

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}
