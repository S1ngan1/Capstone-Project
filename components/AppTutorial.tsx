import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useTutorial } from '../context/TutorialContext'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')
const isSmallDevice = width < 350 || height < 600
const isMediumDevice = width >= 350 && width <= 400

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: string
  keyFeatures: string[]
  screen?: string
  showSeeInApp?: boolean
  gradient: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🌾 Welcome to Smart Farm Assistant',
    description: 'Your AI-powered farming companion! Let me show you how to get the most out of our app.',
    icon: 'leaf',
    gradient: ['#4CAF50', '#45A049', '#388E3C'],
    keyFeatures: [
      'AI-powered farming recommendations',
      'Real-time sensor monitoring',
      'Weather-based insights',
      'Farm management tools'
    ],
    showSeeInApp: false
  },
  {
    id: 'farm-details',
    title: '📊 Farm Management',
    description: 'Each farm has detailed information including sensor data, weather, and AI suggestions.',
    icon: 'analytics',
    screen: 'FarmDetails',
    gradient: ['#FF9800', '#F57C00', '#E65100'],
    keyFeatures: [
      'Real-time sensor readings',
      'Weather forecasts',
      'AI-powered suggestions',
      'Historical data charts'
    ],
    showSeeInApp: true
  },
  {
    id: 'ai-chat',
    title: '🤖 AI Farming Assistant',
    description: 'Chat with our AI specialist for personalized farming advice based on your farm data.',
    icon: 'chatbubble-ellipses',
    screen: 'Suggestion',
    gradient: ['#9C27B0', '#7B1FA2', '#6A1B9A'],
    keyFeatures: [
      'Personalized farming advice',
      'Weather-based recommendations',
      'Crop management tips',
      'Problem-solving assistance'
    ],
    showSeeInApp: true
  },
  {
    id: 'notifications',
    title: '🔔 Stay Updated',
    description: 'Never miss important updates about your farms, sensors, and weather alerts.',
    icon: 'notifications',
    screen: 'Notification',
    gradient: ['#F44336', '#D32F2F', '#C62828'],
    keyFeatures: [
      'Sensor alerts',
      'Weather warnings',
      'Farm activity updates',
      'AI suggestion notifications'
    ],
    showSeeInApp: true
  },
  {
    id: 'get-started',
    title: '🚀 You\'re All Set!',
    description: 'You\'re ready to start your smart farming journey. Begin by adding your first farm!',
    icon: 'rocket',
    gradient: ['#4CAF50', '#45A049', '#388E3C'],
    keyFeatures: [
      'Add your first farm',
      'Set up sensors',
      'Start monitoring',
      'Get AI recommendations'
    ],
    showSeeInApp: false
  }
]

const AppTutorial: React.FC = () => {
  const navigation = useNavigation()
  const {
    showTutorial,
    currentStep,
    isMinimized,
    closeTutorial,
    minimizeTutorial,
    maximizeTutorial,
    setCurrentStep,
    setNavigateToDemo
  } = useTutorial()

  const [fadeAnim] = useState(new Animated.Value(1))

  // Set up navigation function in context - Fixed to prevent setState during render
  useEffect(() => {
    // Use setTimeout to ensure this runs after the current render cycle
    const timeoutId = setTimeout(() => {
      setNavigateToDemo((screen: string) => {
        // Fix navigation call with proper typing
        switch (screen) {
          case 'Home':
            navigation.navigate('Home' as never)
            break
          case 'FarmDetails':
            // For FarmDetails, we need a farmId parameter, so navigate to Home instead
            navigation.navigate('Home' as never)
            break
          case 'Suggestion':
            navigation.navigate('Suggestion' as never)
            break
          case 'Notification':
            navigation.navigate('Notification' as never)
            break
          default:
            navigation.navigate('Home' as never)
            break
        }
      })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [navigation, setNavigateToDemo])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Advance to next step
      setCurrentStep(currentStep + 1)

      // Get the next step
      const nextStep = tutorialSteps[currentStep + 1]

      // If the next step has a screen, minimize tutorial and navigate
      if (nextStep.screen) {
        minimizeTutorial()
        switch (nextStep.screen) {
          case 'Home':
            navigation.navigate('Home' as never)
            break
          case 'Suggestion':
            navigation.navigate('Suggestion' as never)
            break
          case 'Notification':
            navigation.navigate('Notification' as never)
            break
          case 'FarmDetails':
            // For FarmDetails, fallback to Home since we need farmId
            navigation.navigate('Home' as never)
            break
          default:
            navigation.navigate('Home' as never)
            break
        }
      } else {
        // If no screen to show, just advance with animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start()
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
      setCurrentStep(currentStep - 1)
    }
  }

  const handleMinimizedNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)

      // Auto-navigate to the next step's screen if it has one
      const nextStep = tutorialSteps[currentStep + 1]
      if (nextStep.screen) {
        switch (nextStep.screen) {
          case 'Home':
            navigation.navigate('Home' as never)
            break
          case 'Suggestion':
            navigation.navigate('Suggestion' as never)
            break
          case 'Notification':
            navigation.navigate('Notification' as never)
            break
          case 'FarmDetails':
            // For FarmDetails, fallback to Home since we need farmId
            navigation.navigate('Home' as never)
            break
          default:
            break
        }
      }
    } else {
      // If it's the last step, close the tutorial
      closeTutorial()
    }
  }

  const handleMinimizedPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    closeTutorial()
  }

  // Don't render anything if tutorial is not active
  if (!showTutorial) {
    return null
  }

  const currentTutorialStep = tutorialSteps[currentStep]

  // Render floating minimized bar
  if (isMinimized) {
    return (
      <View style={styles.floatingContainer}>
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.floatingBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={maximizeTutorial} style={styles.floatingContent}>
            <Ionicons name={currentTutorialStep.icon as any} size={20} color="#fff" />
            <Text style={styles.floatingTitle}>Tutorial: {currentStep + 1}/{tutorialSteps.length}</Text>
            <Text style={styles.floatingSubtitle} numberOfLines={1}>{currentTutorialStep.title}</Text>
          </TouchableOpacity>

          <View style={styles.floatingControls}>
            <TouchableOpacity
              onPress={handleMinimizedPrevious}
              style={[styles.floatingButton, currentStep === 0 && styles.disabledFloatingButton]}
              disabled={currentStep === 0}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={currentStep === 0 ? "rgba(255,255,255,0.3)" : "#fff"}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleMinimizedNext} style={styles.floatingButton}>
              <Ionicons
                name={currentStep < tutorialSteps.length - 1 ? "chevron-forward" : "close"}
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    )
  }

  // Render full tutorial modal
  return (
    <Modal
      visible={showTutorial}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeTutorial}
    >
      <StatusBar backgroundColor="transparent" translucent />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <LinearGradient
              colors={currentTutorialStep.gradient}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.progressContainer}>
                  <Text style={styles.stepIndicator}>
                    {currentStep + 1} / {tutorialSteps.length}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }
                      ]}
                    />
                  </View>
                </View>
                <TouchableOpacity onPress={closeTutorial} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <View style={styles.iconContainer}>
                    <View style={styles.iconBackground}>
                      <Ionicons
                        name={currentTutorialStep.icon as any}
                        size={isSmallDevice ? 60 : 70}
                        color="#fff"
                      />
                    </View>
                  </View>

                  <Text style={styles.title}>{currentTutorialStep.title}</Text>
                  <Text style={styles.description}>{currentTutorialStep.description}</Text>

                  <View style={styles.featuresContainer}>
                    <Text style={styles.featuresTitle}>✨ Key Features</Text>
                    <View style={styles.featuresGrid}>
                      {currentTutorialStep.keyFeatures.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <View style={styles.featureBullet}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </Animated.View>

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                <View style={styles.navigationRow}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      styles.previousButton,
                      currentStep === 0 && styles.disabledButton
                    ]}
                    onPress={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={currentStep === 0 ? "rgba(255,255,255,0.3)" : "#fff"}
                    />
                    <Text style={[
                      styles.navButtonText,
                      currentStep === 0 && styles.disabledText
                    ]}>
                      Previous
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>Skip Tutorial</Text>
                  </TouchableOpacity>

                  {currentStep < tutorialSteps.length - 1 ? (
                    <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={handleNext}>
                      <Text style={styles.navButtonText}>
                        {tutorialSteps[currentStep + 1].screen ? 'Next & See' : 'Next'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.navButton, styles.finishButton]} onPress={closeTutorial}>
                      <Text style={styles.navButtonText}>Get Started</Text>
                      <Ionicons name="rocket" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 20 : 24,
    paddingVertical: 40,
  },
  container: {
    maxHeight: height * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  stepIndicator: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: isSmallDevice ? 16 : 18,
    color: '#fff',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 24 : 26,
    marginBottom: 32,
    opacity: 0.95,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: isSmallDevice ? 90 : 110,
    justifyContent: 'center',
    gap: 6,
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  finishButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  // Floating tutorial bar styles
  floatingContainer: {
    position: 'absolute',
    bottom: 100, // Above bottom navigation
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 4,
    flex: 1,
  },
  floatingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledFloatingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
})

export default AppTutorial
