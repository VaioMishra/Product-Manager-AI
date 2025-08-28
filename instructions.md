# Backend Setup with Google Sheets & Apps Script

This guide will walk you through setting up a free, serverless backend for the PM Interview Coach app using Google Sheets and Google Apps Script. This will allow you to:
1.  **Log new user data** (Name, YoE, Resume Link) to a Google Sheet.
2.  **Maintain a real-time visitor counter**.

---

### Step 1: Create a New Google Sheet

1.  Go to [sheets.google.com](https://sheets.google.com).
2.  Click **"Blank"** to create a new spreadsheet.
3.  Rename the spreadsheet to something memorable, like "PM Coach App Data".
4.  Rename the default sheet (usually "Sheet1") to **"Users"**.
5.  Set up the header row. In the first row, enter the following column titles:
    *   Cell `A1`: `Timestamp`
    *   Cell `B1`: `Name`
    *   Cell `C1`: `Years of Experience`
    *   Cell `D1`: `Resume Link`

Your sheet is now ready to receive data.

---

### Step 2: Create the Google Apps Script

1.  In your new Google Sheet, click on **Extensions > Apps Script**.
2.  A new browser tab will open with the script editor.
3.  Delete any placeholder code in the `Code.gs` file.
4.  Copy and paste the entire script below into the `Code.gs` editor.

```javascript
// A global lock to prevent race conditions when updating the count or writing rows.
const lock = LockService.getScriptLock();

/**
 * Handles POST requests to log new user data.
 */
function doPost(e) {
  // Lock to ensure sequential writes to the sheet
  lock.waitLock(30000); // Wait up to 30 seconds for lock
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    const data = JSON.parse(e.postData.contents);
    
    // Add a timestamp for when the user signed up
    const timestamp = new Date();
    
    // Append the new user data to the sheet
    sheet.appendRow([timestamp, data.name, data.yoe, data.resumeLink || '']);
    
    // Return a success response
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "User logged" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Return an error response
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    // ALWAYS release the lock to prevent deadlocks
    lock.releaseLock();
  }
}

/**
 * Handles GET requests to retrieve and increment the visitor count.
 */
function doGet(e) {
  // Use PropertiesService to store and retrieve the visitor count persistently.
  const properties = PropertiesService.getScriptProperties();
  
  // Lock to prevent race conditions during read-modify-write of the counter
  lock.waitLock(30000);
  
  let count = 0;
  try {
    let currentCount = properties.getProperty('visitorCount');
    
    if (currentCount === null) {
      // Initialize if it doesn't exist
      currentCount = '0';
    }
    
    // Increment the count for this visit
    let numericCount = parseInt(currentCount, 10);
    numericCount++;
    count = numericCount;
    
    // Save the new count back to script properties
    properties.setProperty('visitorCount', numericCount.toString());
  
  } catch (error) {
    // If something goes wrong, we don't want to break the app. We can just return the last known count.
    const lastCount = properties.getProperty('visitorCount');
    count = lastCount ? parseInt(lastCount, 10) : 0;
  } finally {
    lock.releaseLock();
  }
  
  // Return the count as JSON. This handles CORS automatically for simple GET requests.
  return ContentService.createTextOutput(JSON.stringify({ "visitorCount": count }))
    .setMimeType(ContentService.MimeType.JSON);
}

```

5.  Save the script project by clicking the floppy disk icon or pressing `Ctrl + S`. Give it a name like "PM Coach Backend".

---

### Step 3: Deploy the Script as a Web App

1.  In the Apps Script editor, click the blue **"Deploy"** button in the top right.
2.  Select **"New deployment"**.
3.  Click the gear icon next to "Select type" and choose **"Web app"**.
4.  In the "New deployment" configuration screen, fill in the details:
    *   **Description**: `PM Interview Coach Backend v1` (or similar).
    *   **Execute as**: `Me (your@email.com)`.
    *   **Who has access**: **Anyone**. This is crucial for the web app to be able to call the script.
5.  Click **"Deploy"**.
6.  **Authorize access**: Google will ask you to authorize the script's permissions.
    *   Click **"Authorize access"**.
    *   Choose your Google account.
    *   You might see a "Google hasn't verified this app" screen. This is normal. Click **"Advanced"**, and then click **"Go to [Your Script Name] (unsafe)"**.
    *   Review the permissions and click **"Allow"**.
7.  After authorizing, you will see a "Deployment successfully created" dialog with a **Web app URL**.
8.  **Copy this URL**. This is your `GOOGLE_SCRIPT_URL`.

---

### Step 4: Configure the Frontend Application

1.  Take the **Web app URL** you copied.
2.  Set it as an environment variable for your frontend application. The variable must be named `GOOGLE_SCRIPT_URL`.

Your application is now fully configured to communicate with your Google Sheet backend! New user sign-ups will appear in the "Users" sheet, and the visitor counter will update with every visit.
