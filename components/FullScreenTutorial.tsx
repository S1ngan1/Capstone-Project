import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useTutorial } from '../context/TutorialContext'

const { width, height } = Dimensions.get('window')

interface InteractiveTutorialProps {
  visible: boolean
  onClose: () => void
  onNavigateToDemo?: (screen: string) => void
}

interface ElementPosition {
  x: number
  y: number
  width: number
  height: number
}

const tutorialSteps = [
  {
    id: 1,
    title: 'Welcome to Smart Farm Assistant!',
    description: 'Let me show you how to use each feature step by step.',
    targetElement: null,
    instruction: 'Your farming companion is ready to help you manage your crops efficiently',
    buttonText: 'Start Tour!',
    color: '#4CAF50',
    allowInteraction: false,
    showArrow: false,
    showTapIndicator: false
  },
  {
    id: 2,
    title: 'Bottom Navigation',
    description: 'These buttons help you navigate between different sections of the app.',
    targetElement: 'bottom-navigation',
    instruction: 'The green bar at the bottom contains all your main navigation options',
    buttonText: 'Got It!',
    color: '#2196F3',
    allowInteraction: false,
    showArrow: false, // Don't show arrow for bottom navigation
    showTapIndicator: false
  },
  {
    id: 3,
    title: 'Home Button',
    description: 'Returns you to your farm dashboard anytime.',
    targetElement: 'nav-home',
    instruction: 'Try tapping the Home button now!',
    buttonText: 'I Tried It!',
    color: '#4CAF50',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 4,
    title: 'Farm Requests',
    description: 'Request access to new farms here.',
    targetElement: 'nav-requests',
    instruction: 'Go ahead and tap Requests to see how it works!',
    buttonText: 'I Tried It!',
    color: '#FF9800',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 5,
    title: 'Activity Feed',
    description: 'See what\'s happening on your farms.',
    targetElement: 'nav-activity',
    instruction: 'Try tapping Activity to see your farm activities!',
    buttonText: 'I Tried It!',
    color: '#F44336',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 6,
    title: 'Notifications',
    description: 'Important alerts and system updates.',
    targetElement: 'nav-notifications',
    instruction: 'Tap Notifications to see your alerts!',
    buttonText: 'I Tried It!',
    color: '#9C27B0',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 7,
    title: 'AI Chat Assistant',
    description: 'Get personalized farming advice from our AI specialist.',
    targetElement: 'nav-ai-chat',
    instruction: 'Try the AI Chat! Ask a farming question.',
    buttonText: 'I Tried It!',
    color: '#00BCD4',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 8,
    title: 'Settings Menu',
    description: 'Access your profile and app settings.',
    targetElement: 'nav-settings',
    instruction: 'Check out the Settings menu!',
    buttonText: 'I Tried It!',
    color: '#607D8B',
    allowInteraction: true,
    waitForInteraction: true,
    showArrow: true,
    showTapIndicator: true
  },
  {
    id: 9,
    title: 'Tutorial Complete!',
    description: 'You now know how to navigate the app. Start exploring your farms!',
    targetElement: null,
    instruction: 'Access this tutorial anytime from Settings → App Tutorial',
    buttonText: 'Start Farming!',
    color: '#4CAF50',
    allowInteraction: false,
    showArrow: false,
    showTapIndicator: false
  }
]

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  visible,
  onClose,
  onNavigateToDemo,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [pulseAnim] = useState(new Animated.Value(1))
  const [arrowPosition, setArrowPosition] = useState<ElementPosition | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)

  // Get tutorial context - now guaranteed to have all properties
  const { getElementPosition, setInteractionAllowed, isReady } = useTutorial()

  const current = tutorialSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorialSteps.length - 1

  // Get real element position and set arrow location
  useEffect(() => {
    const updateArrowPosition = async () => {
      if (visible && current.targetElement && current.showArrow && isReady) {
        try {
          setTimeout(async () => {
            const position = await getElementPosition(current.targetElement!)
            if (position) {
              const centerX = position.x + position.width / 2
              const centerY = position.y + position.height / 2

              setArrowPosition({
                x: centerX - 22.5,
                y: centerY - 60,
                width: 45,
                height: 45
              })
            } else {
              setArrowPosition(null)
            }
          }, 100)
        } catch (error) {
          console.warn('Could not get element position:', error)
          setArrowPosition(null)
        }
      } else {
        setArrowPosition(null)
      }
    }

    updateArrowPosition()
    setUserInteracted(false)

    // Set interaction allowed based on current step - now always safe
    setInteractionAllowed(current.allowInteraction !== false)
  }, [currentStep, visible, current.targetElement, current.showArrow, current.allowInteraction, getElementPosition, setInteractionAllowed, isReady])

  // Animated pulse effect
  useEffect(() => {
    if (!visible) return

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    )

    pulse.start()
    return () => pulse.stop()
  }, [visible, pulseAnim])

  const handleNext = () => {
    if (isLastStep) {
      onClose()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      {/* Arrow pointer */}
      {arrowPosition && current.showArrow && (
        <View
          style={[
            styles.arrow,
            {
              left: arrowPosition.x,
              top: arrowPosition.y,
            },
          ]}
        >
          <Ionicons name="arrow-down" size={45} color={current.color} />
        </View>
      )}

      {/* Tap indicator (finger icon only, no text) */}
      {arrowPosition && current.showTapIndicator && (
        <Animated.View
          style={[
            styles.tapIndicator,
            {
              left: arrowPosition.x + 50,
              top: arrowPosition.y + 50,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="finger-print" size={30} color={current.color} />
        </Animated.View>
      )}

      {/* Tutorial content */}
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
            style={styles.tutorialCard}
          >
            <View style={styles.header}>
              <Text style={[styles.stepCounter, { color: current.color }]}>
                {currentStep + 1} / {tutorialSteps.length}
              </Text>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
              <Text style={[styles.title, { color: current.color }]}>
                {current.title}
              </Text>
              <Text style={styles.description}>
                {current.description}
              </Text>
              <Text style={styles.instruction}>
                {current.instruction}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handlePrev}
                style={[
                  styles.navButton,
                  styles.prevButton,
                  isFirstStep && styles.disabledButton
                ]}
                disabled={isFirstStep}
              >
                <Text style={[styles.navButtonText, isFirstStep && styles.disabledText]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                style={[styles.navButton, styles.nextButton, { backgroundColor: current.color }]}
              >
                <Text style={styles.navButtonText}>
                  {isLastStep ? 'Finish' : current.buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  tutorialCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCounter: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
  },
  cardContent: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  instruction: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  navButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  arrow: {
    position: 'absolute',
    zIndex: 10000,
  },
  tapIndicator: {
    position: 'absolute',
    zIndex: 10000,
  },
})
