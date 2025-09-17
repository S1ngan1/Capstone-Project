import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppTutorial } from './AppTutorial'
import { DemoModePrompt } from './DemoModePrompt'
import { useNavigation } from '@react-navigation/native'
import { useAuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface TutorialManagerProps {
  children: React.ReactNode
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false)
  const [showDemoPrompt, setShowDemoPrompt] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [userHasData, setUserHasData] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const navigation = useNavigation()
  const { session } = useAuthContext()

  useEffect(() => {
    if (session?.user?.id) {
      checkUserDataAndTutorial()
    }
  }, [session])

  const checkUserDataAndTutorial = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial')

      if (!hasSeenTutorial) {
        // Check if user has any farms or sensors
        const hasData = await checkIfUserHasData()
        setUserHasData(hasData)

        if (!hasData) {
          // New user with no data - show demo prompt instead of tutorial
          setTimeout(() => {
            setShowDemoPrompt(true)
          }, 2000)
        } else {
          // User has data - show regular tutorial
          setTimeout(() => {
            setShowTutorial(true)
          }, 1500)
        }
        setIsNewUser(true)
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error)
    }
  }

  const checkIfUserHasData = async (): Promise<boolean> => {
    try {
      if (!session?.user?.id) return false

      // Check if user has any farms
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('id')
        .eq('created_by', session.user.id)
        .limit(1)

      if (farmsError) {
        console.error('Error checking farms:', farmsError)
        return false
      }

      // Check if user has any sensors
      const { data: sensors, error: sensorsError } = await supabase
        .from('sensors')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (sensorsError) {
        console.error('Error checking sensors:', sensorsError)
        return false
      }

      return (farms && farms.length > 0) || (sensors && sensors.length > 0)
    } catch (error) {
      console.error('Error checking user data:', error)
      return false
    }
  }

  const handleTutorialClose = async () => {
    setShowTutorial(false)
    await AsyncStorage.setItem('hasSeenTutorial', 'true')
  }

  const handleDemoStart = async () => {
    setShowDemoPrompt(false)
    setDemoMode(true)
    setShowTutorial(true) // Show tutorial in demo mode
    await AsyncStorage.setItem('hasSeenTutorial', 'true')
  }

  const handleDemoPromptClose = async () => {
    setShowDemoPrompt(false)
    await AsyncStorage.setItem('hasSeenTutorial', 'true')
  }

  const navigateToDemo = (screen: string) => {
    // For users with no data, provide demo navigation
    switch (screen) {
      case 'FarmDetails':
        // Since they have no farms, navigate to a demo or create farm flow
        navigation.navigate('Home' as never)
        break
      default:
        navigation.navigate(screen as never)
        break
    }
  }

  return (
    <View style={styles.container}>
      {children}

      {showDemoPrompt && (
        <DemoModePrompt
          visible={showDemoPrompt}
          onClose={handleDemoPromptClose}
          onStartDemo={handleDemoStart}
        />
      )}

      {showTutorial && (
        <AppTutorial
          visible={showTutorial}
          onClose={handleTutorialClose}
          onNavigateToDemo={demoMode ? navigateToDemo : undefined}
          demoMode={demoMode}
          userHasData={userHasData}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
