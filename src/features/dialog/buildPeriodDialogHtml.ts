import type { Locale } from "../locale/types";

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const toScriptString = (text: string): string =>
  JSON.stringify(text)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const buildPeriodDialogHtml = (dialog: Locale["dialog"]): string => `
    <style>
      body { padding: 10px; }
      label { display: block; margin-top: 10px; }
      input[type="date"] { width: 100%; padding: 5px; margin-top: 5px; }
      input[type="button"] { margin-top: 15px; padding: 5px 10px; }
    </style>
    <label for="startDate">${escapeHtml(dialog.startDateLabel)}</label>
    <input type="date" id="startDate" required>
    <label for="endDate">${escapeHtml(dialog.endDateLabel)}</label>
    <input type="date" id="endDate" required>
    <input type="button" value="${escapeHtml(dialog.submit)}" onclick="setPeriod()">

    <script>
      function setPeriod() {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (!startDate || !endDate) {
          alert(${toScriptString(dialog.enterBothDates)});
          return;
        }

        if (new Date(startDate) > new Date(endDate)) {
          alert(${toScriptString(dialog.startAfterEnd)});
          return;
        }

        google.script.run
          .withSuccessHandler(() => google.script.host.close())
          .setCustomPeriod(startDate, endDate);
      }
    </script>
  `;
