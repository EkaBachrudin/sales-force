/**
 * Google Apps Script untuk mengcollect data dari form "Saya Tertarik!"
 * ke Google Sheets.
 *
 * CARA SETUP:
 * 1. Buat Google Sheet baru di https://sheets.google.com
 * 2. Di baris pertama, tambahkan header: Timestamp, Email, WhatsApp, Message, Source
 * 3. Di Google Sheet, klik Extensions > Apps Script
 * 4. Copy & paste script ini
 * 5. Klik Deploy > New deployment
 * 6. Pilih type: Web app
 * 7. Description: "Lead Form Handler"
 * 8. Execute as: Me (email Anda)
 * 9. Who has access: Anyone
 * 10. Klik Deploy, laluAuthorize access
 * 11. Copy URL yang muncul (format: https://script.google.com/macros/s/...)
 * 12. Paste ke file .env.local sebagai GOOGLE_SCRIPT_URL
 */

// ID Spreadsheet (otomatis terdeteksi dari script yang terpasang)
const SHEET_NAME = 'Interest';

function doPost(e) {
  try {
    // Validasi: jika e undefined (saat testing dari editor)
    if (!e || !e.parameter) {
      return ContentService.createTextOutput(
        JSON.stringify({
          result: 'error',
          message: 'No parameters received. Please use POST request with form data.'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Lock untuk mencegah race condition
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    // Get atau create sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Create sheet dengan headers jika belum ada
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      newSheet.appendRow(['Timestamp', 'Email', 'WhatsApp', 'Message', 'Source']);
      newSheet.setFrozenRows(1);

      // Styling header
      newSheet.getRange('A1:E1').setFontWeight('bold').setBackground('#2563EB').setFontColor('#FFFFFF');
    }

    // Parse data dari form
    const data = e.parameter;
    const timestamp = data.timestamp || new Date().toISOString();
    const email = data.email || '';
    const whatsapp = data.whatsapp || '';
    const message = data.message || '';
    const source = data.source || 'unknown';

    // Append row ke sheet
    sheet.appendRow([timestamp, email, whatsapp, message, source]);

    // Response
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success', message: 'Data berhasil disimpan' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    LockService.getScriptLock().releaseLock();
  }
}

// doGet untuk test
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'active',
      message: 'Lead collection API is running',
      sheet: SHEET_NAME
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Helper: Setup sheet pertama kali
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Cek apakah sheet sudah ada
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Create sheet baru
    sheet = ss.insertSheet(SHEET_NAME);

    // Add headers
    sheet.appendRow(['Timestamp', 'Email', 'WhatsApp', 'Message', 'Source']);

    // Styling
    sheet.getRange('A1:E1')
      .setFontWeight('bold')
      .setBackground('#2563EB')
      .setFontColor('#FFFFFF')
      .setFontSize(12);

    // Set column widths
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 200); // Email
    sheet.setColumnWidth(3, 150); // WhatsApp
    sheet.setColumnWidth(4, 300); // Message
    sheet.setColumnWidth(5, 120); // Source

    // Freeze header row
    sheet.setFrozenRows(1);

    // Add protection untuk header
    const protections = sheet.protect()
      .setDescription('Header row is protected')
      .setWarningOnly(true);
  }

  return sheet;
}
