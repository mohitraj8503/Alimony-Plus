import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("workspace pages meet automated WCAG A/AA checks", async ({ page }) => {
  test.setTimeout(90000);
  for (const route of [
    "dashboard",
    "cases",
    "calendar",
    "orders",
    "alerts",
    "payments",
    "documents",
    "calculator",
    "data-review",
    "help",
    "settings",
    "login",
  ]) {
    await page.goto(`/${route}`);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(result.violations, route).toEqual([]);
  }
});
test("record dialog has accessible labels and no contrast violations", async ({
  page,
}) => {
  await page.goto("/payments");
  await page.getByRole("button", { name: "Log payment", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
