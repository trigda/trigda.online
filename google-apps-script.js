/**
 * TRIGGA.AI — Google Apps Script (FINAL WORKING VERSION)
 * GET request approach — 100% CORS issue fix
 */

const ADMIN_EMAIL = "talhabinsaeed36@gmail.com";

// Auto create/find spreadsheet
function getSpreadsheet() {
  var files = DriveApp.getFilesByName("TRIGGA.AI Data");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create("TRIGGA.AI Data");
}

// ─── MAIN: Handle GET request ─────────────────────
function doGet(e) {
  try {
    var p    = e.parameter;
    var type = p.type || "lead";
    var ss   = getSpreadsheet();
    var now  = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

    if (type === "demo") {
      saveDemoBooking(ss, p, now);
    } else if (type === "contact") {
      saveContactMessage(ss, p, now);
    } else {
      saveLeadCapture(ss, p, now);
    }

    sendEmail(type, p, now);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    try {
      GmailApp.sendEmail(ADMIN_EMAIL, "TRIGGA.AI Error", err.toString());
    } catch(e2) {}
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Keep doPost as backup
function doPost(e) {
  return doGet(e);
}

// ─── SAVE DEMO ────────────────────────────────────
function saveDemoBooking(ss, p, now) {
  var sheet = ss.getSheetByName("Demo Bookings");
  if (!sheet) {
    sheet = ss.insertSheet("Demo Bookings");
    sheet.appendRow(["Date/Time","First Name","Last Name","Email","Phone","Company","Size","Challenge","Demo Date","Time"]);
    formatHeader(sheet, 10);
  }
  sheet.appendRow([now, p.firstName||"", p.lastName||"", p.email||"", p.phone||"", p.company||"", p.companySize||"", p.challenge||"", p.date||"", p.time||""]);
}

// ─── SAVE CONTACT ─────────────────────────────────
function saveContactMessage(ss, p, now) {
  var sheet = ss.getSheetByName("Contact Messages");
  if (!sheet) {
    sheet = ss.insertSheet("Contact Messages");
    sheet.appendRow(["Date/Time","Name","Email","Phone","Company","Topic","Message","Urgent?"]);
    formatHeader(sheet, 8);
  }
  sheet.appendRow([now, p.name||"", p.email||"", p.phone||"", p.company||"", p.topic||"", p.message||"", p.urgent==="true"?"YES":"No"]);
}

// ─── SAVE LEAD ────────────────────────────────────
function saveLeadCapture(ss, p, now) {
  var sheet = ss.getSheetByName("Leads");
  if (!sheet) {
    sheet = ss.insertSheet("Leads");
    sheet.appendRow(["Date/Time","Name","Email","Phone","Source"]);
    formatHeader(sheet, 5);
  }
  sheet.appendRow([now, p.name||"", p.email||"", p.phone||"", p.source||"Website"]);
}

// ─── SEND EMAIL ───────────────────────────────────
function sendEmail(type, p, now) {
  var subjects = {
    "demo":    "🎯 New Demo Booking — TRIGGA.AI",
    "contact": "📧 New Contact Message — TRIGGA.AI",
    "lead":    "⚡ New Lead Captured — TRIGGA.AI"
  };

  var body = "TRIGGA.AI New Submission\n";
  body    += "Type: " + type.toUpperCase() + "\n";
  body    += "Time: " + now + "\n\n";
  body    += "─────────────────\n";

  if (type === "demo") {
    body += "Name:    " + (p.firstName||"") + " " + (p.lastName||"") + "\n";
    body += "Email:   " + (p.email||"") + "\n";
    body += "Phone:   " + (p.phone||"") + "\n";
    body += "Company: " + (p.company||"") + "\n";
    body += "Demo:    " + (p.date||"") + " at " + (p.time||"") + "\n";
  } else if (type === "contact") {
    body += "Name:    " + (p.name||"") + "\n";
    body += "Email:   " + (p.email||"") + "\n";
    body += "Topic:   " + (p.topic||"") + "\n";
    body += "Message: " + (p.message||"") + "\n";
    body += "Urgent:  " + (p.urgent==="true"?"YES":"No") + "\n";
  } else {
    body += "Name:  " + (p.name||"") + "\n";
    body += "Email: " + (p.email||"") + "\n";
  }

  GmailApp.sendEmail(ADMIN_EMAIL, subjects[type]||"New Submission", body);
}

// ─── FORMAT HEADER ────────────────────────────────
function formatHeader(sheet, cols) {
  sheet.getRange(1,1,1,cols)
    .setBackground("#1a1a2e")
    .setFontColor("#00e5ff")
    .setFontWeight("bold");
  sheet.setFrozenRows(1);
}
