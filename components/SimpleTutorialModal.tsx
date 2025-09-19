import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const { width, height } = Dimensions.get('window')
const isSmallDevice = width < 350 || height < 600

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: string
  keyFeatures: string[]
  screen?: string
}

interface SimpleTutorialProps {
  visible: boolean
  onClose: () => void
  onNavigateToDemo?: (screen: string) => void
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '🌾 Welcome to Smart Farm Assistant',
    description: 'Your AI-powered farming companion! Let me show you how to get the most out of our app.',
    icon: 'leaf',
    keyFeatures: [
      'AI-powered farming recommendations',
      'Real-time sensor monitoring',
      'Weather-based insights',
      'Farm management tools'
    ]
  },
  {
    id: 'farms',
    title: '🏡 Farm Management',
    description: 'View and manage all your farms in one place. See real-time data from sensors and get AI suggestions.',
    icon: 'home',
    screen: 'Home',
    keyFeatures: [
      'Add multiple farms',
      'View farm details and analytics',
      'Monitor sensor data',
      'Weather information for each farm'
    ]
  },
  {
    id: 'sensors',
    title: '📊 Sensor Monitoring',
    description: 'Keep track of your farm conditions with real-time sensor data and automated alerts.',
    icon: 'pulse',
    screen: 'FarmDetails',
    keyFeatures: [
      'Temperature monitoring',
      'Humidity tracking',
      'Soil moisture levels',
      'Light intensity measurements'
    ]
  },
  {
    id: 'ai-chat',
    title: '🤖 AI Assistant',
    description: 'Get personalized farming advice from our AI specialist. Ask questions and get expert recommendations.',
    icon: 'chatbubble-ellipses',
    screen: 'Suggestion',
    keyFeatures: [
      'Personalized farming advice',
      'Weather-based recommendations',
      'Crop management tips',
      'Problem diagnosis help'
    ]
  },
  {
    id: 'notifications',
    title: '🔔 Stay Updated',
    description: 'Never miss important updates about your farms, sensors, and weather alerts.',
    icon: 'notifications',
    screen: 'Notification',
    keyFeatures: [
      'Sensor alerts',
      'Weather warnings',
      'Farm activity updates',
      'AI suggestions notifications'
    ]
  }
]

export const InteractiveTutorial: React.FC<SimpleTutorialProps> = ({
  visible,
  onClose,
  onNavigateToDemo
}) => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSeeInApp = () => {
    const currentTutorialStep = tutorialSteps[currentStep]
    if (currentTutorialStep.screen && onNavigateToDemo) {
      onNavigateToDemo(currentTutorialStep.screen)
    }
    onClose()
  }

  const currentTutorialStep = tutorialSteps[currentStep]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.gradient}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.stepIndicator}>
                  {currentStep + 1} of {tutorialSteps.length}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={currentTutorialStep.icon as any}
                    size={isSmallDevice ? 50 : 60}
                    color="#fff"
                  />
                </View>

                <Text style={styles.title}>{currentTutorialStep.title}</Text>
                <Text style={styles.description}>{currentTutorialStep.description}</Text>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Key Features:</Text>
                  {currentTutorialStep.keyFeatures.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
                  onPress={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <Text style={[styles.navButtonText, currentStep === 0 && styles.disabledText]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                {currentTutorialStep.screen && currentStep > 0 && (
                  <TouchableOpacity style={styles.demoButton} onPress={handleSeeInApp}>
                    <Text style={styles.navButtonText}>See in App</Text>
                  </TouchableOpacity>
                )}

                {currentStep < tutorialSteps.length - 1 ? (
                  <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                    <Text style={styles.navButtonText}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.navButton} onPress={onClose}>
                    <Text style={styles.navButtonText}>Get Started</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 16 : 20,
  },
  container: {
    maxHeight: height * 0.8,
    borderRadius: isSmallDevice ? 12 : 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: isSmallDevice ? 20 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : 20,
  },
  title: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: isSmallDevice ? 12 : 16,
  },
  description: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: isSmallDevice ? 20 : 24,
    marginBottom: isSmallDevice ? 20 : 24,
    opacity: 0.9,
  },
  featuresContainer: {
    marginBottom: isSmallDevice ? 20 : 24,
  },
  featuresTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: isSmallDevice ? 12 : 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButton: {
    paddingVertical: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 16 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: isSmallDevice ? 80 : 100,
  },
  demoButton: {
    paddingVertical: isSmallDevice ? 10 : 12,
    paddingHorizontal: isSmallDevice ? 16 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: isSmallDevice ? 6 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    color: '#fff',
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
})

export default InteractiveTutorial
