// Sensor Pin Definitions
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

void setup()
{
  pinMode(LED,OUTPUT);
  Serial.begin(9600);  
  ec.begin();
  Serial.println("pH meter experiment!");
}

void loop()
{
    // EC Sensor (DFR0300) on A1
    static unsigned long timepoint = millis();
    if(millis()-timepoint>1000U)  //time interval: 1s
    {
      timepoint = millis();
      voltage = analogRead(EC_PIN)/1024.0*5000;  // read the voltage
      Serial.print("EC voltage:");
      Serial.print(voltage);
      //temperature = readTemperature();  // read your temperature sensor to execute temperature compensation
      ecValue =  ec.readEC(voltage,temperature);  // convert voltage to EC with temperature compensation
      Serial.print("  temperature:");
      Serial.print(temperature,1);
      Serial.print("^C  EC:");
      Serial.print(ecValue,1);
      Serial.println("ms/cm");
    }
    ec.calibration(voltage,temperature);  // calibration process by Serail CMD

    // pH Sensor (SEN0169v2) on A0
    static unsigned long samplingTime = millis();
    static unsigned long printTime = millis();
    static float pHValue, pHVoltage;
    if(millis()-samplingTime > samplingInterval)
    {
        pHArray[pHArrayIndex++]=analogRead(PH_PIN);
        if(pHArrayIndex==ArrayLenth)pHArrayIndex=0;
        pHVoltage = avergearray(pHArray, ArrayLenth)*5.0/1024;
        pHValue = 3.5*pHVoltage+Offset;
        samplingTime=millis();
    }
    if(millis() - printTime > printInterval)   //Every 800 milliseconds, print a numerical, convert the state of the LED indicator
    {
      Serial.print("pH Voltage:");
          Serial.print(pHVoltage,2);
          Serial.print("    pH value: ");
      Serial.println(pHValue,2);
          digitalWrite(LED,digitalRead(LED)^1);
          printTime=millis();
    }

    // Soil Moisture Sensor (SEN0308) on A2
    static unsigned long soilTime = millis();
    if(millis() - soilTime > 2000)  // Check soil moisture every 2 seconds
    {
      soilMoistureValue = analogRead(SOIL_PIN);  // Read soil moisture sensor on A2
      Serial.print("Soil Moisture Value: ");
      Serial.print(soilMoistureValue);
      Serial.print(" - ");
      
      if(soilMoistureValue > WaterValue && soilMoistureValue < (WaterValue + intervals))
      {
        Serial.println("Very Wet");
      }
      else if(soilMoistureValue > (WaterValue + intervals) && soilMoistureValue < (AirValue - intervals))
      {
        Serial.println("Wet");
      }
      else if(soilMoistureValue < AirValue && soilMoistureValue > (AirValue - intervals))
      {
        Serial.println("Dry");
      }
      else
      {
        Serial.println("Very Dry");
      }
      soilTime = millis();
    }
}
double avergearray(int* arr, int number){
  int i;
  int max,min;
  double avg;
  long amount=0;
  if(number<=0){
    Serial.println("Error number for the array to avraging!/n");
    return 0;
  }
  if(number<5){   //less than 5, calculated directly statistics
    for(i=0;i<number;i++){
      amount+=arr[i];
    }
    avg = amount/number;
    return avg;
  }else{
    if(arr[0]<arr[1]){
      min = arr[0];max=arr[1];
    }
    else{
      min=arr[1];max=arr[0];
    }
    for(i=2;i<number;i++){
      if(arr[i]<min){
        amount+=min;        //arr<min
        min=arr[i];
      }else {
        if(arr[i]>max){
          amount+=max;    //arr>max
          max=arr[i];
        }else{
          amount+=arr[i]; //min<=arr<=max
        }
      }//if
    }//for
    avg = (double)amount/(number-2);
  }//if
  return avg;
}

