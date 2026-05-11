#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_Fingerprint.h>
#include "esp_sleep.h"
#include "config.h"

// ── Pin Definitions ──
#define SD_CS     13
#define FP_RX     16
#define FP_TX     17
#define SPI_SCK   18
#define SPI_MISO  19
#define SPI_MOSI  23
#define BUTTON_PIN  15
#define BUZZER_PIN  12
#define LED_RED    25
#define LED_GREEN  26
#define LED_BLUE   27

// ── Enums ──
enum Mode { MODE_DEFAULT, MODE_VERIFICATION, MODE_REGISTRATION, MODE_SLEEP };
enum EnrollState {
  ENROLL_IDLE, ENROLL_FIND_SLOT, ENROLL_WAIT_FIRST, ENROLL_FIRST_SCAN,
  ENROLL_WAIT_LIFT, ENROLL_WAIT_SECOND, ENROLL_SECOND_SCAN,
  ENROLL_PROCESS, ENROLL_SUCCESS, ENROLL_FAIL
};

// ── Constants ──
#define DUPLICATE_GUARD_MS    10000UL
#define MULTI_PRESS_WINDOW_MS 600
#define LONG_PRESS_MS         3000
#define HEARTBEAT_INTERVAL_MS 5000UL

// ── Global Hardware Objects ──
extern HardwareSerial fpSerial;
extern Adafruit_Fingerprint finger;

// ── Global State ──
extern Mode currentMode;
extern EnrollState enrollState;
extern bool wifiConnected, sdReady, sensorReady, cloudReady, ntpSynced;
extern unsigned long lastWifiCheck, lastTick, lastSyncAttempt, lastHeartbeat;
extern int lastVerifiedID;
extern unsigned long lastVerifyTime;
extern int pressCount;
extern bool btnWasDown, longPressHandled;
extern unsigned long lastPressTime, btnDownTime;
extern int enrollNewID;
extern unsigned long enrollTimeout;
extern unsigned long bootTime;

// ── Function Declarations ──
void setLED(bool r, bool g, bool b);
void ledOff(); void ledWhite(); void ledBlue();
void ledGreen(); void ledRed(); void ledYellow();
void ledOrange(); void ledPurple();
void blinkWhite(int times, int onMs=200, int offMs=150);
void blinkBlue(int times, int onMs=200, int offMs=150);
void beep(int ms=80);
void beepTimes(int n, int ms=80, int gap=100);
String makeUserID(int rawID);
const char* modeToString(Mode m);
bool postToServer(String event, int id, String status);
void sendHeartbeat();
void autoSyncToServer();
void logToSD(String event, int id, String status, bool synced=false);
void handleEnrollment();
void enterSleepMode();

#endif // GLOBALS_H
