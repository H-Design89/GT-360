/**
 * GT-360 | Google Apps Script Backend (API)
 * Nơi xử lý kết nối giữa Frontend và Google Sheets
 */

// LƯU Ý QUAN TRỌNG: BẠN PHẢI THAY ĐOẠN TEXT BÊN DƯỚI BẰNG ID GOOGLE SHEET CỦA BẠN
// Lấy ID từ URL: https://docs.google.com/spreadsheets/d/[MÃ_ID_CỦA_BẠN_Ở_ĐÂY]/edit
const SPREADSHEET_ID = '1mAYpxxZC9Nj2l1V27-PAdQY3PWeCrHmM8vKEISSPRgc'; 

/**
 * Hàm setupSheets: Chạy hàm này 1 lần duy nhất từ Editor để tạo các Sheet cơ bản
 */
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const requiredSheets = ['CRM', 'Production', 'Tasks', 'Inventory', 'Order_Tasks'];
  
  requiredSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
}

/**
 * Hàm GET để xử lý các request tải dữ liệu từ Frontend
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let data = {};
    
    switch (action) {
      case 'getCustomers':
        data = getSheetData('CRM');
        break;
      case 'getOrders':
        const orders = getSheetData('Production');
        const tasks = getSheetData('Order_Tasks');
        
        // Gắn danh sách tasks/models vào từng đơn hàng
        orders.forEach(order => {
           const orderId = order['Số lệnh sản xuất'] || order['ID'];
           order.tasks = tasks.filter(t => t['Mã LSX'] === orderId);
        });
        data = orders;
        break;
      case 'getTasks':
        data = getSheetData('Tasks');
        break;
      case 'getInventory':
        data = getSheetData('Inventory');
        break;
      default:
        return responseJSON({ status: 'error', message: 'Invalid action' });
    }
    
    return responseJSON({ status: 'success', data: data });
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

/**
 * Hàm POST để xử lý việc thêm/sửa/xóa dữ liệu từ Frontend
 */
function doPost(e) {
  try {
    // Chuyển đổi dữ liệu POST thành object JSON
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload;
    
    let result = {};
    
    switch (action) {
      case 'addCustomer':
        result = addRowToSheet('CRM', payload);
        break;
      case 'addOrder':
        result = addRowToSheet('Production', payload);
        if (result.success && payload.tasks) {
           saveTasksToSheet(payload['Số lệnh sản xuất'], payload.tasks);
        }
        break;
      case 'editOrder':
        result = editRowInSheet('Production', payload, 'Số lệnh sản xuất');
        if (result.success && payload.tasks) {
           saveTasksToSheet(payload['Số lệnh sản xuất'], payload.tasks);
        }
        break;
      case 'deleteOrder':
        result = deleteRowInSheet('Production', payload['Số lệnh sản xuất'], 'Số lệnh sản xuất');
        if (result.success) {
           deleteTasksInSheet(payload['Số lệnh sản xuất']);
        }
        break;
      default:
        return responseJSON({ status: 'error', message: 'Invalid POST action' });
    }
    
    return responseJSON({ status: 'success', result: result });
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  }
}

/**
 * Hàm phụ trợ: Đọc dữ liệu từ 1 Sheet, trả về mảng Object
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Không có dữ liệu (chỉ có header)
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Hàm phụ trợ: Thêm 1 dòng mới vào Sheet
 */
function addRowToSheet(sheetName, objData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // Nếu sheet chưa tồn tại, tạo mới
    sheet = ss.insertSheet(sheetName);
  }
  
  // Nếu sheet trống trơn (chưa có header), tự động tạo header từ object
  if (sheet.getLastColumn() === 0) {
    const newHeaders = Object.keys(objData);
    sheet.appendRow(newHeaders);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Check for duplicate ID (assuming ID is usually 'Số lệnh sản xuất' or 'ID')
  let keyColumn = 'Số lệnh sản xuất';
  if (headers.indexOf(keyColumn) === -1) keyColumn = 'ID';
  
  if (headers.indexOf(keyColumn) !== -1) {
    const keyIndex = headers.indexOf(keyColumn);
    const targetKeyValue = objData[keyColumn];
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] === targetKeyValue) {
        return { success: false, message: 'Mã đơn hàng/Mã khách hàng đã tồn tại!' };
      }
    }
  }
  
  const newRow = headers.map(header => {
    return objData[header] !== undefined ? objData[header] : "";
  });
  
  sheet.appendRow(newRow);
  return { success: true, rowAdded: true, data: newRow };
}

/**
 * Hàm phụ trợ: Sửa 1 dòng trong Sheet dựa trên khóa
 */
function editRowInSheet(sheetName, objData, keyColumn) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: 'No data to edit' };
  
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) return { success: false, message: 'Key column not found' };
  
  const targetKeyValue = objData[keyColumn];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex] === targetKeyValue) {
      const rowIndex = i + 1;
      
      const updatedRow = headers.map((header, colIndex) => {
        return objData[header] !== undefined ? objData[header] : data[i][colIndex];
      });
      
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
      return { success: true, rowUpdated: rowIndex, data: updatedRow };
    }
  }
  
  return { success: false, message: 'Record not found' };
}

/**
 * Hàm phụ trợ: Xóa 1 dòng trong Sheet dựa trên khóa
 */
function deleteRowInSheet(sheetName, targetKeyValue, keyColumn) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: 'No data to delete' };
  
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) return { success: false, message: 'Key column not found' };
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex] === targetKeyValue) {
      const rowIndex = i + 1;
      sheet.deleteRow(rowIndex);
      return { success: true, rowDeleted: rowIndex };
    }
  }
  
  return { success: false, message: 'Record not found' };
}

/**
 * Hàm phụ trợ: Trả về JSON cho Client
 */
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm phụ trợ: Lưu danh sách công việc của 1 Lệnh Sản Xuất
 */
function saveTasksToSheet(orderId, tasks) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Order_Tasks');
  if (!sheet) {
    sheet = ss.insertSheet('Order_Tasks');
  }

  // Xóa các task cũ của LSX này trước khi lưu mới (để xử lý cả thêm mới và sửa)
  deleteTasksInSheet(orderId);

  if (!tasks || tasks.length === 0) return;

  // Tạo header nếu chưa có
  if (sheet.getLastColumn() === 0) {
    const defaultHeaders = ['Mã LSX', 'Model', 'Số lượng', 'Bản vẽ', 'Tên công việc', 'Ngày bắt đầu', 'Ngày kết thúc', 'Ngày hoàn thành thực tế', 'Phụ trách', 'Ghi chú', 'Tiến độ'];
    sheet.appendRow(defaultHeaders);
  }

  let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Tự động bổ sung cột nếu thiếu
  if (headers.indexOf('Ngày hoàn thành thực tế') === -1) {
    sheet.getRange(1, headers.length + 1).setValue('Ngày hoàn thành thực tế');
    headers.push('Ngày hoàn thành thực tế');
  }
  
  if (headers.indexOf('Bản vẽ') === -1) {
    sheet.getRange(1, headers.length + 1).setValue('Bản vẽ');
    headers.push('Bản vẽ');
  }

  const rowsToInsert = [];

  tasks.forEach(taskObj => {
    // Đảm bảo gắn Mã LSX vào
    taskObj['Mã LSX'] = orderId;
    
    const newRow = headers.map(header => {
      return taskObj[header] !== undefined ? taskObj[header] : "";
    });
    rowsToInsert.push(newRow);
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, headers.length).setValues(rowsToInsert);
  }
}

/**
 * Hàm phụ trợ: Xóa toàn bộ công việc của 1 Lệnh Sản Xuất
 */
function deleteTasksInSheet(orderId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Order_Tasks');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0];
  const keyIndex = headers.indexOf('Mã LSX');
  if (keyIndex === -1) return;

  // Xóa từ dưới lên để không làm hỏng index
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][keyIndex] === orderId) {
      sheet.deleteRow(i + 1);
    }
  }
}
