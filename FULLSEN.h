// Sensor Pin Definitions
//logic votage
#define PH_PIN A0               // SEN0169v2 pH sensor on A0
#define EC_PIN A1               // DFR0300 EC sensor on A1  
#define SOIL_PIN A2             // SEN0308 Soil moisture sensor on A2

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

// Function declarations
void setupSensors();
void readSensors();
double avergearray(int* arr, int number);

// Sensor setup function
void setupSensors()
{
  pinMode(LED,OUTPUT);
  ec.begin();
  
  Serial.println("pH meter experiment!");
  Serial.println("All sensors initialized!");
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

