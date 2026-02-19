/**
 * Code.gs - BUCA Talent Check-in System
 * 
 * Instructions:
 * 1. Copy ALL this code into your Google Apps Script project.
 * 2. Deploy as Web App -> Execute as: "Me" -> Who has access: "Anyone".
 * 3. Copy the URL to use in admin.html and index.html.
 */

const SHEET_ID = "1305nzc11M07RBkgisCjvBmrlPEg6tnaWzedsXkUBQAw"; // User provided Sheet ID

function doGet(e) {
  const params = e.parameter;
  const action = params.action;

  if (action === "getConfig") {
    return getConfig();
  }

  // Fallback
  return ContentService.createTextOutput("BUCA Check-in API is running.");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "setConfig") {
      return setConfig(data);
    } else {
      // Default: Check-in logic
      return handleCheckIn(data);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Status/Config Functions ---

function getConfig() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Settings");
  
  // Create Settings sheet if not exists
  if (!sheet) {
    sheet = ss.insertSheet("Settings");
    sheet.appendRow(["Key", "Value", "Description"]);
    sheet.appendRow(["targetLat", "13.0000", "Latitiude of the meeting room"]);
    sheet.appendRow(["targetLng", "100.0000", "Longitude of the meeting room"]);
    sheet.appendRow(["radius", "50", "Check-in radius in meters"]);
    sheet.appendRow(["isOpen", "true", "Is check-in open? (true/false)"]);
  }

  // Read values
  const data = sheet.getDataRange().getValues();
  // Simple key-value parser (assumes Key in Col A, Value in Col B)
  const config = {};
  for(let i=1; i<data.length; i++) {
    const key = data[i][0];
    const val = data[i][1];
    config[key] = val;
  }

  return ContentService.createTextOutput(JSON.stringify(config))
    .setMimeType(ContentService.MimeType.JSON);
}

function setConfig(data) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName("Settings");
  
  if (!sheet) return errorResponse("Settings sheet not found");

  // Helper to update specific key
  // We assume fixed structure for simplicity, or we search. searching is safer.
  const updateKey = (key, value) => {
    const range = sheet.getDataRange();
    const values = range.getValues();
    for(let i=0; i<values.length; i++) {
      if(values[i][0] === key) {
        sheet.getRange(i+1, 2).setValue(value);
        return;
      }
    }
    // If key not found, append it
    sheet.appendRow([key, value, "Auto-generated"]);
  };

  if(data.targetLat) updateKey("targetLat", data.targetLat);
  if(data.targetLng) updateKey("targetLng", data.targetLng);
  if(data.radius) updateKey("radius", data.radius);
  if(data.isOpen !== undefined) updateKey("isOpen", data.isOpen.toString());

  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Config updated" }))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- Check-in Functions ---

function handleCheckIn(data) {
  const ss = getSpreadsheet();
  // Changed to 'BCTLcheckin' based on user request/screenshot
  const sheet = ss.getSheetByName("BCTLcheckin"); 
  
  if (!sheet) {
      return errorResponse("Make sure the sheet name is 'BCTLcheckin'");
  }

  // Column matching based on screenshot:
  // A: Timestamp, B: Name, C: Department, D: Cohort, E: Lat, F: Lng, G: Accuracy, H: Distance(m), I: UA
  sheet.appendRow([
    new Date(),        // A
    data.name,         // B
    data.department,   // C
    data.cohort,       // D
    data.lat,          // E
    data.lng,          // F
    data.accuracy,     // G
    data.distance_m,   // H
    data.ua            // I
  ]);

  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Utility ---

function getSpreadsheet() {
  if (SHEET_ID) {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
