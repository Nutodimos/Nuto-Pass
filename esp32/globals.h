#ifndef GLOBALS_H
#define GLOBALS_H

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_Fingerprint.h>
#include "esp_sleep.h"

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

// ── R307 Image Constants ──
#define FP_IMAGE_WIDTH    256
#define FP_IMAGE_HEIGHT   288
#define FP_IMAGE_RAW_SIZE 36864   // 256*288/2 (4-bit packed)

// ── R307 UpImage Protocol Constants ──
#define FP_UPIMAGE_CMD   0x0A
#define FP_STARTCODE     0xEF01
#define FP_CMD_PACKET    0x01
#define FP_DATA_PACKET   0x02
#define FP_ACK_PACKET    0x07
#define FP_END_PACKET    0x08

// ── Enums (Cloud Architecture) ──
enum Mode { MODE_DEFAULT, MODE_VERIFICATION, MODE_REGISTRATION, MODE_SLEEP };
enum EnrollState {
  ENROLL_IDLE,
  ENROLL_WAIT_FINGER,
  ENROLL_CAPTURE,
  ENROLL_SUCCESS,
  ENROLL_FAIL
};

// ── Constants ──
#define DUPLICATE_GUARD_MS    10000UL
#define MULTI_PRESS_WINDOW_MS 1000
#define LONG_PRESS_MS         3000
#define HEARTBEAT_INTERVAL_MS 5000UL

// ── Base64 output size macro ──
#define BASE64_ENCODED_SIZE(n) (((4 * (n) / 3) + 3) & ~3)

// ── Include Config AFTER types are defined ──
#include "config.h"

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
void blinkWhite(int times, int onMs, int offMs);
void blinkBlue(int times, int onMs, int offMs);
void beep(int ms);
void beepTimes(int n, int ms, int gap);
String makeUserID(int rawID);
const char* modeToString(Mode m);
bool postToServer(String event, int id, String status);
void sendHeartbeat();
void logToSD(String event, int id, String status, bool synced);
void handleEnrollment();
void enterSleepMode();

// ── Cloud Biometric Functions ──
int  readRawImageFromSensor(uint8_t* buffer, int bufSize);
int  base64Encode(const uint8_t* input, int inputLen, char* output, int outputMaxLen);
bool postCloudVerify(const char* base64Data, int base64Len);
bool postCloudEnroll(int slotId, const char* base64Data, int base64Len);

#endif // GLOBALS_H
