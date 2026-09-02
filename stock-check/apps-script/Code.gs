/**
 * Backend ชั่วคราวสำหรับหน้าเช็คสต๊อก (stock-check/)
 * วางโค้ดนี้ใน Google Apps Script แล้ว Deploy เป็น Web App
 * ดูขั้นตอนละเอียดใน stock-check/README.md
 *
 * โครงสร้าง Sheet (สร้างอัตโนมัติถ้ายังไม่มี header):
 * A: SKU | B: ชื่อสินค้า | C: หมวด | D: ติ๊กแล้ว | E: เวลาล่าสุด
 */

const SHEET_NAME = "StockCheck";
const HEADER = ["SKU", "ชื่อสินค้า", "หมวด", "ติ๊กแล้ว", "เวลาล่าสุด"];

function getSheet_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADER);
    }
    return sheet;
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// GET: คืนสถานะติ๊กปัจจุบันของทุก SKU ให้หน้าเว็บโหลดตอนเปิด/รีเฟรช
function doGet(e) {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    const [sku, name, category, checked, time] = rows[i];
    if (!sku || sku === HEADER[0]) continue;
    const parsedTime = time instanceof Date ? time : new Date(time);
    result[sku] = {
      checked: checked === true || checked === "TRUE",
      time: time && !isNaN(parsedTime) ? parsedTime.toISOString() : "",
    };
  }
  return jsonResponse_({ ok: true, data: result });
}

// POST: อัปเดตสถานะติ๊กของ 1 SKU (สร้างแถวใหม่ถ้ายังไม่เคยมี)
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { sku, name, category, checked } = body;
  if (!sku) return jsonResponse_({ ok: false, error: "missing sku" });

  const sheet = getSheet_();
  const dataRowCount = sheet.getLastRow() - 1;
  const skuCol = dataRowCount > 0 ? sheet.getRange(2, 1, dataRowCount, 1).getValues() : [];
  let rowIndex = -1;
  for (let i = 0; i < skuCol.length; i++) {
    if (skuCol[i][0] === sku) {
      rowIndex = i + 2; // +2: offset header + 1-index
      break;
    }
  }

  const now = new Date();
  if (rowIndex === -1) {
    sheet.appendRow([sku, name || "", category || "", !!checked, now]);
  } else {
    sheet.getRange(rowIndex, 4, 1, 2).setValues([[!!checked, now]]);
    // อัปเดตชื่อ/หมวดด้วยเผื่อข้อมูลสินค้าเปลี่ยน
    sheet.getRange(rowIndex, 2, 1, 2).setValues([[name || "", category || ""]]);
  }

  return jsonResponse_({ ok: true });
}
