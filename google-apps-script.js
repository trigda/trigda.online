/**
 * ================================================
 * TRIGGA.AI — Google Apps Script
 * Google Sheets + Gmail Integration
 * 
 * SETUP: Yeh code script.google.com par paste karo
 * ================================================
 */

// ✏️ APNI EMAIL YAHAN LIKHO (Gmail notifications yahan aayenge)
const ADMIN_EMAIL = "talhabinsaeed36@gmail.com";

// ================================================
// MAIN FUNCTION — Har form submission yahan aata hai
// ================================================
function doPost(e) {
  try {
    const raw  = e.postData ? e.postData.contents : "";
    const data = JSON.parse(raw);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const type = data.type || "lead";
    const now  = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });

    // ─── 1. GOOGLE SHEETS MEIN SAVE ───────────────
    if (type === "demo") {
      saveDemoBooking(ss, data, now);
    } else if (type === "contact") {
      saveContactMessage(ss, data, now);
    } else {
      saveLeadCapture(ss, data, now);
    }

    // ─── 2. GMAIL NOTIFICATION BHEJO ──────────────
    sendEmailNotification(type, data, now);

    return buildResponse({ success: true, message: "Data saved!" });

  } catch (err) {
    Logger.log("Error: " + err.toString());
    return buildResponse({ success: false, error: err.toString() });
  }
}

// ─── SAVE DEMO BOOKING ───────────────────────────
function saveDemoBooking(ss, data, now) {
  let sheet = ss.getSheetByName("📅 Demo Bookings");
  if (!sheet) {
    sheet = ss.insertSheet("📅 Demo Bookings");
    sheet.appendRow([
      "Date/Time", "First Name", "Last Name", "Email",
      "Phone", "Company", "Company Size", "Challenge",
      "Demo Date", "Time Slot"
    ]);
    styleHeader(sheet);
  }
  sheet.appendRow([
    now,
    data.firstName || "",
    data.lastName  || "",
    data.email     || "",
    data.phone     || "",
    data.company   || "",
    data.companySize || "",
    data.challenge   || "",
    data.date        || "",
    data.time        || ""
  ]);
}

// ─── SAVE CONTACT MESSAGE ────────────────────────
function saveContactMessage(ss, data, now) {
  let sheet = ss.getSheetByName("📧 Contact Messages");
  if (!sheet) {
    sheet = ss.insertSheet("📧 Contact Messages");
    sheet.appendRow([
      "Date/Time", "Name", "Email", "Phone",
      "Company", "Topic", "Message", "Urgent?"
    ]);
    styleHeader(sheet);
  }
  sheet.appendRow([
    now,
    data.name    || "",
    data.email   || "",
    data.phone   || "",
    data.company || "",
    data.topic   || "",
    data.message || "",
    data.urgent  ? "YES ⚡" : "No"
  ]);
}

// ─── SAVE LEAD CAPTURE ───────────────────────────
function saveLeadCapture(ss, data, now) {
  let sheet = ss.getSheetByName("🎯 Leads");
  if (!sheet) {
    sheet = ss.insertSheet("🎯 Leads");
    sheet.appendRow(["Date/Time", "Name", "Email", "Phone", "Source"]);
    styleHeader(sheet);
  }
  sheet.appendRow([
    now,
    data.name   || "",
    data.email  || "",
    data.phone  || "",
    data.source || "Website"
  ]);
}

// ─── GMAIL NOTIFICATION ──────────────────────────
function sendEmailNotification(type, data, now) {
  const subjects = {
    demo:    "🎯 New Demo Booking — TRIGGA.AI",
    contact: "📧 New Contact Message — TRIGGA.AI",
    lead:    "⚡ New Lead Captured — TRIGGA.AI"
  };

  let body = `TRIGGA.AI — New Submission\n`;
  body    += `Time: ${now}\n`;
  body    += `Type: ${type.toUpperCase()}\n\n`;
  body    += `─────────────────────────\n`;

  if (type === "demo") {
    body += `Name:    ${data.firstName} ${data.lastName}\n`;
    body += `Email:   ${data.email}\n`;
    body += `Phone:   ${data.phone}\n`;
    body += `Company: ${data.company} (${data.companySize})\n`;
    body += `Challenge: ${data.challenge}\n`;
    body += `Demo Date: ${data.date} at ${data.time}\n`;
  } else if (type === "contact") {
    body += `Name:    ${data.name}\n`;
    body += `Email:   ${data.email}\n`;
    body += `Phone:   ${data.phone}\n`;
    body += `Company: ${data.company}\n`;
    body += `Topic:   ${data.topic}\n`;
    body += `Urgent:  ${data.urgent ? "YES ⚡" : "No"}\n\n`;
    body += `Message:\n${data.message}\n`;
  } else {
    body += `Name:   ${data.name}\n`;
    body += `Email:  ${data.email}\n`;
    body += `Phone:  ${data.phone}\n`;
    body += `Source: ${data.source}\n`;
  }

  body += `\n─────────────────────────\n`;
  body += `View in Google Sheets: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}\n`;

  GmailApp.sendEmail(ADMIN_EMAIL, subjects[type] || "New Submission", body);
}

// ─── STYLE HEADER ROW ────────────────────────────
function styleHeader(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  header.setBackground("#1a1a2e");
  header.setFontColor("#00e5ff");
  header.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

// ─── BUILD CORS RESPONSE ─────────────────────────
function buildResponse(obj) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─── GET REQUEST (health check) ──────────────────
function doGet(e) {
  return buildResponse({ success: true, status: "TRIGGA.AI API running ✅" });
}
