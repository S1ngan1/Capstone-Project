import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  BackHandler,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: string
  screen: string
  keyFeatures: string[]
  nextAction?: string
  showSeeInApp?: boolean
}

interface AppTutorialProps {
  visible: boolean
  onClose: () => void
  onNavigateToDemo?: (screen: string) => void
  demoMode?: boolean
  userHasData?: boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🌾 Welcome to Smart Farm Assistant',
    description: 'Your AI-powered farming companion! Let me show you how to get the most out of our app.',
    icon: 'leaf',
    screen: 'Home',
    keyFeatures: [
      'AI-powered farming recommendations',
      'Real-time sensor monitoring',
      'Weather-based insights',
      'Farm management tools'
    ],
    nextAction: 'Let\'s start by exploring the app!',
    showSeeInApp: false
  },
  {
    id: 'getting-started',
    title: '🏠 Getting Started',
    description: 'First, you\'ll want to set up your farms and add sensors to monitor your crops.',
    icon: 'home',
    screen: 'Home',
    keyFeatures: [
      'Create and manage multiple farms',
      'Add farm location and details',
      'Invite team members',
      'Set up farm-specific settings'
    ],
    nextAction: 'This is your main dashboard',
    showSeeInApp: true
  },
  {
    id: 'farm-details',
    title: '📊 Farm Management',
    description: 'Each farm has detailed information including sensor data, weather, and AI suggestions.',
    icon: 'analytics',
    screen: 'FarmDetails',
    keyFeatures: [
      'Real-time sensor readings',
      'Weather forecasts',
      'AI-powered suggestions',
      'Historical data charts'
    ],
    nextAction: 'View detailed farm information',
    showSeeInApp: true
  },
  {
    id: 'ai-chat',
    title: '🤖 AI Farming Assistant',
    description: 'Chat with our AI specialist for personalized farming advice based on your farm data.',
    icon: 'chatbubbles',
    screen: 'Suggestion',
    keyFeatures: [
      'Personalized farming advice',
      'Weather-based recommendations',
      'Crop management tips',
      'Problem-solving assistance'
    ],
    nextAction: 'Get AI-powered farming advice',
    showSeeInApp: true
  },
  {
    id: 'sensors',
    title: '📡 Sensor Monitoring',
    description: 'Monitor your farm conditions with real-time sensor data and alerts.',
    icon: 'hardware-chip',
    screen: 'SensorDetail',
    keyFeatures: [
      'Temperature monitoring',
      'Humidity tracking',
      'Soil moisture levels',
      'Custom alert thresholds'
    ],
    nextAction: 'Monitor your farm conditions',
    showSeeInApp: true
  },
  {
    id: 'notifications',
    title: '🔔 Stay Informed',
    description: 'Receive important alerts about your farms, sensors, and system updates.',
    icon: 'notifications',
    screen: 'Notification',
    keyFeatures: [
      'Real-time farm alerts',
      'System notifications',
      'Weather warnings',
      'Sensor status updates'
    ],
    nextAction: 'Check your notifications',
    showSeeInApp: true
  },
  {
    id: 'complete',
    title: '✅ You\'re All Set!',
    description: 'You\'re ready to start using Smart Farm Assistant. Remember, you can always access this tutorial from Settings.',
    icon: 'checkmark-circle',
    screen: 'Home',
    keyFeatures: [
      'Start adding your farms',
      'Set up sensors',
      'Chat with AI assistant',
      'Monitor your crops'
    ],
    nextAction: 'Happy farming!',
    showSeeInApp: false
  }
]

export const AppTutorial: React.FC<AppTutorialProps> = ({
  visible,
  onClose,
  onNavigateToDemo,
  demoMode = false,
  userHasData = true
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [slideAnimation] = useState(new Animated.Value(0))
  const [isMinimized, setIsMinimized] = useState(false)
  const [minimizedAnimation] = useState(new Animated.Value(0))

  useEffect(() => {
    if (visible) {
      // Prevent back button from closing tutorial
      const backAction = () => {
        return true // This prevents the back action
      }

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
      return () => backHandler.remove()
    }
  }, [visible])

  useEffect(() => {
    // Animate slide transition
    Animated.timing(slideAnimation, {
      toValue: currentStep,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [currentStep])

  useEffect(() => {
    // Animate minimized state
    Animated.timing(minimizedAnimation, {
      toValue: isMinimized ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [isMinimized])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
      setIsMinimized(false) // Expand tutorial when moving to next step
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setIsMinimized(false) // Expand tutorial when moving to previous step
    }
  }

  const handleSeeInApp = () => {
    const step = tutorialSteps[currentStep]
    if (onNavigateToDemo && step.screen) {
      // Minimize the tutorial instead of hiding it completely
      setIsMinimized(true)
      onNavigateToDemo(step.screen)
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleSkip = () => {
    onClose()
  }

  if (!visible) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tutorialSteps.length - 1

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
    >
      {isMinimized ? (
        // Minimized mode - no backdrop, just floating control
        <View style={styles.minimizedOverlay}>
          <LinearGradient
            colors={['#2196F3', '#42A5F5']}  // Changed from green to blue gradient
            style={styles.minimizedContainer}
          >
            <TouchableOpacity
              style={styles.minimizedContent}
              onPress={handleMinimize}
              activeOpacity={0.8}
            >
              <Ionicons name={currentTutorialStep.icon as any} size={20} color="#fff" />
              <Text style={styles.minimizedTitle}>
                Tutorial Step {currentStep + 1}/{tutorialSteps.length}
              </Text>
              <Ionicons name="chevron-up" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.minimizedControls}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={styles.minimizedButton}
                  onPress={handlePrevious}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={14} color="#fff" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.minimizedButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.minimizedButton}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                {isLastStep ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      ) : (
        // Full tutorial mode - with backdrop
        <View style={styles.overlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
            style={styles.backdrop}
          />

          <View style={styles.container}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Header with minimize button */}
              <View style={styles.tutorialHeader}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  {tutorialSteps.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index === currentStep && styles.progressDotActive,
                        index < currentStep && styles.progressDotCompleted
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.minimizeButton}
                  onPress={handleMinimize}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-down" size={20} color="#666" />
                  <Text style={styles.minimizeText}>Minimize</Text>
                </TouchableOpacity>
              </View>

              {/* Step Counter */}
              <Text style={styles.stepCounter}>
                {currentStep + 1} of {tutorialSteps.length}
              </Text>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name={currentTutorialStep.icon as any}
                  size={60}
                  color="#4CAF50"
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>
                {currentTutorialStep.title}
              </Text>

              {/* Description */}
              <Text style={styles.description}>
                {currentTutorialStep.description}
              </Text>

              {/* Key Features */}
              <View style={styles.featuresContainer}>
                {currentTutorialStep.keyFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Next Action */}
              {currentTutorialStep.nextAction && (
                <Text style={styles.nextAction}>
                  {currentTutorialStep.nextAction}
                </Text>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* See in App Button */}
              {currentTutorialStep.showSeeInApp && !isFirstStep && (userHasData || demoMode) && (
                <TouchableOpacity
                  style={styles.seeInAppButton}
                  onPress={handleSeeInApp}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={20} color="#2196F3" />
                  <Text style={styles.seeInAppText}>Explore in App</Text>
                  <Text style={styles.seeInAppSubtext}>(Tutorial will minimize)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.navigationButtons}>
                {/* Previous Button */}
                {!isFirstStep && (
                  <TouchableOpacity
                    style={styles.previousButton}
                    onPress={handlePrevious}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={20} color="#666" />
                    <Text style={styles.previousButtonText}>Previous</Text>
                  </TouchableOpacity>
                )}

                {/* Skip Button */}
                {!isLastStep && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip Tutorial</Text>
                  </TouchableOpacity>
                )}

                {/* Next/Finish Button */}
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.9}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Get Started!' : 'Next'}
                  </Text>
                  {!isLastStep && (
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxWidth: width * 0.9,
    overflow: 'hidden',
  },
  // Minimized tutorial styles
  minimizedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  minimizedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  minimizedControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Full tutorial styles
  content: {
    padding: 24,
    alignItems: 'center',
  },
  tutorialHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  minimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  minimizeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  stepCounter: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  nextAction: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 0,
  },
  seeInAppButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginBottom: 16,
    backgroundColor: '#f3f8ff',
  },
  seeInAppText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  seeInAppSubtext: {
    color: '#2196F3',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  previousButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 4,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  minimizedOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
})
