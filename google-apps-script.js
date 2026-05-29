/**
 * ================================================
 * TRIGGA.AI — Google Apps Script (FIXED VERSION)
 * Google Sheets + Gmail Integration
 * ================================================
 */
 
const ADMIN_EMAIL = "talhabinsaeed36@gmail.com";
 
// ─── Sheet auto create/find ───────────────────────
function getSpreadsheet() {
  var files = DriveApp.getFilesByName("TRIGGA.AI Data");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    return SpreadsheetApp.create("TRIGGA.AI Data");
  }
}
 
// ─── MAIN FUNCTION ────────────────────────────────
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(raw);
    var ss   = getSpreadsheet();
    var type = data.type || "lead";
    var now  = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
 
    if (type === "demo") {
      saveDemoBooking(ss, data, now);
    } else if (type === "contact") {
      saveContactMessage(ss, data, now);
    } else {
      saveLeadCapture(ss, data, now);
    }
 
    sendEmailNotification(type, data, now);
 
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
 
  } catch (err) {
    // Even if sheets fails — still send email
    try {
      GmailApp.sendEmail(
        ADMIN_EMAIL,
        "⚡ New Form Submission — TRIGGA.AI",
        "New submission received!\n\nData: " + (e.postData ? e.postData.contents : "no data") + "\n\nError: " + err.toString()
      );
    } catch(e2) {}
 
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
 
// ─── SAVE DEMO BOOKING ───────────────────────────
function saveDemoBooking(ss, data, now) {
  var sheet = ss.getSheetByName("Demo Bookings");
  if (!sheet) {
    sheet = ss.insertSheet("Demo Bookings");
    sheet.appendRow(["Date/Time","First Name","Last Name","Email","Phone","Company","Size","Challenge","Demo Date","Time"]);
    sheet.getRange(1,1,1,10).setBackground("#1a1a2e").setFontColor("#00e5ff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([now, data.firstName||"", data.lastName||"", data.email||"", data.phone||"", data.company||"", data.companySize||"", data.challenge||"", data.date||"", data.time||""]);
}
 
// ─── SAVE CONTACT MESSAGE ────────────────────────
function saveContactMessage(ss, data, now) {
  var sheet = ss.getSheetByName("Contact Messages");
  if (!sheet) {
    sheet = ss.insertSheet("Contact Messages");
    sheet.appendRow(["Date/Time","Name","Email","Phone","Company","Topic","Message","Urgent?"]);
    sheet.getRange(1,1,1,8).setBackground("#1a1a2e").setFontColor("#00e5ff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([now, data.name||"", data.email||"", data.phone||"", data.company||"", data.topic||"", data.message||"", data.urgent?"YES":"No"]);
}
 
// ─── SAVE LEAD ───────────────────────────────────
function saveLeadCapture(ss, data, now) {
  var sheet = ss.getSheetByName("Leads");
  if (!sheet) {
    sheet = ss.insertSheet("Leads");
    sheet.appendRow(["Date/Time","Name","Email","Phone","Source"]);
    sheet.getRange(1,1,1,5).setBackground("#1a1a2e").setFontColor("#00e5ff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([now, data.name||"", data.email||"", data.phone||"", data.source||"Website"]);
}
 
// ─── GMAIL NOTIFICATION ──────────────────────────
function sendEmailNotification(type, data, now) {
  var subjects = {
    "demo":    "🎯 New Demo Booking — TRIGGA.AI",
    "contact": "📧 New Contact Message — TRIGGA.AI",
    "lead":    "⚡ New Lead Captured — TRIGGA.AI"
  };
 
  var body = "TRIGGA.AI — New " + type.toUpperCase() + " Submission\n";
  body    += "Time: " + now + "\n\n";
  body    += "─────────────────────────\n";
 
  if (type === "demo") {
    body += "Name:    " + (data.firstName||"") + " " + (data.lastName||"") + "\n";
    body += "Email:   " + (data.email||"") + "\n";
    body += "Phone:   " + (data.phone||"") + "\n";
    body += "Company: " + (data.company||"") + "\n";
    body += "Demo:    " + (data.date||"") + " at " + (data.time||"") + "\n";
  } else if (type === "contact") {
    body += "Name:    " + (data.name||"") + "\n";
    body += "Email:   " + (data.email||"") + "\n";
    body += "Topic:   " + (data.topic||"") + "\n";
    body += "Urgent:  " + (data.urgent ? "YES" : "No") + "\n\n";
    body += "Message:\n" + (data.message||"") + "\n";
  } else {
    body += "Name:  " + (data.name||"") + "\n";
    body += "Email: " + (data.email||"") + "\n";
  }
 
  GmailApp.sendEmail(ADMIN_EMAIL, subjects[type] || "New Submission — TRIGGA.AI", body);
}
 
// ─── GET (health check) ───────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, status: "TRIGGA.AI running!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
 
