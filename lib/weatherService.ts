// Weather service using Open Meteo API
export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    feelsLike?: number;
  };
  daily: {
    date: string;
    temperature: {
      max: number;
      min: number;
    };
    weatherCode: number;
    precipitation?: number;
  }[];
  location?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  name?: string;
}

class WeatherService {
  private readonly baseUrl = 'https://api.open-meteo.com/v1';

  async getCurrentWeather(coordinates: LocationCoordinates): Promise<WeatherData> {
    try {
      const { latitude, longitude } = coordinates;

      const response = await fetch(
        `${this.baseUrl}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        current: {
          temperature: Math.round(data.current.temperature_2m || 0),
          weatherCode: data.current.weather_code || 0,
          windSpeed: Math.round(data.current.wind_speed_10m || 0),
          humidity: Math.round(data.current.relative_humidity_2m || 0),
          feelsLike: Math.round(data.current.apparent_temperature || data.current.temperature_2m || 0),
        },
        daily: data.daily.time.slice(0, 7).map((date: string, index: number) => ({
          date,
          temperature: {
            max: Math.round(data.daily.temperature_2m_max[index] || 0),
            min: Math.round(data.daily.temperature_2m_min[index] || 0),
          },
          weatherCode: data.daily.weather_code[index] || 0,
          precipitation: Math.round((data.daily.precipitation_sum[index] || 0) * 10) / 10,
        })),
        location: coordinates.name,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getLocationCoordinates(locationName: string): Promise<LocationCoordinates> {
    try {
      // Add validation for locationName
      if (!locationName || typeof locationName !== 'string' || locationName.trim() === '') {
        throw new Error('Invalid location name provided');
      }

      // First try to get coordinates from Vietnamese provinces
      const vietnameseCoords = this.getVietnameseProvinceCoordinates(locationName.trim());
      if (vietnameseCoords) {
        return vietnameseCoords;
      }

      // Fallback to geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName.trim())}&count=1&language=en&format=json`
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error(`Location not found: ${locationName}`);
      }

      const location = data.results[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
      };
    } catch (error) {
      console.error('Error fetching location coordinates:', error);
      throw error;
    }
  }

  private getVietnameseProvinceCoordinates(locationName: string): LocationCoordinates | null {
    try {
      // Add validation for locationName
      if (!locationName || typeof locationName !== 'string') {
        return null;
      }

      // Import provinces data and coordinates function
      const { getProvinceCoordinates } = require('./vietnameseProvinces');
      const coords = getProvinceCoordinates(locationName);

      if (coords) {
        return {
          latitude: coords.lat,
          longitude: coords.lon,
          name: locationName,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting Vietnamese province coordinates:', error);
      return null;
    }
  }

  getWeatherIcon(weatherCode: number, isDay: boolean = true): string {
    // Weather code mappings for Ionicons
    const weatherCodeMap: { [key: number]: { day: string; night: string } } = {
      0: { day: 'sunny', night: 'moon' }, // Clear sky
      1: { day: 'partly-sunny', night: 'cloudy-night' }, // Mainly clear
      2: { day: 'partly-sunny', night: 'cloudy-night' }, // Partly cloudy
      3: { day: 'cloudy', night: 'cloudy' }, // Overcast
      45: { day: 'cloudy', night: 'cloudy' }, // Fog
      48: { day: 'cloudy', night: 'cloudy' }, // Depositing rime fog
      51: { day: 'rainy', night: 'rainy' }, // Light drizzle
      53: { day: 'rainy', night: 'rainy' }, // Moderate drizzle
      55: { day: 'rainy', night: 'rainy' }, // Dense drizzle
      56: { day: 'rainy', night: 'rainy' }, // Light freezing drizzle
      57: { day: 'rainy', night: 'rainy' }, // Dense freezing drizzle
      61: { day: 'rainy', night: 'rainy' }, // Slight rain
      63: { day: 'rainy', night: 'rainy' }, // Moderate rain
      65: { day: 'rainy', night: 'rainy' }, // Heavy rain
      66: { day: 'rainy', night: 'rainy' }, // Light freezing rain
      67: { day: 'rainy', night: 'rainy' }, // Heavy freezing rain
      71: { day: 'snow', night: 'snow' }, // Slight snow fall
      73: { day: 'snow', night: 'snow' }, // Moderate snow fall
      75: { day: 'snow', night: 'snow' }, // Heavy snow fall
      77: { day: 'snow', night: 'snow' }, // Snow grains
      80: { day: 'rainy', night: 'rainy' }, // Slight rain showers
      81: { day: 'rainy', night: 'rainy' }, // Moderate rain showers
      82: { day: 'rainy', night: 'rainy' }, // Violent rain showers
      85: { day: 'snow', night: 'snow' }, // Slight snow showers
      86: { day: 'snow', night: 'snow' }, // Heavy snow showers
      95: { day: 'thunderstorm', night: 'thunderstorm' }, // Thunderstorm
      96: { day: 'thunderstorm', night: 'thunderstorm' }, // Thunderstorm with slight hail
      99: { day: 'thunderstorm', night: 'thunderstorm' }, // Thunderstorm with heavy hail
    };

    const mapping = weatherCodeMap[weatherCode] || { day: 'partly-sunny', night: 'cloudy-night' };
    return isDay ? mapping.day : mapping.night;
  }

  getWeatherDescription(weatherCode: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail',
    };

    return descriptions[weatherCode] || 'Unknown weather';
  }

  async getWeatherForFarm(farmLocation: string): Promise<WeatherData> {
    try {
      const coordinates = await this.getLocationCoordinates(farmLocation);
      return await this.getCurrentWeather(coordinates);
    } catch (error) {
      console.error(`Error getting weather for farm location "${farmLocation}":`, error);
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
export default weatherService;
