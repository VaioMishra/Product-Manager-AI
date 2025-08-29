# Backend Setup with Google Sheets & Apps Script

This guide will walk you through setting up a free, serverless backend for the PM Interview Coach app using Google Sheets and Google Apps Script. This will allow you to:
1.  **Log new user data** (Name, YoE, Resume Link) to a Google Sheet.
2.  **Maintain a real-time visitor counter**.
3.  **Accept resume uploads** and store them in a designated Google Drive folder.

---

### Step 1: Create a New Google Sheet & Get Folder ID

1.  Go to [sheets.google.com](https://sheets.google.com).
2.  Click **"Blank"** to create a new spreadsheet.
3.  Rename it to "PM Coach App Data".
4.  Rename the default sheet to **"Users"**.
5.  Set up the header row. In `A1` enter `Timestamp`, `B1` `Name`, `C1` `Years of Experience`, `D1` `Resume Link`.
6.  Go to [drive.google.com](https://drive.google.com).
7.  Create a new folder named `Full_PM_Interview_Resumes`. This is where all uploaded resumes will be stored.
8.  Open the folder. The URL in your browser will look like `https://drive.google.com/drive/folders/SOME_LONG_ID`. **Copy this `SOME_LONG_ID`**. This is your Folder ID.

---

### Step 2: Create the Google Apps Script

1.  In your Google Sheet, click on **Extensions > Apps Script**.
2.  Delete any placeholder code in the `Code.gs` file.
3.  Copy and paste the entire script below into the `Code.gs` editor.
4.  **IMPORTANT**: Find the line `const PARENT_FOLDER_ID = "YOUR_FOLDER_ID_HERE";` and replace `"YOUR_FOLDER_ID_HERE"` with the Folder ID you copied in Step 1.

```javascript
// A global lock to prevent race conditions.
const lock = LockService.getScriptLock();

// IMPORTANT: Replace with the ID of the "Full_PM_Interview_Resumes" folder you created.
const PARENT_FOLDER_ID = "YOUR_FOLDER_ID_HERE";

/**
 * Handles all POST requests. It routes traffic based on an 'action' property.
 */
function doPost(e) {
  let response;
  try {
    const request = JSON.parse(e.postData.contents);
    
    switch (request.action) {
      case 'logUser':
        response = logUser(request.payload);
        break;
      case 'uploadFile':
        response = uploadFile(request.payload);
        break;
      default:
        throw new Error("Invalid action specified.");
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Logs a new user to the "Users" sheet.
 */
function logUser(payload) {
  lock.waitLock(30000); // Wait up to 30 seconds
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    const timestamp = new Date();
    sheet.appendRow([timestamp, payload.name, payload.yoe, payload.resumeLink || '']);
    return { "status": "success", "message": "User logged" };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Decodes a base64 string and uploads it to a user-specific folder in Google Drive.
 */
function uploadFile(payload) {
  if (!PARENT_FOLDER_ID || PARENT_FOLDER_ID === "YOUR_FOLDER_ID_HERE") {
    throw new Error("Parent Folder ID has not been set in the script.");
  }
  
  lock.waitLock(30000); // Wait up to 30 seconds
  try {
    const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
    const sanitizedUserName = payload.userName.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Find or create a subfolder for the user
    const userFolders = parentFolder.getFoldersByName(sanitizedUserName);
    let userFolder;
    if (userFolders.hasNext()) {
      userFolder = userFolders.next();
    } else {
      userFolder = parentFolder.createFolder(sanitizedUserName);
    }
    
    // Decode the base64 data and create the file
    const decodedData = Utilities.base64Decode(payload.data, Utilities.Charset.UTF_8);
    const blob = Utilities.newBlob(decodedData, payload.mimeType, payload.fileName);
    
    // Create a unique filename with a timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const uniqueFileName = `${timestamp}_${payload.fileName}`;
    
    const file = userFolder.createFile(blob).setName(uniqueFileName);
    
    return { "status": "success", "message": "File uploaded successfully.", "fileUrl": file.getUrl() };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Handles GET requests to retrieve and increment the visitor count.
 */
function doGet(e) {
  const properties = PropertiesService.getScriptProperties();
  lock.waitLock(30000);
  
  let count = 0;
  try {
    let currentCount = properties.getProperty('visitorCount');
    
    if (currentCount === null) {
      currentCount = '0';
    }
    
    let numericCount = parseInt(currentCount, 10);
    numericCount++;
    count = numericCount;
    
    properties.setProperty('visitorCount', numericCount.toString());
  
  } catch (error) {
    const lastCount = properties.getProperty('visitorCount');
    count = lastCount ? parseInt(lastCount, 10) : 0;
  } finally {
    lock.releaseLock();
  }
  
  return ContentService.createTextOutput(JSON.stringify({ "visitorCount": count }))
    .setMimeType(ContentService.MimeType.JSON);
}

```

5.  Save the script project.

---

### Step 3: Deploy the Script as a Web App

1.  In the Apps Script editor, click the blue **"Deploy"** button.
2.  Select **"New deployment"**.
3.  Click the gear icon next to "Select type" and choose **"Web app"**.
4.  Configure the deployment:
    *   **Description**: `PM Interview Coach Backend v2`
    *   **Execute as**: `Me (your@email.com)`.
    *   **Who has access**: **Anyone**. This is crucial.
5.  Click **"Deploy"**.
6.  **Authorize access**: You will need to authorize the new permissions for Google Drive.
    *   Click **"Authorize access"**.
    *   Choose your Google account.
    *   Click **"Advanced"**, then **"Go to [Your Script Name] (unsafe)"**.
    *   Review the permissions (it will now ask for Drive access) and click **"Allow"**.
7.  After authorizing, copy the new **Web app URL**.

**Note**: If you are re-deploying, you must create a **New deployment** to make the changes live. Simply saving the script is not enough.

---

### Step 4: Configure the Frontend Application

1.  Take the new **Web app URL** you copied.
2.  Set it as the `GOOGLE_SCRIPT_URL` environment variable for your frontend application.

Your application is now fully configured to log users and upload resumes!
