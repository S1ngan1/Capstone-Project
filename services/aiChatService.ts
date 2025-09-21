import GitHubCopilotFarmingAgent, { ChatMessage, FarmContext, AIResponse } from './openaiAIService';

export interface UserFarmData {
  farms: Array<{
    id: string;
    name: string;
    location: string;
    notes?: string;
    sensors: Array<{
      id: string;
      name: string;
      type: string;
      latestReading?: {
        value: number;
        unit: string;
        timestamp: string;
      };
    }>;
  }>;
}

export { ChatMessage, FarmContext, AIResponse };

class AIChatService {
  private agent: GitHubCopilotFarmingAgent;
  private conversationHistory: ChatMessage[] = [];
  private userFarmData: UserFarmData | null = null;
  private readonly MAX_HISTORY = 20;

  constructor() {
    this.agent = new GitHubCopilotFarmingAgent();
  }

  async sendMessage(
    message: string,
    farmData?: UserFarmData | null,
    additionalContext?: Partial<FarmContext>
  ): Promise<AIResponse> {
    try {
      // Build context from farm data
      const context: FarmContext = {
        ...additionalContext,
        ...(farmData && farmData.farms.length > 0 ? this.buildContextFromFarmData(farmData.farms[0]) : {})
      };

      // Generate response
      const response = await this.agent.generateResponse(
        message,
        context,
        this.conversationHistory
      );

      // Add to conversation history
      this.addToHistory('user', message);
      this.addToHistory('assistant', response.content);

      return response;
    } catch (error) {
      console.error('AI Chat Service Error:', error);

      // Return a safe fallback response
      return {
        content: `🤖 I apologize, but I'm experiencing technical difficulties right now. However, I can still provide some basic farming guidance!\n\n🌱 **Quick Tips:**\n• Regular monitoring is essential for healthy crops\n• Keep your soil well-drained but moist\n• Watch for signs of pests or disease\n• Consider seasonal changes in your care routine\n\nPlease try asking your question again in a moment, and I should be able to provide more detailed assistance.`,
        isOffline: true,
        error: 'Service temporarily unavailable'
      };
    }
  }

  private buildContextFromFarmData(farm: UserFarmData['farms'][0]): FarmContext {
    const context: FarmContext = {
      farmId: farm.id,
      farmName: farm.name,
      location: farm.location,
      notes: farm.notes
    };

    // Extract sensor data
    if (farm.sensors.length > 0) {
      const sensorData: any = {};

      farm.sensors.forEach(sensor => {
        if (sensor.latestReading) {
          const key = sensor.type.toLowerCase().replace(/\s+/g, '');
          sensorData[key] = sensor.latestReading.value;
        }
      });

      if (Object.keys(sensorData).length > 0) {
        context.sensorData = sensorData;
      }
    }

    return context;
  }

  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep history manageable
    if (this.conversationHistory.length > this.MAX_HISTORY) {
      this.conversationHistory = this.conversationHistory.slice(-this.MAX_HISTORY);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  getServiceStatus() {
    return this.agent.getServiceStatus();
  }

  resetQuotaStatus(): void {
    this.agent.resetQuotaStatus();
  }

  // Get farming tips based on current conditions
  async getFarmingTips(farmData?: UserFarmData | null): Promise<string[]> {
    try {
      if (!farmData || farmData.farms.length === 0) {
        return [
          "Set up your farm profile for personalized tips",
          "Install sensors to monitor soil conditions",
          "Keep a farming journal to track progress",
          "Plan seasonal activities in advance"
        ];
      }

      const farm = farmData.farms[0];
      const tips: string[] = [];

      // Sensor-based tips
      if (farm.sensors.length > 0) {
        farm.sensors.forEach(sensor => {
          if (sensor.latestReading) {
            const value = sensor.latestReading.value;

            switch (sensor.type.toLowerCase()) {
              case 'soil moisture':
                if (value < 30) {
                  tips.push(`Your soil moisture is low (${value}%) - consider watering`);
                } else if (value > 80) {
                  tips.push(`Your soil moisture is high (${value}%) - check drainage`);
                }
                break;

              case 'ph':
              case 'soil ph':
                if (value < 6.0) {
                  tips.push(`Soil pH is acidic (${value}) - consider adding lime`);
                } else if (value > 7.5) {
                  tips.push(`Soil pH is alkaline (${value}) - consider adding sulfur`);
                }
                break;

              case 'temperature':
                if (value < 10) {
                  tips.push(`Low temperature (${value}°C) - protect sensitive plants`);
                } else if (value > 35) {
                  tips.push(`High temperature (${value}°C) - ensure adequate watering`);
                }
                break;
            }
          }
        });
      }

      // General tips based on farm setup
      if (tips.length === 0) {
        tips.push(
          "Monitor your crops daily for early problem detection",
          "Keep soil consistently moist but not waterlogged",
          "Rotate crops to maintain soil health",
          "Use organic mulch to retain moisture"
        );
      }

      return tips.slice(0, 4); // Return max 4 tips
    } catch (error) {
      console.error('Error generating farming tips:', error);
      return [
        "Regular monitoring is key to healthy crops",
        "Maintain proper soil moisture levels",
        "Watch for signs of pests and diseases",
        "Keep detailed farming records"
      ];
    }
  }

  async loadUserFarmData(userId: string): Promise<void> {
    try {
      // Import supabase here to avoid circular imports
      const { supabase } = await import('../lib/supabase');

      // Fetch user's farms with their sensors
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select(`
          id,
          name,
          location,
          notes,
          sensor (
            id,
            name,
            type,
            sensor_data!sensor_data_sensor_id_fkey (
              value,
              unit,
              timestamp
            )
          )
        `)
        .eq('user_id', userId);

      if (farmsError) {
        console.error('Error fetching farms:', farmsError);
        this.userFarmData = null;
        return;
      }

      // Transform the data to match UserFarmData interface
      const transformedFarms = farms?.map(farm => ({
        id: farm.id,
        name: farm.name,
        location: farm.location,
        notes: farm.notes,
        sensors: farm.sensor?.map(sensor => ({
          id: sensor.id,
          name: sensor.name,
          type: sensor.type,
          latestReading: sensor.sensor_data?.[0] ? {
            value: sensor.sensor_data[0].value,
            unit: sensor.sensor_data[0].unit,
            timestamp: sensor.sensor_data[0].timestamp
          } : undefined
        })) || []
      })) || [];

      this.userFarmData = { farms: transformedFarms };
    } catch (error) {
      console.error('Error loading user farm data:', error);
      this.userFarmData = null;
    }
  }

  getUserFarmData(): UserFarmData | null {
    return this.userFarmData;
  }

  async generateResponse(message: string, userId: string): Promise<ChatMessage> {
    try {
      // Ensure farm data is loaded
      if (!this.userFarmData) {
        await this.loadUserFarmData(userId);
      }

      // Generate AI response
      const aiResponse = await this.sendMessage(message, this.userFarmData);

      // Return as ChatMessage format
      return {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        metadata: aiResponse.suggestions ? {
          suggestedActions: aiResponse.suggestions
        } : undefined
      };
    } catch (error) {
      console.error('Error generating AI response:', error);

      // Return fallback response
      return {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: '🤖 I apologize, but I encountered an error while processing your request. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };
    }
  }

  clearConversation(): void {
    this.clearHistory();
  }
}

export default AIChatService;
