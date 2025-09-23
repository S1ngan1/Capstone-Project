import { OpenAI } from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface FarmContext {
  farmId?: string;
  farmName?: string;
  location?: string;
  sensorData?: {
    temperature?: number;
    humidity?: number;
    soilMoisture?: number;
    ph?: number;
    [key: string]: any;
  };
  weatherData?: {
    temperature?: number;
    humidity?: number;
    conditions?: string;
  };
  notes?: string;
}

export interface AIResponse {
  content: string;
  suggestions?: string[];
  isOffline?: boolean;
  error?: string;
}

class GitHubCopilotFarmingAgent {
  private openai: OpenAI | null = null;
  private isQuotaExceeded = false;
  private lastQuotaCheck = 0;
  private readonly QUOTA_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error);
        this.openai = null;
      }
    } else {
      console.warn('OpenAI API key not found. AI features will use offline mode.');
    }
  }

  async generateResponse(
    message: string,
    context: FarmContext = {},
    conversationHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    // Check if we should retry after quota error
    if (this.isQuotaExceeded && Date.now() - this.lastQuotaCheck < this.QUOTA_CHECK_INTERVAL) {
      return this.getOfflineFallbackResponse(message, context);
    }

    // Try OpenAI API if available
    if (this.openai && !this.isQuotaExceeded) {
      try {
        return await this.callOpenAI(message, context, conversationHistory);
      } catch (error: any) {
        console.error('GitHub Copilot Farming Agent Error:', error);

        // Handle quota exceeded error
        if (error.message && error.message.includes('429')) {
          this.isQuotaExceeded = true;
          this.lastQuotaCheck = Date.now();
          console.warn('OpenAI quota exceeded. Switching to offline mode.');
          return this.getQuotaExceededResponse(message, context);
        }

        // Handle other API errors
        return this.getErrorFallbackResponse(message, context, error);
      }
    }

    // Fallback to offline response
    return this.getOfflineFallbackResponse(message, context);
  }

  private async callOpenAI(
    message: string,
    context: FarmContext,
    conversationHistory: ChatMessage[]
  ): Promise<AIResponse> {
    const systemPrompt = this.createSystemPrompt(context);

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 8 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-8);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    messages.push({ role: 'user', content: message });

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = response.choices[0]?.message?.content ||
      "I apologize, but I couldn't generate a proper response. Please try asking your question again.";

    return {
      content,
      suggestions: this.extractSuggestions(content),
    };
  }

  private createSystemPrompt(context: FarmContext): string {
    let prompt = `You are Dr. AgriBot, a world-renowned agricultural specialist with 30+ years of experience in farming, soil science, and sustainable agriculture.

YOUR EXPERTISE:
🌱 Soil chemistry, pH management, crop rotation
🔬 Pest/disease identification and treatment
💧 Water management and irrigation systems
🌿 Organic farming and sustainability
📊 Sensor data analysis and precision agriculture

COMMUNICATION STYLE:
- Friendly, knowledgeable, and encouraging
- Use farmer-friendly language while being scientifically accurate
- Provide practical, actionable advice
- Use emojis and formatting for better readability
- Always prioritize safety and environmental protection

`;

    if (context.farmName || context.location) {
      prompt += `\nCURRENT FARM CONTEXT:\n`;
      if (context.farmName) prompt += `Farm: ${context.farmName}\n`;
      if (context.location) prompt += `Location: ${context.location}\n`;
    }

    if (context.sensorData) {
      prompt += `\nREAL-TIME SENSOR DATA:\n`;
      Object.entries(context.sensorData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          prompt += `${key}: ${value}\n`;
        }
      });
    }

    if (context.weatherData) {
      prompt += `\nWEATHER CONDITIONS:\n`;
      if (context.weatherData.temperature) prompt += `Temperature: ${context.weatherData.temperature}°C\n`;
      if (context.weatherData.humidity) prompt += `Humidity: ${context.weatherData.humidity}%\n`;
      if (context.weatherData.conditions) prompt += `Conditions: ${context.weatherData.conditions}\n`;
    }

    if (context.notes) {
      prompt += `\nFARMER'S NOTES: ${context.notes}\n`;
    }

    prompt += `\nIMPORTANT: Reference the specific farm data in your response when relevant. Provide personalized advice based on their actual conditions.`;

    return prompt;
  }

  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];

    // Extract numbered suggestions
    const numberedMatches = content.match(/\d+\.\s*(.+?)(?=\n\d+\.|\n\n|$)/g);
    if (numberedMatches) {
      suggestions.push(...numberedMatches.map(s => s.replace(/^\d+\.\s*/, '').trim()));
    }

    // Extract bullet point suggestions
    const bulletMatches = content.match(/[•\-\*]\s*(.+?)(?=\n[•\-\*]|\n\n|$)/g);
    if (bulletMatches) {
      suggestions.push(...bulletMatches.map(s => s.replace(/^[•\-\*]\s*/, '').trim()));
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  private getQuotaExceededResponse(message: string, context: FarmContext): AIResponse {
    const farmInfo = context.farmName ? ` for your ${context.farmName} farm` : '';

    return {
      content: `🤖 I'm currently experiencing high demand and my OpenAI quota has been reached. However, I can still help you${farmInfo}!\n\n` +
               this.getOfflineAdvice(message, context) +
               `\n\n💡 **Tip**: My full AI capabilities will be restored soon. In the meantime, try asking specific questions about farming techniques, and I'll provide you with expert guidance based on my agricultural knowledge base.`,
      isOffline: true,
      suggestions: this.getOfflineSuggestions(message),
      error: 'API quota exceeded - using offline mode'
    };
  }

  private getOfflineFallbackResponse(message: string, context: FarmContext): AIResponse {
    return {
      content: `🌱 **Dr. AgriBot (Offline Mode)**\n\n` + this.getOfflineAdvice(message, context),
      isOffline: true,
      suggestions: this.getOfflineSuggestions(message)
    };
  }

  private getErrorFallbackResponse(message: string, context: FarmContext, error: any): AIResponse {
    return {
      content: `🤖 I encountered a technical issue but I'm still here to help!\n\n` +
               this.getOfflineAdvice(message, context) +
               `\n\n🔧 If this issue persists, please try again in a few moments.`,
      isOffline: true,
      suggestions: this.getOfflineSuggestions(message),
      error: error.message || 'Unknown API error'
    };
  }

  private getOfflineAdvice(message: string, context: FarmContext): string {
    const lowerMessage = message.toLowerCase();

    // Soil-related advice
    if (lowerMessage.includes('soil') || lowerMessage.includes('ph')) {
      return `🌱 **Soil Health Tips:**\n• Test your soil pH regularly (ideal range: 6.0-7.0 for most crops)\n• Add organic matter like compost to improve soil structure\n• Consider crop rotation to maintain soil nutrients\n• Avoid overworking wet soil to prevent compaction`;
    }

    // Water-related advice
    if (lowerMessage.includes('water') || lowerMessage.includes('irrigation')) {
      return `💧 **Water Management:**\n• Water deeply but less frequently to encourage deep root growth\n• Check soil moisture 2-3 inches deep before watering\n• Water early morning to reduce evaporation\n• Consider drip irrigation for water efficiency`;
    }

    // Pest-related advice
    if (lowerMessage.includes('pest') || lowerMessage.includes('insect') || lowerMessage.includes('bug')) {
      return `🐛 **Integrated Pest Management:**\n• Inspect plants regularly for early pest detection\n• Encourage beneficial insects with diverse plantings\n• Use organic methods like neem oil for minor infestations\n• Remove affected plant parts to prevent spread`;
    }

    // Plant care advice
    if (lowerMessage.includes('plant') || lowerMessage.includes('grow') || lowerMessage.includes('crop')) {
      return `🌿 **General Plant Care:**\n• Ensure adequate spacing for air circulation\n• Mulch around plants to retain moisture and suppress weeds\n• Monitor for signs of nutrient deficiency (yellowing leaves, stunted growth)\n• Harvest at optimal times for best flavor and nutrition`;
    }

    // Default advice with context
    let advice = `🌾 **General Farming Guidance:**\n• Regular monitoring is key to successful farming\n• Keep detailed records of your farming activities\n• Consider seasonal variations in your planning`;

    if (context.sensorData) {
      advice += `\n• Your sensor data shows valuable insights - use it to make informed decisions`;

      if (context.sensorData.soilMoisture !== undefined) {
        if (context.sensorData.soilMoisture < 30) {
          advice += `\n• Your soil moisture (${context.sensorData.soilMoisture}%) seems low - consider watering`;
        } else if (context.sensorData.soilMoisture > 80) {
          advice += `\n• Your soil moisture (${context.sensorData.soilMoisture}%) seems high - ensure good drainage`;
        }
      }

      if (context.sensorData.ph !== undefined) {
        if (context.sensorData.ph < 6.0) {
          advice += `\n• Your soil pH (${context.sensorData.ph}) is acidic - consider adding lime`;
        } else if (context.sensorData.ph > 7.5) {
          advice += `\n• Your soil pH (${context.sensorData.ph}) is alkaline - consider adding sulfur`;
        }
      }
    }

    return advice;
  }

  private getOfflineSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('soil')) {
      return [
        "Test soil pH levels",
        "Add organic compost",
        "Check for compaction",
        "Consider crop rotation"
      ];
    }

    if (lowerMessage.includes('water')) {
      return [
        "Check soil moisture levels",
        "Adjust irrigation schedule",
        "Install drip irrigation",
        "Monitor weather forecast"
      ];
    }

    if (lowerMessage.includes('pest')) {
      return [
        "Inspect plants daily",
        "Remove affected leaves",
        "Apply organic pest control",
        "Encourage beneficial insects"
      ];
    }

    return [
      "Monitor crop health regularly",
      "Keep farming records updated",
      "Check weather conditions",
      "Review sensor data trends"
    ];
  }

  // Reset quota status (can be called periodically)
  resetQuotaStatus(): void {
    if (this.isQuotaExceeded && Date.now() - this.lastQuotaCheck > this.QUOTA_CHECK_INTERVAL) {
      this.isQuotaExceeded = false;
      console.log('OpenAI quota status reset - attempting to reconnect');
    }
  }

  // Get service status
  getServiceStatus(): { isOnline: boolean, isQuotaExceeded: boolean, hasApiKey: boolean } {
    return {
      isOnline: !!this.openai && !this.isQuotaExceeded,
      isQuotaExceeded: this.isQuotaExceeded,
      hasApiKey: !!this.openai
    };
  }
}

export default GitHubCopilotFarmingAgent;
