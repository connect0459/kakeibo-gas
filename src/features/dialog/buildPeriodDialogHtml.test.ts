import { describe, expect, it } from "vitest";
import { en } from "../locale/en";
import { ja } from "../locale/ja";
import type { Locale } from "../locale/types";
import { buildPeriodDialogHtml } from "./buildPeriodDialogHtml";

describe("buildPeriodDialogHtml", () => {
  it("shows the labels and the submit button text of the locale", () => {
    const html = buildPeriodDialogHtml(ja.dialog);

    expect(html).toContain("開始日:");
    expect(html).toContain("終了日:");
    expect(html).toContain('value="集計期間を設定"');
  });

  it("wires the validation messages of the locale into the script", () => {
    const html = buildPeriodDialogHtml(en.dialog);

    expect(html).toContain(JSON.stringify(en.dialog.enterBothDates));
    expect(html).toContain(JSON.stringify(en.dialog.startAfterEnd));
  });

  it("calls the handler that applies the custom period", () => {
    const html = buildPeriodDialogHtml(en.dialog);

    expect(html).toContain(".setCustomPeriod(startDate, endDate)");
  });

  describe("when the text contains characters that are special in HTML or script", () => {
    const hostile: Locale["dialog"] = {
      ...en.dialog,
      startDateLabel: 'Start <b>"date"</b> & more',
      submit: 'Go "now"',
      enterBothDates: 'Enter </script><script>alert("x")</script>',
    };

    it("escapes the text placed in HTML", () => {
      const html = buildPeriodDialogHtml(hostile);

      expect(html).toContain("Start &lt;b&gt;&quot;date&quot;&lt;/b&gt; &amp; more");
      expect(html).toContain('value="Go &quot;now&quot;"');
    });

    it("keeps the text placed in script from closing the script element", () => {
      const html = buildPeriodDialogHtml(hostile);

      expect(html).not.toContain('alert("x")</script>');
      expect(html.match(/<\/script>/g)).toHaveLength(1);
    });
  });
});
