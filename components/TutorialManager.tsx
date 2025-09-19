import React, { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { InteractiveTutorial } from './FullScreenTutorial'

export const TutorialManager: React.FC = () => {
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial')
        if (!hasSeenTutorial) {
          // Small delay to ensure app is fully loaded
          setTimeout(() => {
            setShowTutorial(true)
          }, 1000)
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error)
      }
    }

    checkTutorialStatus()
  }, [])

  const handleCloseTutorial = async () => {
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true')
      setShowTutorial(false)
    } catch (error) {
      console.error('Error saving tutorial status:', error)
    }
  }

  return (
    <InteractiveTutorial
      visible={showTutorial}
      onClose={handleCloseTutorial}
    />
  )
}
