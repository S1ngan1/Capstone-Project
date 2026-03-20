#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>
#include "FULLSEN.h"

//--- SECRET - FILL IN YOUR DETAILS ---
const char* WIFI_SSID = "Alaska";
const char* WIFI_PASS = "1234567890";
// Supabase details from Project Settings -> API
const char* SUPABASE_URL = "patxwucnnvbiveqjfrfy.supabase.co";
const int port = 443;
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdHh3dWNubnZiaXZlcWpmcmZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTM5OTg4MCwiZXhwIjoyMDYwOTc1ODgwfQ.plvtacsiJavw5-DWUqk1EnFIlX8RlCON0gQ-fjuONtA";

//--- END OF SECRET ---

// The name of the table you created in Supabase
const char* SUPABASE_TABLE_NAME = "test";

// Sensor UUIDs for unique identification (SHTC3 removed)
const String PH_SENSOR_UUID = "ph-sensor-001";
const String EC_SENSOR_UUID = "ec-sensor-001";
const String SOIL_SENSOR_UUID = "soil-sensor-001";
const String TEMP_SENSOR_UUID = "temp-sensor-001";
const String ES_PH_SOIL_UUID = "es-ph-soil-001";

// WiFi and HTTP Client objects
WiFiSSLClient wifi;
HttpClient client = HttpClient(wifi, SUPABASE_URL, 443);

// The built-in LED to show status
const int ledPin = LED_BUILTIN;

// Data collection interval (30 minutes = 30 * 60 * 1000 = 1,800,000 milliseconds)
const unsigned long DATA_COLLECTION_INTERVAL = 30UL * 60UL * 1000UL; // 30 minutes
unsigned long lastDataCollection = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;  // Wait for serial monitor to open

  wifi.setTimeout(10000); // Optional: set a timeout for WiFi operations
  client = HttpClient(wifi, SUPABASE_URL, 443);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Initialize sensors
  setupSensors();

  connectToWiFi();
  
  // Initialize the timer
  lastDataCollection = millis();
  Serial.println("Data collection will happen every 30 minutes");
  Serial.println("Next data collection in 30 minutes...");
}

void loop() {
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    connectToWiFi();
  }

  // Check if it's time for data collection (every 30 minutes)
  unsigned long currentTime = millis();
  
  if (currentTime - lastDataCollection >= DATA_COLLECTION_INTERVAL) {
    Serial.println("\n========== 30 MINUTE DATA COLLECTION ==========");
    
    // Read sensor data
    readSensors();

    // Create and send multiple JSON payloads - one for each sensor
    sendMultipleSensorPayloads();
    
    // Update the last collection time
    lastDataCollection = currentTime;
    
    Serial.println("Data collection complete. Next collection in 30 minutes...");
    Serial.println("==================================================\n");
  } else {
    // Show remaining time until next collection
    unsigned long remainingTime = DATA_COLLECTION_INTERVAL - (currentTime - lastDataCollection);
    unsigned long remainingMinutes = remainingTime / 60000; // Convert to minutes
    
    // Print status every 5 minutes
    static unsigned long lastStatusPrint = 0;
    if (currentTime - lastStatusPrint >= 300000) { // 5 minutes
      Serial.print("System running. Next data collection in ");
      Serial.print(remainingMinutes);
      Serial.println(" minutes...");
      lastStatusPrint = currentTime;
    }
  }

  // Small delay to prevent excessive loop iterations
  delay(1000); // Check every second
}

void connectToWiFi() {
  Serial.print("Attempting to connect to SSID: ");
  Serial.println(WIFI_SSID);

  while (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    digitalWrite(ledPin, HIGH);
    delay(500);
    digitalWrite(ledPin, LOW);
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  digitalWrite(ledPin, HIGH);  // Turn LED on to indicate connection
}

void sendMultipleSensorPayloads() {
  Serial.println("\n========== SENDING MULTIPLE JSON PAYLOADS ==========");
  
  // Create and send pH sensor payload with UUID
  String phPayload = createSingleSensorPayload(PH_SENSOR_UUID, 7.0);
  Serial.println("Sending pH sensor data...");
  sendToSupabase(phPayload);
  delay(1000);
  
  // Create and send EC sensor payload with UUID
  String ecPayload = createSingleSensorPayload(EC_SENSOR_UUID, ecValue);
  Serial.println("Sending EC sensor data...");
  sendToSupabase(ecPayload);
  delay(1000);
  
  // Create and send Soil Moisture sensor payload with UUID
  String soilPayload = createSingleSensorPayload(SOIL_SENSOR_UUID, soilMoistureValue);
  Serial.println("Sending Soil Moisture sensor data...");
  sendToSupabase(soilPayload);
  delay(1000);
  
  // Create and send Temperature sensor payload with UUID
  String tempPayload = createSingleSensorPayload(TEMP_SENSOR_UUID, temperature);
  Serial.println("Sending Temperature sensor data...");
  sendToSupabase(tempPayload);
  delay(1000);
  
  // Create and send ES-PH-SOIL-01 sensor payload
  String esPHSoilPayload = createSingleSensorPayload(ES_PH_SOIL_UUID, esPHSoilValue);
  Serial.println("Sending ES-PH-SOIL-01 sensor data...");
  sendToSupabase(esPHSoilPayload);
  
  Serial.println("========== ALL PAYLOADS SENT ==========");
}

String createSingleSensorPayload(String sensor_id, float value) {
  // Create single JSON payload with: id, sensor_id, value
  JsonDocument doc;
  
  // Generate a unique ID using timestamp and sensor type
  String uniqueId = sensor_id + "-" + String(millis());
  
  doc["id"] = uniqueId;
  doc["sensor_id"] = sensor_id;
  doc["value"] = value;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("JSON Payload: " + jsonPayload);
  
  return jsonPayload;
}
  
  

void sendToSupabase(String payload) {
  String apiPath = "/rest/v1/" + String("sensor_data");

  Serial.print("Making POST request to: ");
  Serial.println(apiPath);


  Serial.print("Making POST request to: ");
  Serial.println(apiPath);

  // Set the required headers for Supabase
  client.beginRequest();
  client.post(apiPath);
  Serial.println("--- REQUEST HEADERS ---");
  Serial.print("apikey: "); Serial.println(SUPABASE_KEY);
  Serial.print("Authorization: Bearer "); Serial.println(SUPABASE_KEY);
  Serial.println("Content-Type: application/json");
  Serial.println("Prefer: return=minimal");
  Serial.print("Content-Length: "); Serial.println(String(payload.length()));
  Serial.println("-----------------------");
  client.sendHeader("apikey", SUPABASE_KEY);
  client.sendHeader("Authorization", "Bearer " + String(SUPABASE_KEY));
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Prefer", "return=minimal");  // Ask Supabase not to return the inserted data
  client.sendHeader("Content-Length", String(payload.length()));
  client.beginBody();
  client.print(payload);
  client.endRequest();

  // Read the response
  int statusCode = client.responseStatusCode();
  String responseBody = client.responseBody();

  Serial.print("HTTP Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(responseBody);
  if (statusCode == 400) {
    Serial.println("\n--- DEBUG INFO ---");
    Serial.print("Payload sent: ");
    Serial.println(payload);
    Serial.print("API Path: ");
    Serial.println(apiPath);
    Serial.println("Check that your Supabase table and columns match the payload exactly.");
    Serial.println("Check your API key and permissions.");
    Serial.println("------------------\n");
  }

  if (statusCode == 201) {  // 201 Created is the success code for insertion
    Serial.println("Data successfully sent to Supabase!");
    // Blink LED on success
    digitalWrite(ledPin, LOW);
    delay(100);
    digitalWrite(ledPin, HIGH);
  } else {
    Serial.println("Error sending data to Supabase.");
  }
}