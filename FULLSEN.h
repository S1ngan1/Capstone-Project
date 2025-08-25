// Sensor Pin Definitions
#define PH_PIN A0               // SEN0169v2 pH sensor on A0
#define EC_PIN A1               // DFR0300 EC sensor on A1  
#define SOIL_PIN A2             // SEN0308 Soil moisture sensor on A2

// ES-PH-SOIL-01 Sensor Modbus MAX485 Pin Definitions
#define ES_RO_PIN 2             // RO (Receiver Output) from MAX485
#define ES_DI_PIN 3             // DI (Driver Input) to MAX485
#define ES_DE_PIN 7             // DE (Driver Enable) to MAX485
#define ES_RE_PIN 8             // RE (Receiver Enable) to MAX485

// pH Sensor Settings
#define Offset 0.00             // pH deviation compensate
#define LED 13
#define samplingInterval 20
#define printInterval 800
#define ArrayLenth  40          // times of collection
int pHArray[ArrayLenth];        // Store the average value of the sensor feedback
int pHArrayIndex=0;

// EC Sensor Settings
#include "DFRobot_EC10.h"
#include <EEPROM.h>
float voltage, ecValue, temperature = 25;
DFRobot_EC10 ec;

// Soil Moisture Sensor Settings
const int AirValue = 570;       // Calibrate: value recorded in air
const int WaterValue = 0;       // Calibrate: value recorded in water
int intervals = (AirValue - WaterValue)/3;
int soilMoistureValue = 0;

// Modbus Communication Settings
#include <SoftwareSerial.h>

// ES-PH-SOIL-01 Sensor Settings
SoftwareSerial esSerial(ES_RO_PIN, ES_DI_PIN); // RX, TX
float esPHSoilValue = 0.0;
byte ES_SLAVE_ID = 0x02;  // Will try different IDs
int es_retry_count = 0;
byte slave_ids_to_try[] = {0x01, 0x02, 0x03, 0x10, 0x20, 0x30, 0x40, 0x50}; // Common slave IDs

// Function declarations
void setupSensors();
void readSensors();
double avergearray(int* arr, int number);
void setupModbusSensors();
void readESPHSoilSensor();
void setRS485Mode(int dePin, int rePin, bool transmit);
unsigned int calculateModbusCRC(byte* data, int length);
void testESCommunication();
bool tryESSlaveID(byte slave_id);

// Sensor setup function
void setupSensors()
{
  pinMode(LED,OUTPUT);
  ec.begin();
  
  // Setup Modbus sensors
  setupModbusSensors();
  
  Serial.println("pH meter experiment!");
  Serial.println("All sensors including Modbus sensors initialized!");
}

// Setup Modbus sensors
void setupModbusSensors()
{
  // Setup ES-PH-SOIL-01 Modbus communication
  pinMode(ES_DE_PIN, OUTPUT);
  pinMode(ES_RE_PIN, OUTPUT);
  setRS485Mode(ES_DE_PIN, ES_RE_PIN, false); // Start in receive mode
  
  Serial.println("Trying ES-PH-SOIL-01 at 9600 baud...");
  esSerial.begin(9600);
  delay(100);
  
  Serial.println("ES-PH-SOIL-01 Modbus initialized on pins D2,3,7,8");
  
  // Test communication immediately
  Serial.println("Testing initial communication...");
  testESCommunication();
}

// Test ES communication with different slave IDs
void testESCommunication()
{
  Serial.println("=== Testing ES-PH-SOIL-01 Communication ===");
  
  for (int i = 0; i < 8; i++) {
    byte test_id = slave_ids_to_try[i];
    Serial.print("Testing slave ID: 0x");
    if (test_id < 16) Serial.print("0");
    Serial.println(test_id, HEX);
    
    if (tryESSlaveID(test_id)) {
      ES_SLAVE_ID = test_id;
      Serial.print("*** ES-PH-SOIL-01 responds to slave ID: 0x");
      if (test_id < 16) Serial.print("0");
      Serial.println(test_id, HEX);
      return;
    }
    delay(500);
  }
  Serial.println("*** No ES-PH-SOIL-01 response found. Check wiring and power.");
}

// Try a specific slave ID for ES
bool tryESSlaveID(byte slave_id)
{
  // Clear buffer
  while (esSerial.available()) {
    esSerial.read();
  }
  
  // Simple read request
  byte request[] = {slave_id, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00};
  unsigned int crc = calculateModbusCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;
  
  // Send request
  setRS485Mode(ES_DE_PIN, ES_RE_PIN, true);
  delay(10);
  
  esSerial.write(request, 8);
  esSerial.flush();
  delay(10);
  
  setRS485Mode(ES_DE_PIN, ES_RE_PIN, false);
  
  // Wait for any response
  unsigned long startTime = millis();
  while (esSerial.available() == 0 && (millis() - startTime) < 500) {
    delay(10);
  }
  
  if (esSerial.available() > 0) {
    Serial.print("  Response detected! Bytes: ");
    Serial.println(esSerial.available());
    return true;
  }
  
  return false;
}

// Read ES-PH-SOIL-01 sensor via Modbus
void readESPHSoilSensor()
{
  // Clear buffer
  while (esSerial.available()) {
    esSerial.read();
  }
  
  // Modbus RTU request
  byte request[] = {ES_SLAVE_ID, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00};
  
  // Calculate proper CRC
  unsigned int crc = calculateModbusCRC(request, 6);
  request[6] = crc & 0xFF;
  request[7] = (crc >> 8) & 0xFF;
  
  Serial.print("Sending ES-PH-SOIL-01 request: ");
  for (int i = 0; i < 8; i++) {
    Serial.print("0x");
    if (request[i] < 16) Serial.print("0");
    Serial.print(request[i], HEX);
    Serial.print(" ");
  }
  Serial.println();
  
  // Send request
  setRS485Mode(ES_DE_PIN, ES_RE_PIN, true);
  delay(5);
  
  for (int i = 0; i < 8; i++) {
    esSerial.write(request[i]);
    delayMicroseconds(100);
  }
  esSerial.flush();
  delay(5);
  
  setRS485Mode(ES_DE_PIN, ES_RE_PIN, false);
  
  // Wait for response
  unsigned long startTime = millis();
  int expectedBytes = 7; // Slave ID + Function + Byte Count + 2 data bytes + 2 CRC bytes
  
  while (esSerial.available() < expectedBytes && (millis() - startTime) < 1000) {
    delay(10);
  }
  
  if (esSerial.available() >= expectedBytes) {
    byte response[8];
    int bytesRead = esSerial.readBytes(response, expectedBytes);
    
    Serial.print("ES-PH-SOIL-01 Response (");
    Serial.print(bytesRead);
    Serial.print(" bytes): ");
    for (int i = 0; i < bytesRead; i++) {
      Serial.print("0x");
      if (response[i] < 16) Serial.print("0");
      Serial.print(response[i], HEX);
      Serial.print(" ");
    }
    Serial.println();
    
    if (bytesRead >= 5 && response[0] == ES_SLAVE_ID && response[1] == 0x03) {
      int phRaw = (response[3] << 8) | response[4];
      esPHSoilValue = phRaw / 100.0;
      
      Serial.print("ES-PH-SOIL-01 - pH: ");
      Serial.println(esPHSoilValue, 2);
    } else {
      Serial.println("ES-PH-SOIL-01 invalid response!");
    }
  } else {
    Serial.println("ES-PH-SOIL-01 reading failed - timeout!");
    while (esSerial.available()) {
      esSerial.read();
    }
  }
}

// Set RS485 mode (transmit/receive)
void setRS485Mode(int dePin, int rePin, bool transmit)
{
  if (transmit) {
    digitalWrite(dePin, HIGH);  // Enable driver
    digitalWrite(rePin, HIGH);  // Disable receiver
  } else {
    digitalWrite(dePin, LOW);   // Disable driver
    digitalWrite(rePin, LOW);   // Enable receiver
  }
}

// Proper Modbus CRC16 calculation
unsigned int calculateModbusCRC(byte* data, int length)
{
  unsigned int crc = 0xFFFF;
  
  for (int pos = 0; pos < length; pos++) {
    crc ^= (unsigned int)data[pos];  // XOR byte into least sig. byte of crc
    
    for (int i = 8; i != 0; i--) {   // Loop over each bit
      if ((crc & 0x0001) != 0) {     // If the LSB is set
        crc >>= 1;                   // Shift right and XOR 0xA001
        crc ^= 0xA001;
      } else {                       // Else LSB is not set
        crc >>= 1;                   // Just shift right
      }
    }
  }
  
  return crc;
}

// Read all sensors (optimized for 30-minute intervals)
void readSensors()
{
  Serial.println("=== Reading All Sensors for 30-Minute Collection ===");
  
  // Read pH sensor multiple times for better accuracy
  float pHSum = 0;
  int pHReadings = 0;
  
  for (int i = 0; i < 10; i++) { // Take 10 readings over 10 seconds
    pHArray[pHArrayIndex++] = analogRead(PH_PIN);
    if (pHArrayIndex == ArrayLenth) pHArrayIndex = 0;
    
    float voltage = avergearray(pHArray, ArrayLenth) * 5.0 / 1024;
    float pHValue = 3.5 * voltage + Offset;
    pHSum += pHValue;
    pHReadings++;
    
    delay(1000); // 1 second between readings
  }
  
  float avgPH = pHSum / pHReadings;
  Serial.print("Average pH Value (10 readings): ");
  Serial.println(avgPH, 2);
  
  // Read EC sensor multiple times for accuracy
  float ecSum = 0;
  int ecReadings = 0;
  
  for (int i = 0; i < 5; i++) { // Take 5 EC readings
    float voltage = analogRead(EC_PIN) / 1024.0 * 5000;
    float ecVal = ec.readEC(voltage, temperature);
    ecSum += ecVal;
    ecReadings++;
    delay(500);
  }
  
  ecValue = ecSum / ecReadings;
  Serial.print("Average EC Value (5 readings): ");
  Serial.print(ecValue, 4);
  Serial.println(" ms/cm");
  
  // Read soil moisture sensor multiple times
  float soilSum = 0;
  int soilReadings = 0;
  
  for (int i = 0; i < 5; i++) { // Take 5 soil moisture readings
    int soilReading = analogRead(SOIL_PIN);
    soilSum += soilReading;
    soilReadings++;
    delay(500);
  }
  
  soilMoistureValue = soilSum / soilReadings;
  int soilmoisturepercent = map(soilMoistureValue, AirValue, WaterValue, 0, 100);
  
  Serial.print("Average Soil Moisture: ");
  if (soilmoisturepercent > 100) {
    Serial.println("100%");
  } else if (soilmoisturepercent < 0) {
    Serial.println("0%");
  } else {
    Serial.print(soilmoisturepercent);
    Serial.println("%");
  }
  
  // Read Modbus sensor (try multiple times if needed)
  for (int attempt = 0; attempt < 3; attempt++) {
    readESPHSoilSensor();
    if (esPHSoilValue > 0) break; // If we got a valid reading, stop trying
    delay(1000); // Wait before retry
  }
  
  Serial.println("=== 30-Minute Sensor Reading Complete ===\n");
}

// Average array function for pH sensor
double avergearray(int* arr, int number)
{
  int i;
  int max, min;
  double avg;
  long amount = 0;
  
  if (number <= 0) {
    Serial.println("Error number for the array to averaging!/n");
    return 0;
  }
  
  if (number < 5) { // less than 5, calculated directly statistics
    for (i = 0; i < number; i++) {
      amount += arr[i];
    }
    avg = amount / number;
    return avg;
  } else {
    if (arr[0] < arr[1]) {
      min = arr[0]; max = arr[1];
    } else {
      min = arr[1]; max = arr[0];
    }
    
    for (i = 2; i < number; i++) {
      if (arr[i] < min) {
        amount += min; // arr<min
        min = arr[i];
      } else {
        if (arr[i] > max) {
          amount += max; // arr>max
          max = arr[i];
        } else {
          amount += arr[i]; // min<=arr<=max
        }
      }
    }
    avg = (double)amount / (number - 2);
  }
  
  return avg;
}

