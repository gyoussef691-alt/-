import { getAccessToken } from '../../lib/firebase';

// Helper to make authenticated Google API requests
async function googleFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً للوصول إلى خدمات Google Workspace.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`فشل الاتصال بخدمات Google (${res.status}): ${errorBody}`);
  }

  return res.json();
}

// ==========================================
// 1. Google Drive Integration Service
// ==========================================
export const GoogleDriveService = {
  // List files in Google Drive
  async listFiles(pageSize = 15): Promise<any[]> {
    const data = await googleFetch(
      `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc`
    );
    return data.files || [];
  },

  // Save / Backup trips or receipts to Google Drive
  async saveBackupFile(fileName: string, content: object): Promise<any> {
    const token = await getAccessToken();
    if (!token) throw new Error('مطلوب تسجيل الدخول بحساب Google.');

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'نسخة احتياطية من بيانات رأس غارب موبيليتي',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(content, null, 2) +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      throw new Error('فشل رفع الملف إلى Google Drive.');
    }
    return res.json();
  },

  // Delete file with Mandatory Explicit User Confirmation Dialog
  async deleteFileWithConfirmation(fileId: string, fileName: string): Promise<boolean> {
    const confirmed = window.confirm(
      `تحذير أمني: هل أنت متأكد من رغبتك في حذف الملف "${fileName}" نهائياً من Google Drive؟ لا يمكن التراجع عن هذه العملية.`
    );
    if (!confirmed) return false;

    const token = await getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok && res.status !== 204) {
      throw new Error('فشل حذف الملف من Google Drive.');
    }
    return true;
  },
};

// ==========================================
// 2. Google Calendar Integration Service
// ==========================================
export const GoogleCalendarService = {
  // List upcoming calendar events
  async listUpcomingEvents(maxResults = 10): Promise<any[]> {
    const now = new Date().toISOString();
    const data = await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        now
      )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`
    );
    return data.items || [];
  },

  // Add Trip / Ride Booking to Google Calendar
  async addTripEvent(tripDetails: {
    title: string;
    description: string;
    location: string;
    startTime: string; // ISO or YYYY-MM-DDTHH:mm
    durationHours?: number;
  }): Promise<any> {
    const start = new Date(tripDetails.startTime);
    const end = new Date(start.getTime() + (tripDetails.durationHours || 2) * 60 * 60 * 1000);

    const event = {
      summary: tripDetails.title,
      description: tripDetails.description,
      location: tripDetails.location,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Africa/Cairo',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Africa/Cairo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    return googleFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },
};

// ==========================================
// 3. Google Sheets Integration Service
// ==========================================
export const GoogleSheetsService = {
  // Create a new Spreadsheet for Ras Gharib Mobility records
  async createMobilitySpreadsheet(title: string, headers: string[][]): Promise<any> {
    const spreadsheet = {
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'سجل الرحلات والحجوزات',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: headers.map((row) => ({
                values: row.map((val) => ({
                  userEnteredValue: { stringValue: String(val) },
                })),
              })),
            },
          ],
        },
      ],
    };

    return googleFetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify(spreadsheet),
    });
  },

  // Append rows to an existing spreadsheet
  async appendRows(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    return googleFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    );
  },
};

// ==========================================
// 4. Google Forms Integration Service
// ==========================================
export const GoogleFormsService = {
  // Create a passenger satisfaction or driver survey form
  async createFeedbackForm(title: string): Promise<any> {
    const newForm = await googleFetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title,
        },
      }),
    });

    // Add survey questions
    if (newForm?.formId) {
      await googleFetch(`https://forms.googleapis.com/v1/forms/${newForm.formId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              createItem: {
                item: {
                  title: 'ما هو تقييمك لمستوى الأمان والتزام السائق بمواعيد الرحلة؟',
                  questionItem: {
                    question: {
                      required: true,
                      choiceQuestion: {
                        type: 'RADIO',
                        options: [
                          { value: 'ممتاز جداً (5/5)' },
                          { value: 'جيد جداً (4/5)' },
                          { value: 'متوسط (3/5)' },
                          { value: 'يحتاج لتحسين (2/5)' },
                          { value: 'سيء (1/5)' },
                        ],
                      },
                    },
                  },
                },
                location: { index: 0 },
              },
            },
            {
              createItem: {
                item: {
                  title: 'أي ملاحظات أو اقتراحات لتطوير خدمات النقل في رأس غارب؟',
                  questionItem: {
                    question: {
                      textQuestion: { paragraph: true },
                    },
                  },
                },
                location: { index: 1 },
              },
            },
          ],
        }),
      });
    }

    return newForm;
  },

  // Get form responses
  async getFormResponses(formId: string): Promise<any> {
    return googleFetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`);
  },
};
