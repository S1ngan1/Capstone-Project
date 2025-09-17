import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ChatMessage } from '../services/aiChatService'

interface ChatBubbleProps {
  message: ChatMessage
  onActionPress?: (action: string) => void
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onActionPress }) => {
  const isUser = message.role === 'user'
  const isAI = message.role === 'assistant'

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
      {isAI && (
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
          <Text style={styles.aiName}>Dr. AgriBot</Text>
          <Text style={styles.aiTitle}>Agricultural Specialist</Text>
        </View>
      )}

      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>

        {/* Show suggested actions for AI messages */}
        {message.metadata?.suggestedActions && message.metadata.suggestedActions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsLabel}>Suggested Actions:</Text>
            {message.metadata.suggestedActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => onActionPress?.(action)}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                <Text style={styles.actionText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Show confidence level for AI responses */}
        {message.metadata?.confidence && message.metadata.confidence > 0.8 && (
          <View style={styles.confidenceContainer}>
            <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
            <Text style={styles.confidenceText}>High Confidence Recommendation</Text>
          </View>
        )}
      </View>

      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
        {formatTimestamp(message.timestamp)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  aiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginRight: 8,
  },
  aiTitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  actionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    marginBottom: 4,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8',
  },
  confidenceText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 8,
  },
  userTimestamp: {
    color: '#666',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
    textAlign: 'left',
  },
})
