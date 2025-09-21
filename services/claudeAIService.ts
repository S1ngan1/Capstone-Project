import { Anthropic } from '@anthropic-ai/sdk';
import { Alert } from 'react-native';

// Farm AI Agent Configuration
const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || 'your-claude-api-key';
const FARM_ASSISTANT_PROMPT = `You are an expert farm management AI assistant specializing in Vietnamese agriculture.

Your expertise includes:
- Crop cultivation and management
- Soil health and fertilization
- Pest and disease control
- Irrigation and water management
- Weather adaptation strategies
- Harvest timing optimization
- Sustainable farming practices
- Equipment maintenance
- Market timing advice

Context Guidelines:
- Always provide practical, actionable advice
- Consider Vietnamese climate and growing conditions
- Suggest cost-effective solutions for small to medium farms
- Prioritize sustainable and environmentally friendly practices
- Include specific timing recommendations when relevant
- Provide clear, step-by-step instructions

Communication Style:
- Be concise but comprehensive
- Use simple, clear language
- Provide specific measurements and quantities
- Include approximate costs when relevant
- Suggest preventive measures
- Explain the reasoning behind recommendations`;

interface SensorData {
  id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  status: string;
  timestamp: string;
}

interface FarmContext {
  farmId: string;
  farmName: string;
  farmLocation: string;
  farmNotes?: string;
  sensorData: SensorData[];
  weatherData?: any;
}

export class ClaudeAIService {
  private client: Anthropic;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor() {
    this.client = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
  }

  private formatFarmContext(context: FarmContext): string {
    const { farmName, farmLocation, farmNotes, sensorData } = context;

    let contextStr = `Farm Information:
- Name: ${farmName}
- Location: ${farmLocation}
- Notes: ${farmNotes || 'No additional notes'}

Current Sensor Readings:`;

    sensorData.forEach(sensor => {
      const status = sensor.status === 'active' ? '✅' : '⚠️';
      contextStr += `
- ${sensor.name} (${sensor.type}): ${sensor.value}${sensor.unit} ${status}`;
    });

    return contextStr;
  }

  private getSuggestedQuestions(context: FarmContext): string[] {
    const suggestions = [
      "What should I do about the current sensor readings?",
      "How can I improve soil moisture levels?",
      "What crops grow best in this location?",
      "When is the optimal harvest time?",
      "How can I prevent common plant diseases?",
      "What fertilization schedule do you recommend?",
      "How should I adjust for upcoming weather changes?",
      "What equipment maintenance is needed now?"
    ];

    // Filter suggestions based on sensor data
    const activeSuggestions: string[] = [];

    context.sensorData.forEach(sensor => {
      if (sensor.type.toLowerCase().includes('moisture') && sensor.value < 30) {
        activeSuggestions.push("How can I improve soil moisture levels?");
      }
      if (sensor.type.toLowerCase().includes('temperature') && sensor.value > 35) {
        activeSuggestions.push("How should I protect crops from high temperatures?");
      }
      if (sensor.type.toLowerCase().includes('ph') && (sensor.value < 6 || sensor.value > 8)) {
        activeSuggestions.push("How can I adjust soil pH levels?");
      }
    });

    // Return contextual suggestions if available, otherwise default ones
    return activeSuggestions.length > 0
      ? [...activeSuggestions, ...suggestions.slice(0, 4)].slice(0, 6)
      : suggestions.slice(0, 6);
  }

  async generateResponse(
    userMessage: string,
    farmContext: FarmContext
  ): Promise<{
    response: string;
    suggestedQuestions: string[];
    confidence: number;
  }> {
    try {
      const contextInfo = this.formatFarmContext(farmContext);
      const fullPrompt = `${FARM_ASSISTANT_PROMPT}

${contextInfo}

User Question: ${userMessage}

Please provide a helpful, specific response based on the farm context and sensor data provided.`;

      const message = await this.client.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          ...this.conversationHistory,
          { role: "user", content: fullPrompt }
        ]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : 'Sorry, I could not generate a response.';

      // Add to conversation history
      this.conversationHistory.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: response }
      );

      // Keep conversation history manageable
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }

      return {
        response,
        suggestedQuestions: this.getSuggestedQuestions(farmContext),
        confidence: 0.9 // Claude generally has high confidence
      };

    } catch (error) {
      console.error('Claude AI Service Error:', error);

      // Fallback response with contextual suggestions
      return {
        response: this.generateFallbackResponse(userMessage, farmContext),
        suggestedQuestions: this.getSuggestedQuestions(farmContext),
        confidence: 0.5
      };
    }
  }

  private generateFallbackResponse(userMessage: string, context: FarmContext): string {
    const lowKeywords = ['moisture', 'water', 'dry', 'irrigation'];
    const tempKeywords = ['temperature', 'hot', 'cold', 'weather'];
    const diseaseKeywords = ['disease', 'pest', 'bug', 'problem', 'sick'];

    const message = userMessage.toLowerCase();

    if (lowKeywords.some(keyword => message.includes(keyword))) {
      return `Based on your farm's sensor data, here are some general irrigation tips:

• Check soil moisture regularly (target: 40-60% for most crops)
• Water early morning or late evening to reduce evaporation
• Ensure proper drainage to prevent waterlogging
• Consider drip irrigation for water efficiency
• Monitor weather forecasts to adjust watering schedule

For specific advice about ${context.farmName}, I recommend checking your soil moisture sensors and local weather conditions.`;
    }

    if (tempKeywords.some(keyword => message.includes(keyword))) {
      return `Temperature management suggestions for ${context.farmLocation}:

• Use shade cloth during extreme heat (>35°C)
• Ensure adequate ventilation in covered areas
• Mulch around plants to regulate soil temperature
• Adjust planting times to avoid extreme temperatures
• Monitor temperature sensors regularly

Current sensor readings suggest monitoring your temperature levels closely.`;
    }

    if (diseaseKeywords.some(keyword => message.includes(keyword))) {
      return `General plant health management:

• Inspect plants weekly for early disease detection
• Ensure proper spacing for air circulation
• Remove infected plant material immediately
• Use organic fungicides preventatively
• Maintain balanced soil nutrients
• Avoid overhead watering when possible

For specific issues at ${context.farmName}, consider consulting with a local agricultural extension office.`;
    }

    return `I'm currently unable to access the full AI service, but here are some general farm management tips for ${context.farmName}:

• Monitor your sensor readings regularly
• Maintain consistent watering schedules
• Keep detailed records of all farm activities
• Check plants weekly for any issues
• Adjust practices based on seasonal changes

For detailed analysis of your current sensor data (${context.sensorData.length} sensors active), please try your question again or contact agricultural support services.`;
  }

  async getQuickSuggestions(farmContext: FarmContext): Promise<string[]> {
    return this.getSuggestedQuestions(farmContext);
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  // Analyze sensor data and provide proactive recommendations
  async analyzeCurrentConditions(farmContext: FarmContext): Promise<{
    alerts: string[];
    recommendations: string[];
    priority: 'low' | 'medium' | 'high';
  }> {
    const alerts: string[] = [];
    const recommendations: string[] = [];
    let priority: 'low' | 'medium' | 'high' = 'low';

    // Analyze each sensor
    farmContext.sensorData.forEach(sensor => {
      if (sensor.status !== 'active') {
        alerts.push(`⚠️ ${sensor.name} sensor is ${sensor.status}`);
        priority = 'high';
      }

      // Moisture analysis
      if (sensor.type.toLowerCase().includes('moisture')) {
        if (sensor.value < 20) {
          alerts.push(`💧 Low soil moisture detected: ${sensor.value}${sensor.unit}`);
          recommendations.push(`Increase irrigation for ${sensor.name} area`);
          priority = priority === 'low' ? 'medium' : priority;
        } else if (sensor.value > 80) {
          alerts.push(`🌊 High soil moisture detected: ${sensor.value}${sensor.unit}`);
          recommendations.push(`Check drainage in ${sensor.name} area`);
          priority = priority === 'low' ? 'medium' : priority;
        }
      }

      // Temperature analysis
      if (sensor.type.toLowerCase().includes('temperature')) {
        if (sensor.value > 40) {
          alerts.push(`🌡️ High temperature alert: ${sensor.value}${sensor.unit}`);
          recommendations.push(`Consider shade protection for crops`);
          priority = 'medium';
        } else if (sensor.value < 5) {
          alerts.push(`❄️ Low temperature alert: ${sensor.value}${sensor.unit}`);
          recommendations.push(`Protect sensitive crops from cold`);
          priority = 'high';
        }
      }

      // pH analysis
      if (sensor.type.toLowerCase().includes('ph')) {
        if (sensor.value < 6 || sensor.value > 8) {
          alerts.push(`⚖️ Soil pH out of optimal range: ${sensor.value}`);
          recommendations.push(`Consider soil amendment to adjust pH`);
          priority = priority === 'low' ? 'medium' : priority;
        }
      }
    });

    // Default recommendations if no specific issues
    if (recommendations.length === 0) {
      recommendations.push('All sensors show normal readings - continue current management practices');
      recommendations.push('Consider routine equipment maintenance');
      recommendations.push('Monitor weather forecasts for planning ahead');
    }

    return { alerts, recommendations, priority };
  }
}

export default new ClaudeAIService();
