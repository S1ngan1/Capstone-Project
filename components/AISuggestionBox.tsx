import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AIChatService, { AIResponse, UserFarmData } from '../services/aiChatService';

interface AISuggestionBoxProps {
  farmData?: UserFarmData | null;
  onSuggestionApplied?: (suggestion: string) => void;
  style?: any;
}

const AISuggestionBox: React.FC<AISuggestionBoxProps> = ({
  farmData,
  onSuggestionApplied,
  style
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [chatService] = useState(() => new AIChatService());
  const [isExpanded, setIsExpanded] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({
    isOnline: false,
    isQuotaExceeded: false,
    hasApiKey: false
  });

  useEffect(() => {
    // Check service status on mount
    updateServiceStatus();

    // Reset quota status periodically
    const statusInterval = setInterval(() => {
      chatService.resetQuotaStatus();
      updateServiceStatus();
    }, 60000); // Check every minute

    return () => clearInterval(statusInterval);
  }, []);

  const updateServiceStatus = () => {
    const status = chatService.getServiceStatus();
    setServiceStatus(status);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Input Required', 'Please enter your farming question or concern.');
      return;
    }

    setIsLoading(true);
    try {
      const aiResponse = await chatService.sendMessage(message, farmData);
      setResponse(aiResponse);
      setMessage('');
      updateServiceStatus();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Connection Error',
        'Unable to get AI response. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    Alert.alert(
      'Apply Suggestion',
      `Would you like to apply this suggestion: "${suggestion}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            onSuggestionApplied?.(suggestion);
            Alert.alert('Suggestion Applied', 'The suggestion has been noted in your farm records.');
          }
        }
      ]
    );
  };

  const getStatusColor = () => {
    if (serviceStatus.isOnline) return '#4CAF50';
    if (serviceStatus.isQuotaExceeded) return '#FF9800';
    return '#F44336';
  };

  const getStatusText = () => {
    if (serviceStatus.isOnline) return 'AI Online';
    if (serviceStatus.isQuotaExceeded) return 'Quota Exceeded - Offline Mode';
    if (!serviceStatus.hasApiKey) return 'No API Key - Offline Mode';
    return 'AI Offline';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="smart-toy" size={24} color="#2196F3" />
          <Text style={styles.headerTitle}>Dr. AgriBot AI Assistant</Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        </View>
        <MaterialIcons
          name={isExpanded ? "expand-less" : "expand-more"}
          size={24}
          color="#666"
        />
      </TouchableOpacity>

      {/* Status */}
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>

      {isExpanded && (
        <>
          {/* Input Section */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me about soil, crops, pests, irrigation, or any farming question..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, { opacity: isLoading ? 0.6 : 1 }]}
              onPress={handleSendMessage}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialIcons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Response Section */}
          {response && (
            <ScrollView style={styles.responseSection} showsVerticalScrollIndicator={false}>
              {/* AI Response */}
              <View style={[
                styles.responseCard,
                { backgroundColor: response.isOffline ? '#FFF3E0' : '#F3F7FF' }
              ]}>
                {response.isOffline && (
                  <View style={styles.offlineIndicator}>
                    <MaterialIcons name="cloud-off" size={16} color="#FF9800" />
                    <Text style={styles.offlineText}>Offline Mode</Text>
                  </View>
                )}

                <Text style={styles.responseText}>{response.content}</Text>

                {response.error && (
                  <Text style={styles.errorText}>
                    ⚠️ {response.error}
                  </Text>
                )}
              </View>

              {/* Suggestions */}
              {response.suggestions && response.suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>💡 Quick Actions:</Text>
                  {response.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestionPress(suggestion)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                      <MaterialIcons name="arrow-forward-ios" size={12} color="#2196F3" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* Farm Context Info */}
          {farmData && farmData.farms.length > 0 && (
            <View style={styles.contextInfo}>
              <MaterialIcons name="info" size={14} color="#666" />
              <Text style={styles.contextText}>
                Analyzing data for {farmData.farms[0].name} farm
                {farmData.farms[0].sensors.length > 0 &&
                  ` (${farmData.farms[0].sensors.length} sensors)`
                }
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: '500',
  },
  inputSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseSection: {
    maxHeight: 300,
    paddingHorizontal: 16,
  },
  responseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  suggestionText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  contextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  contextText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default AISuggestionBox;
