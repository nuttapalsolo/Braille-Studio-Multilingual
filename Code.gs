/**
 * Google Apps Script (GAS) Backend for Multilingual Braille Web App
 * 
 * Serves Web App interface and reads Braille datasets directly from Google Sheets.
 */

function doGet(e) {
  // Handle API JSON requests e.g. ?action=getData&sheetUrl=YOUR_SHEET_URL
  if (e && e.parameter && (e.parameter.action === 'getData' || e.parameter.sheetUrl || e.parameter.spreadsheetId)) {
    var sheetUrl = e.parameter.sheetUrl || e.parameter.spreadsheetId || '';
    var sheetName = e.parameter.sheetName || '';
    try {
      var data = getBrailleDataFromSheet(sheetUrl, sheetName);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: data.length, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Serve HTML interface if Index.html exists
  try {
    var html = HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Braille Studio - Multilingual Google Sheets')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    return html;
  } catch (err) {
    return ContentService.createTextOutput("Braille Studio Google Apps Script API active!\nUsage: Add ?action=getData&sheetUrl=YOUR_GOOGLE_SHEET_URL to fetch JSON braille data.")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Fetch Braille entries directly from a Google Sheet
 * @param {string} spreadsheetIdOrUrl Google Sheet Spreadsheet ID or URL
 * @param {string} sheetName Optional Sheet tab name (defaults to active or first sheet)
 * @returns {Array} Array of BrailleCharacterEntry objects
 */
function getBrailleDataFromSheet(spreadsheetIdOrUrl, sheetName) {
  try {
    var ss;
    if (!spreadsheetIdOrUrl) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } else if (spreadsheetIdOrUrl.indexOf('http') === 0) {
      ss = SpreadsheetApp.openByUrl(spreadsheetIdOrUrl);
    } else {
      ss = SpreadsheetApp.openById(spreadsheetIdOrUrl);
    }

    if (!ss) {
      throw new Error("Could not open Google Sheet. Check Spreadsheet ID/URL or permissions.");
    }

    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }

    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    
    // Find column indexes
    var charIdx = headers.indexOf('character');
    if (charIdx === -1) charIdx = headers.indexOf('char');
    var unicodeIdx = headers.indexOf('brailleunicode');
    if (unicodeIdx === -1) unicodeIdx = headers.indexOf('braille');
    var dotsIdx = headers.indexOf('dots');
    var categoryIdx = headers.indexOf('category');
    var sourceIdx = headers.indexOf('source');
    var verifiedIdx = headers.indexOf('verified');
    var noteIdx = headers.indexOf('note');
    var typeIdx = headers.indexOf('type');

    var entries = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var character = charIdx !== -1 ? String(row[charIdx]).trim() : '';
      if (!character && character !== ' ') continue;

      var rawDots = dotsIdx !== -1 ? String(row[dotsIdx]).trim() : '';
      var dots = parseDots(rawDots);
      
      var unicodeChar = unicodeIdx !== -1 ? String(row[unicodeIdx]).trim() : '';
      if (!unicodeChar && dots.length > 0) {
        unicodeChar = dotsToUnicode(dots);
      }

      var verified = true;
      if (verifiedIdx !== -1) {
        var vVal = String(row[verifiedIdx]).toLowerCase();
        verified = vVal === 'true' || vVal === '1' || vVal === 'yes' || vVal === 'y';
      }

      entries.push({
        id: 'gsheet-' + i + '-' + Math.random().toString(36).substring(2, 6),
        language: 'custom',
        character: character,
        brailleUnicode: unicodeChar,
        dots: dots,
        type: typeIdx !== -1 && row[typeIdx] ? String(row[typeIdx]) : 'letter',
        category: categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]) : 'Google Sheet',
        source: sourceIdx !== -1 && row[sourceIdx] ? String(row[sourceIdx]) : 'Google Sheet Data',
        verified: verified,
        note: noteIdx !== -1 ? String(row[noteIdx]) : '',
        version: 1
      });
    }

    return entries;
  } catch (error) {
    throw new Error('Google Sheet Error: ' + error.message);
  }
}

/**
 * Parse dots string e.g. "1-2-4-5" or "1,2,4,5" into number array [1,2,4,5]
 */
function parseDots(str) {
  if (!str) return [];
  var parts = String(str).split(/[\s,\-]+/);
  var dots = [];
  for (var i = 0; i < parts.length; i++) {
    var val = parseInt(parts[i], 10);
    if (!isNaN(val) && val >= 1 && val <= 8) {
      dots.push(val);
    }
  }
  return dots;
}

/**
 * Mathematical Unicode Braille codepoint calculation
 */
function dotsToUnicode(dots) {
  var mask = 0;
  for (var i = 0; i < dots.length; i++) {
    var d = dots[i];
    if (d >= 1 && d <= 8) {
      mask |= (1 << (d - 1));
    }
  }
  return String.fromCharCode(0x2800 + mask);
}
