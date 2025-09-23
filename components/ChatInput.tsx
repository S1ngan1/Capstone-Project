import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  placeholder?: string
  userFarms?: Array<{
    id: string
    name: string
    location: string
  }>
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask Dr. AgriBot anything about farming...",
  userFarms = []
}) => {
  const [message, setMessage] = useState('')
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null)

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      let finalMessage = message.trim()

      // Add farm context if selected
      if (selectedFarm && userFarms.length > 1) {
        const farm = userFarms.find(f => f.id === selectedFarm)
        if (farm) {
          finalMessage = `Regarding my ${farm.name} farm: ${finalMessage}`
        }
      }

      onSendMessage(finalMessage)
      setMessage('')
    }
  }

  const handleQuickQuestion = (question: string) => {
    let finalQuestion = question

    // Add farm context if selected
    if (selectedFarm && userFarms.length > 1) {
      const farm = userFarms.find(f => f.id === selectedFarm)
      if (farm) {
        finalQuestion = `For my ${farm.name} farm: ${question}`
      }
    }

    onSendMessage(finalQuestion)
  }

  const quickQuestions = [
    "How's my soil pH?",
    "When should I water?",
    "What fertilizer do I need?",
    "Help with pest control"
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Farm Selector - only show if user has multiple farms */}
      {userFarms.length > 1 && (
        <View style={styles.farmSelectorContainer}>
          <Text style={styles.farmSelectorLabel}>Select Farm for Context:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmSelector}>
            <TouchableOpacity
              style={[styles.farmChip, !selectedFarm && styles.farmChipSelected]}
              onPress={() => setSelectedFarm(null)}
            >
              <Text style={[styles.farmChipText, !selectedFarm && styles.farmChipTextSelected]}>
                All Farms
              </Text>
            </TouchableOpacity>
            {userFarms.map((farm) => (
              <TouchableOpacity
                key={farm.id}
                style={[styles.farmChip, selectedFarm === farm.id && styles.farmChipSelected]}
                onPress={() => setSelectedFarm(farm.id)}
              >
                <Ionicons name="business" size={12} color={selectedFarm === farm.id ? "white" : "#1976D2"} />
                <Text style={[styles.farmChipText, selectedFarm === farm.id && styles.farmChipTextSelected]}>
                  {farm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Question Buttons */}
      <View style={styles.quickQuestionsContainer}>
        <Text style={styles.quickQuestionsLabel}>
          Quick Questions{selectedFarm && userFarms.length > 1 ?
            ` for ${userFarms.find(f => f.id === selectedFarm)?.name || 'All Farms'}:` :
            ':'
          }
        </Text>
        <View style={styles.quickQuestions}>
          {quickQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickQuestionButton}
              onPress={() => handleQuickQuestion(question)}
              disabled={isLoading}
            >
              <Text style={styles.quickQuestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <Ionicons name="hourglass" size={20} color="#999" />
            ) : (
              <Ionicons name="send" size={20} color={message.trim() ? "#4A90E2" : "#999"} />
            )}
          </TouchableOpacity>
        </View>

        {/* Character count */}
        <Text style={styles.characterCount}>
          {message.length}/500
        </Text>
      </View>

      {/* AI Status */}
      <View style={styles.statusContainer}>
        <View style={styles.aiStatus}>
          <View style={[styles.statusDot, isLoading ? styles.loadingDot : styles.readyDot]} />
          <Text style={styles.statusText}>
            {isLoading ? 'Dr. AgriBot is thinking...' : 'Dr. AgriBot is ready to help'}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  farmSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  farmSelectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  farmSelector: {
    flexDirection: 'row',
  },
  farmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  farmChipSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  farmChipText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
    marginLeft: 4,
  },
  farmChipTextSelected: {
    color: 'white',
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickQuestionsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 6,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickQuestionButton: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  characterCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  statusContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  readyDot: {
    backgroundColor: '#4CAF50',
  },
  loadingDot: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
})
