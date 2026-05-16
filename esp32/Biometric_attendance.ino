/*
 * NutoPass Attendance v3.0 — Cloud Biometric Edition
 * R307 sensor used as dumb camera (DSP bypassed).
 * All matching done server-side via Python microservice.
 */
#include "globals.h"

// ══════════ Globals ══════════
HardwareSerial fpSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fpSerial);
Mode currentMode = MODE_DEFAULT;
EnrollState enrollState = ENROLL_IDLE;
bool wifiConnected=false, sdReady=false, sensorReady=false, cloudReady=false, ntpSynced=false;
unsigned long lastWifiCheck=0, lastTick=0, lastSyncAttempt=0, lastHeartbeat=0;
int lastVerifiedID=-1; unsigned long lastVerifyTime=0;
int pressCount=0; bool btnWasDown=false, longPressHandled=false;
unsigned long lastPressTime=0, btnDownTime=0;
int enrollNewID=-1; unsigned long enrollTimeout=0;
unsigned long bootTime=0;

// ══════════ LED / Buzzer ══════════
void setLED(bool r,bool g,bool b){digitalWrite(LED_RED,r);digitalWrite(LED_GREEN,g);digitalWrite(LED_BLUE,b);}
void ledOff(){setLED(0,0,0);} void ledWhite(){setLED(1,1,1);} void ledBlue(){setLED(0,0,1);}
void ledGreen(){setLED(0,1,0);} void ledRed(){setLED(1,0,0);} void ledYellow(){setLED(1,1,0);}
void ledOrange(){setLED(1,0,0);digitalWrite(LED_GREEN,HIGH);} void ledPurple(){setLED(1,0,1);}
void blinkWhite(int t,int on,int off){for(int i=0;i<t;i++){ledWhite();delay(on);ledOff();delay(off);}}
void blinkBlue(int t,int on,int off){for(int i=0;i<t;i++){ledBlue();delay(on);ledOff();delay(off);}}
void beep(int ms){digitalWrite(BUZZER_PIN,HIGH);delay(ms);digitalWrite(BUZZER_PIN,LOW);}
void beepTimes(int n,int ms,int gap){for(int i=0;i<n;i++){beep(ms);if(i<n-1)delay(gap);}}

String makeUserID(int rawID){char buf[10];snprintf(buf,sizeof(buf),"USER%03d",rawID);return String(buf);}

const char* modeToString(Mode m){
  switch(m){
    case MODE_DEFAULT: return "DEFAULT";
    case MODE_VERIFICATION: return "VERIFICATION";
    case MODE_REGISTRATION: return "REGISTRATION";
    case MODE_SLEEP: return "SLEEP";
    default: return "UNKNOWN";
  }
}

// ══════════ Base64 Encoder ══════════
static const char b64chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

int base64Encode(const uint8_t* input, int inputLen, char* output, int outputMaxLen) {
  int outLen = 0;
  for (int i = 0; i < inputLen; i += 3) {
    if (outLen + 4 >= outputMaxLen) break;
    uint32_t a = i < inputLen ? input[i] : 0;
    uint32_t b = (i+1) < inputLen ? input[i+1] : 0;
    uint32_t c = (i+2) < inputLen ? input[i+2] : 0;
    uint32_t triple = (a << 16) | (b << 8) | c;
    output[outLen++] = b64chars[(triple >> 18) & 0x3F];
    output[outLen++] = b64chars[(triple >> 12) & 0x3F];
    output[outLen++] = (i+1 < inputLen) ? b64chars[(triple >> 6) & 0x3F] : '=';
    output[outLen++] = (i+2 < inputLen) ? b64chars[triple & 0x3F] : '=';
  }
  output[outLen] = '\0';
  return outLen;
}

// ══════════ R307 UpImage — Raw Image Extraction ══════════
int readRawImageFromSensor(uint8_t* buffer, int bufSize) {
  while (fpSerial.available()) fpSerial.read(); // flush

  uint8_t cmd[] = {
    0xEF, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0x01,
    0x00, 0x03, FP_UPIMAGE_CMD, 0x00, 0x0E
  };
  fpSerial.write(cmd, sizeof(cmd));
  fpSerial.flush();

  // Wait for 12-byte ACK
  unsigned long start = millis();
  while (fpSerial.available() < 12 && (millis() - start) < 3000) delay(1);
  if (fpSerial.available() < 12) { Serial.println("[CLOUD] UpImage ACK timeout"); return -1; }

  uint8_t ack[12]; fpSerial.readBytes(ack, 12);
  if (ack[9] != 0x00) { Serial.printf("[CLOUD] UpImage rejected (0x%02X)\n", ack[9]); return -1; }
  Serial.println("[CLOUD] UpImage ACK OK — reading data...");

  int totalRead = 0; bool done = false;
  while (!done && totalRead < bufSize) {
    start = millis();
    while (fpSerial.available() < 9 && (millis() - start) < 5000) delay(1);
    if (fpSerial.available() < 9) { Serial.printf("[CLOUD] Packet timeout at %d bytes\n", totalRead); break; }

    uint8_t hdr[9]; fpSerial.readBytes(hdr, 9);
    if (hdr[0] != 0xEF || hdr[1] != 0x01) { Serial.println("[CLOUD] Bad start code"); break; }

    uint8_t pktType = hdr[6];
    uint16_t pktLen = ((uint16_t)hdr[7] << 8) | hdr[8];
    int dataLen = pktLen - 2;

    int bytesRead = 0; start = millis();
    while (bytesRead < pktLen && (millis() - start) < 5000) {
      if (fpSerial.available()) {
        uint8_t byt = fpSerial.read();
        if (bytesRead < dataLen && totalRead < bufSize) buffer[totalRead++] = byt;
        bytesRead++;
      }
    }
    if (pktType == FP_END_PACKET) done = true;
  }
  Serial.printf("[CLOUD] Image: %d bytes\n", totalRead);
  return totalRead;
}

// ══════════ Legacy Event POST ══════════
bool postToServer(String event, int id, String status) {
  if (!wifiConnected) return false;
  HTTPClient http;
  String url = String(SERVER_URL) + String(API_PATH);
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(8000);
  char ts[24]="unknown"; struct tm t;
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02dT%02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  String json="{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"event\":\""+event+"\",\"userID\":\""+makeUserID(id)+"\",\"status\":\""+status+"\",\"timestamp\":\""+String(ts)+"\"}";
  Serial.println("[POST] "+url); int code=http.POST(json); http.end();
  return(code>=200&&code<300);
}

// ══════════ Streaming POST Helper ══════════
// Streams a large JSON body over HTTP(S) without duplicating the base64 data.
// Sends: prefix + base64Data (in 1KB chunks) + suffix
// Returns the HTTP response code and body via pointer.
int streamPost(const char* path, const char* prefix, int prefixLen,
               const char* base64Data, int base64Len,
               const char* suffix, int suffixLen,
               String* responseBody) {
  String serverUrl = String(SERVER_URL);
  bool isHttps = serverUrl.startsWith("https");
  String host = serverUrl;
  host.replace("https://", ""); host.replace("http://", "");
  int port = isHttps ? 443 : 80;
  int slashIdx = host.indexOf('/');
  if (slashIdx > 0) host = host.substring(0, slashIdx);
  int colonIdx = host.indexOf(':');
  if (colonIdx > 0) { port = host.substring(colonIdx+1).toInt(); host = host.substring(0, colonIdx); }

  WiFiClientSecure secClient;
  WiFiClient plainClient;
  Client* client;
  if (isHttps) { secClient.setInsecure(); client = &secClient; }
  else { client = &plainClient; }

  Serial.printf("[STREAM] Connecting to %s:%d...\n", host.c_str(), port);
  if (isHttps) { if (!secClient.connect(host.c_str(), port)) { Serial.println("[STREAM] TLS connect FAILED"); return -1; } }
  else { if (!plainClient.connect(host.c_str(), port)) { Serial.println("[STREAM] connect FAILED"); return -1; } }

  int contentLength = prefixLen + base64Len + suffixLen;
  // Send HTTP headers
  client->print("POST "); client->print(path); client->println(" HTTP/1.1");
  client->print("Host: "); client->println(host);
  client->println("Content-Type: application/json");
  client->print("Content-Length: "); client->println(contentLength);
  client->println("Connection: close");
  client->println();

  // Stream body in parts — no duplication!
  client->write((const uint8_t*)prefix, prefixLen);
  int sent = 0;
  while (sent < base64Len) {
    int chunk = (base64Len - sent > 1024) ? 1024 : (base64Len - sent);
    client->write((const uint8_t*)(base64Data + sent), chunk);
    sent += chunk;
    if (sent % 8192 == 0) Serial.printf("[STREAM] Sent %d/%d bytes\n", sent, base64Len);
  }
  client->write((const uint8_t*)suffix, suffixLen);
  Serial.printf("[STREAM] Body sent: %d bytes total\n", contentLength);

  // Read response — skip headers, find body
  unsigned long start = millis();
  while (!client->available() && (millis() - start) < 30000) delay(10);
  int statusCode = -1; bool headersEnded = false;
  String body = "";
  while (client->available() || (millis() - start) < 30000) {
    String line = client->readStringUntil('\n'); line.trim();
    if (!headersEnded) {
      if (statusCode == -1 && line.startsWith("HTTP/")) {
        int sp1 = line.indexOf(' '); statusCode = line.substring(sp1+1, sp1+4).toInt();
      }
      if (line.length() == 0) headersEnded = true;
    } else {
      body += line; break; // Read first line of body
    }
    if (!client->available()) { delay(50); if (!client->available()) break; }
  }
  // Read remaining body
  while (client->available()) { body += (char)client->read(); }
  client->stop();
  if (responseBody) *responseBody = body;
  return statusCode;
}

// ══════════ Cloud Enrollment POST ══════════
bool postCloudEnroll(int slotId, const char* base64Data, int base64Len) {
  if (!wifiConnected) return false;
  String prefix = "{\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\",\"slotId\":" + String(slotId) + ",\"image_base64\":\"";
  String suffix = "\"}";
  String resp;
  Serial.printf("[CLOUD-ENROLL] Streaming %d bytes to server...\n", base64Len);
  int code = streamPost("/api/esp32/cloud-enroll",
    prefix.c_str(), prefix.length(), base64Data, base64Len,
    suffix.c_str(), suffix.length(), &resp);
  Serial.printf("[CLOUD-ENROLL] Response: %d — %s\n", code, resp.c_str());
  return (code >= 200 && code < 300);
}

// ══════════ Cloud Verification POST ══════════
bool postCloudVerify(const char* base64Data, int base64Len) {
  if (!wifiConnected) return false;
  String prefix = "{\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\",\"image_base64\":\"";
  String suffix = "\"}";
  String resp;
  Serial.printf("[CLOUD-VERIFY] Streaming %d bytes to server...\n", base64Len);
  int code = streamPost("/api/esp32/cloud-verify",
    prefix.c_str(), prefix.length(), base64Data, base64Len,
    suffix.c_str(), suffix.length(), &resp);
  if (code >= 200 && code < 300) {
    if (resp.indexOf("\"match\":true") >= 0) {
      int ni = resp.indexOf("\"studentName\":\"");
      String name = "Unknown";
      if (ni > 0) { int s=ni+15; int e=resp.indexOf("\"",s); if(e>s) name=resp.substring(s,e); }
      Serial.printf("[CLOUD-VERIFY] ✓ MATCH — %s\n", name.c_str());
      return true;
    }
    Serial.println("[CLOUD-VERIFY] ✕ No match"); return false;
  }
  Serial.printf("[CLOUD-VERIFY] Server error: %d\n", code); return false;
}

// ══════════ Heartbeat ══════════
void sendHeartbeat() {
  if (!wifiConnected) return;
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp32/heartbeat";
  http.begin(url); http.addHeader("Content-Type","application/json"); http.setTimeout(5000);
  unsigned long up = (millis() - bootTime) / 1000;
  int rssi = WiFi.RSSI(); int heap = ESP.getFreeHeap();
  String json = "{\"deviceSecret\":\""+String(DEVICE_SECRET)+"\",\"deviceId\":\"ESP32_MAIN\",\"mode\":\""+String(modeToString(currentMode))+"\",\"rssi\":"+String(rssi)+",\"freeHeap\":"+String(heap)+",\"sdReady\":"+String(sdReady?"true":"false")+",\"sensorStatus\":"+String(sensorReady?"true":"false")+",\"uptime\":"+String(up)+",\"templateCount\":0}";
  int code = http.POST(json);
  if (code == 200) {
    String response = http.getString();
    int cmdIdx = response.indexOf("\"command\":\"");
    if (cmdIdx > 0) {
      int si = cmdIdx + 11; int ei = response.indexOf("\"", si);
      if (ei > si) {
        String cmd = response.substring(si, ei);
        if (cmd == "none") { /* noop */ }
        else if (cmd.startsWith("CLOUD_ENROLL:") && currentMode != MODE_REGISTRATION) {
          int slot = cmd.substring(13).toInt();
          if (slot > 0 && slot <= 127) {
            enrollNewID = slot; currentMode = MODE_REGISTRATION; enrollState = ENROLL_IDLE;
            Serial.printf("[REMOTE] CLOUD_ENROLL slot %d\n", slot); ledPurple(); beep(150);
          }
        }
        else if (cmd == "VERIFY:START" && currentMode != MODE_VERIFICATION) {
          currentMode = MODE_VERIFICATION; Serial.println("[REMOTE] VERIFY:START"); ledYellow(); beep(80);
        }
        else if (cmd == "VERIFY:STOP" && currentMode == MODE_VERIFICATION) {
          currentMode = MODE_DEFAULT; Serial.println("[REMOTE] VERIFY:STOP"); ledBlue(); beep(60);
        }
        else if (cmd == "EMPTY_ALL") {
          Serial.println("[REMOTE] Clearing sensor..."); finger.emptyDatabase(); ledBlue(); beep(100);
        }
        else if (cmd != "none") { Serial.printf("[REMOTE] Unknown: %s\n", cmd.c_str()); }
      }
    }
  }
  http.end();
  if (code != 200) Serial.printf("[HEARTBEAT] FAILED: %d\n", code);
}

// ══════════ SD Logging ══════════
void logToSD(String event,int id,String status,bool synced){
  if(!sdReady)return; struct tm t; char ts[24]="unknown";
  if(getLocalTime(&t)) snprintf(ts,sizeof(ts),"%04d-%02d-%02d %02d:%02d:%02d",t.tm_year+1900,t.tm_mon+1,t.tm_mday,t.tm_hour,t.tm_min,t.tm_sec);
  File f=SD.open("/log.csv",FILE_APPEND);
  if(f){f.printf("%s,%s,%s,%s,%s\n",ts,event.c_str(),makeUserID(id).c_str(),status.c_str(),synced?"YES":"NO");f.close();}
}

// ══════════ Helper: Capture + Base64 Encode ══════════
// Returns malloc'd base64 string and length via pointer. Caller must free().
// Returns NULL on failure.
char* captureFingerImage(int* outLen) {
  uint8_t* imgBuf = (uint8_t*)malloc(FP_IMAGE_RAW_SIZE);
  if (!imgBuf) { Serial.println("[CLOUD] malloc img FAILED"); return NULL; }

  int bytesRead = readRawImageFromSensor(imgBuf, FP_IMAGE_RAW_SIZE);
  if (bytesRead < FP_IMAGE_RAW_SIZE / 4) {
    Serial.printf("[CLOUD] Image too small: %d bytes\n", bytesRead);
    free(imgBuf); return NULL;
  }

  int b64Size = BASE64_ENCODED_SIZE(bytesRead) + 1;
  char* b64Buf = (char*)malloc(b64Size);
  if (!b64Buf) { Serial.println("[CLOUD] malloc b64 FAILED"); free(imgBuf); return NULL; }

  *outLen = base64Encode(imgBuf, bytesRead, b64Buf, b64Size);
  free(imgBuf); // raw image no longer needed
  Serial.printf("[CLOUD] Base64: %d chars\n", *outLen);
  return b64Buf;
}

// ══════════ Cloud Enrollment FSM (Single Scan) ══════════
void handleEnrollment(){
  unsigned long now = millis();
  switch(enrollState){
    case ENROLL_IDLE:
      if (enrollNewID <= 0 || enrollNewID > 127) {
        Serial.println("[ENROLL] Invalid slot!"); ledRed(); beepTimes(3,100,80); delay(2000);
        postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); return;
      }
      Serial.printf("[CLOUD-ENROLL] Slot %d — PLACE FINGER on sensor\n", enrollNewID);
      ledPurple(); beep(100); enrollTimeout=now; enrollState=ENROLL_WAIT_FINGER; break;

    case ENROLL_WAIT_FINGER:
      if (now - enrollTimeout > 30000) {
        Serial.println("[CLOUD-ENROLL] Timeout"); postToServer("ENROLL", enrollNewID, "FAILED");
        enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; return;
      }
      if (finger.getImage() == FINGERPRINT_OK) {
        Serial.println("[CLOUD-ENROLL] ✓ Finger detected — KEEP FINGER ON SENSOR...");
        ledWhite(); beep(100); enrollState = ENROLL_CAPTURE;
      }
      break;

    case ENROLL_CAPTURE: {
      int b64Len = 0;
      char* b64Buf = captureFingerImage(&b64Len);
      if (!b64Buf) { enrollState = ENROLL_FAIL; break; }
      ledWhite(); // stay white during upload
      bool ok = postCloudEnroll(enrollNewID, b64Buf, b64Len);
      free(b64Buf);
      enrollState = ok ? ENROLL_SUCCESS : ENROLL_FAIL;
      break; }

    case ENROLL_SUCCESS: {
      logToSD("ENROLL", enrollNewID, "SUCCESS", true);
      Serial.printf("[CLOUD-ENROLL] ✓ SUCCESS: slot %d stored in cloud\n", enrollNewID);
      ledGreen(); beepTimes(2,150,100); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    case ENROLL_FAIL: {
      logToSD("ENROLL", enrollNewID, "FAILED", wifiConnected);
      postToServer("ENROLL", enrollNewID, "FAILED");
      Serial.println("[CLOUD-ENROLL] ✕ FAILED");
      ledRed(); beepTimes(3,100,80); delay(3000);
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break; }

    default:
      enrollNewID=-1; currentMode=MODE_DEFAULT; ledBlue(); enrollState=ENROLL_IDLE; break;
  }
}

// ══════════ Sleep ══════════
void enterSleepMode(){
  Serial.println("[SLEEP] Entering deep sleep...");
  ledOff(); delay(200);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)BUTTON_PIN, 0);
  esp_deep_sleep_start();
}

// ══════════ SETUP ══════════
void setup(){
  Serial.begin(115200); delay(200);
  bootTime = millis();
  Serial.println("\n============================");
  Serial.println("  NutoPass Attendance v3.0");
  Serial.println("  Cloud Biometric Mode");
  Serial.println("============================\n");

  pinMode(SD_CS,OUTPUT); digitalWrite(SD_CS,HIGH);
  pinMode(BUTTON_PIN,INPUT_PULLUP); pinMode(BUZZER_PIN,OUTPUT);
  pinMode(LED_RED,OUTPUT); pinMode(LED_GREEN,OUTPUT); pinMode(LED_BLUE,OUTPUT);
  digitalWrite(BUZZER_PIN,LOW); ledOff();
  blinkWhite(3,150,100); ledWhite();

  // SD Card
  SPI.begin(SPI_SCK,SPI_MISO,SPI_MOSI); delay(50);
  sdReady = SD.begin(SD_CS,SPI);
  Serial.printf("[INIT] SD Card: %s\n", sdReady?"OK":"FAILED");
  if(sdReady){ledGreen();beep(60);}else{ledRed();beepTimes(2,100,80);}
  delay(300);

  // Fingerprint sensor (camera mode — DSP bypassed)
  fpSerial.begin(57600, SERIAL_8N1, FP_RX, FP_TX);
  finger.begin(57600);
  if(finger.verifyPassword()){
    Serial.println("[INIT] R307 sensor: OK (camera mode — DSP bypassed)");
    sensorReady = true; ledGreen(); beep(60);
  } else {
    Serial.println("[INIT] R307 sensor: FAILED (Check wiring!)");
    sensorReady = false; ledRed(); beepTimes(3,100,80);
  }
  delay(300);

  // WiFi
  Serial.printf("[INIT] Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while(WiFi.status()!=WL_CONNECTED && attempts<20){
    delay(500); Serial.print("."); attempts++;
    ledYellow(); delay(100); ledOff(); delay(100);
  }
  if(WiFi.status()==WL_CONNECTED){
    wifiConnected = true;
    Serial.printf("\n[INIT] WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    configTime(gmtOffset, daylightOffset, "pool.ntp.org", "time.nist.gov");
    ntpSynced=true; cloudReady=true;
    ledGreen(); beepTimes(2,60,60);
  } else {
    Serial.println("\n[INIT] WiFi FAILED — cloud features disabled");
    ledRed(); beepTimes(3,100,80);
  }
  delay(500);

  currentMode = MODE_DEFAULT;
  Serial.println("[READY] Mode: DEFAULT (Blue LED)");
  Serial.println("  All matching happens in the cloud");
  Serial.println("  Button: 1 press = toggle VERIFICATION | Long press = SLEEP");
  ledBlue(); beep(100);
  lastTick=millis(); lastWifiCheck=millis(); lastSyncAttempt=millis(); lastHeartbeat=millis();
}

// ══════════ LOOP ══════════
void loop(){
  unsigned long now = millis();

  // WiFi check every 5s
  if(now-lastWifiCheck>=5000){
    lastWifiCheck=now; bool was=wifiConnected;
    wifiConnected = (WiFi.status()==WL_CONNECTED);
    if(!was && wifiConnected){
      Serial.println("[WIFI] Reconnected!");
      configTime(gmtOffset,daylightOffset,"pool.ntp.org","time.nist.gov");
      ntpSynced=true; cloudReady=true; ledBlue();
    }
    if(was && !wifiConnected){
      Serial.println("[WIFI] Disconnected"); cloudReady=false; WiFi.begin(ssid,password);
    }
  }

  // Heartbeat every 5s
  if(wifiConnected && now-lastHeartbeat>=HEARTBEAT_INTERVAL_MS){
    lastHeartbeat=now; sendHeartbeat();
  }

  // Button logic
  bool btnDown = (digitalRead(BUTTON_PIN)==LOW);
  if(btnDown && !btnWasDown){btnWasDown=true; btnDownTime=now; longPressHandled=false;}
  if(btnWasDown && btnDown && !longPressHandled){
    if(now-btnDownTime>=LONG_PRESS_MS){
      longPressHandled=true; pressCount=0;
      currentMode=MODE_SLEEP; enterSleepMode();
    }
  }
  if(!btnDown && btnWasDown){
    btnWasDown=false;
    if(!longPressHandled){ pressCount++; lastPressTime=now; }
  }
  if(!btnDown && pressCount>0 && (now-lastPressTime>=MULTI_PRESS_WINDOW_MS) && !longPressHandled){
    int count=pressCount; pressCount=0;
    if(count==1){
      if(currentMode==MODE_DEFAULT){
        currentMode=MODE_VERIFICATION;
        Serial.println("[MODE] -> VERIFICATION (Yellow LED)"); ledYellow(); beep(80);
      } else if(currentMode==MODE_VERIFICATION){
        currentMode=MODE_DEFAULT;
        Serial.println("[MODE] -> DEFAULT (Blue LED)"); ledBlue(); beep(60);
      }
    }
  }

  // ── Cloud Verification ──
  if(currentMode==MODE_VERIFICATION && sensorReady && wifiConnected){
    if(finger.getImage()==FINGERPRINT_OK){
      Serial.println("[CLOUD-VERIFY] Finger detected — KEEP FINGER ON SENSOR...");
      ledWhite(); beep(100);

      int b64Len = 0;
      char* b64Buf = captureFingerImage(&b64Len);
      if(!b64Buf){ ledRed(); beepTimes(3,80,80); delay(2000); ledYellow(); return; }

      Serial.printf("[CLOUD-VERIFY] Uploading %d bytes...\n", b64Len);
      bool matched = postCloudVerify(b64Buf, b64Len);
      free(b64Buf);

      if(matched){
        Serial.println("[CLOUD-VERIFY] ✓ MATCH CONFIRMED");
        ledGreen(); beepTimes(1,120,0); delay(2500);
      } else {
        Serial.println("[CLOUD-VERIFY] ✕ NO MATCH");
        ledRed(); beepTimes(2,80,80); delay(2000);
      }
      ledYellow();
    }
  }

  // ── Registration ──
  if(currentMode==MODE_REGISTRATION){ handleEnrollment(); }
}
