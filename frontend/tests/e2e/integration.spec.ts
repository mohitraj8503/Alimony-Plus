import { expect, test } from "@playwright/test";

test("live mode uses the backend contract without mixing in demo data", async ({
  page,
}) => {
  const cases = [
    {
      id: 77,
      title: "Connected synthetic case",
      status: "ACTIVE",
      createdAt: "2026-10-01",
    },
  ];
  await page.route("**/api/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      "/api/backend/",
      "",
    );
    const results: Record<string, unknown> = {
      "auth/login": { user: { name: "Test user" } },
      cases: { cases },
      "proceedings/case/77": {
        proceedings: [
          { id: 88, caseId: 77, courtName: "Test court", status: "ONGOING" },
        ],
      },
      "orders/proceeding/88": {
        orders: [
          {
            id: 99,
            proceedingId: 88,
            orderType: "Test order",
            amount: "12000.00",
          },
        ],
      },
      "payments/order/99": {
        payments: [
          {
            id: 111,
            orderId: 99,
            amount: "6000.00",
            paymentDate: "2026-10-04",
            status: "RECEIVED",
          },
        ],
      },
    };
    await route.fulfill({ json: results[path] || { success: true } });
  });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Good morning, Test." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Connected synthetic case/ }),
  ).toBeVisible();
  await expect(page.getByText("Meera’s maintenance case")).not.toBeVisible();
  await page.getByRole("link", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Monthly reconciliation is not available yet",
    }),
  ).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "#99" })).toContainText(
    "₹6,000",
  );
});

test("synthetic file upload is session-only and downloadable", async ({
  page,
}) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: "Add document", exact: true }).click();
  await page.getByLabel("Choose a document", { exact: true }).setInputFiles({
    name: "synthetic-proof.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nSynthetic test fixture"),
  });
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(
    page.getByText("synthetic-proof.pdf", { exact: true }),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download synthetic-proof.pdf" })
    .click();
  expect((await downloading).suggestedFilename()).toBe("synthetic-proof.pdf");
  await page.reload();
  await expect(
    page.getByText("synthetic-proof.pdf", { exact: true }),
  ).not.toBeVisible();
});

test("all mobile screens avoid page-level horizontal scrolling", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
});

test("cause list supports month, week and agenda event selection", async ({
  page,
}) => {
  await page.goto("/calendar");
  await page
    .getByRole("button", { name: /Summons return, 12 Oct 2026/ })
    .click();
  await expect(page.getByText("SELECTED EVENT")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Summons return", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page
    .getByRole("button", { name: /Summons return/ })
    .last()
    .click();
  await expect(page.locator(".calendar-detail")).toContainText(
    "Summons return",
  );
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(page.locator(".calendar-agenda")).toContainText(
    "Maintenance review hearing",
  );
});

test("court alerts filter by category and attention status", async ({
  page,
}) => {
  await page.goto("/alerts");
  await page.getByLabel("Status").selectOption("Attention");
  await expect(page.locator(".alert-list")).toContainText("Overdue");
  await expect(page.locator(".alert-list")).toContainText("Partially paid");
  await page.getByLabel("Maintenance", { exact: true }).uncheck();
  await expect(page.getByText("No alerts match these filters")).toBeVisible();
});

test("case notes autosave in workspace memory across route navigation", async ({
  page,
}) => {
  await page.goto("/cases");
  await page
    .getByRole("button", { name: "Add a private note" })
    .first()
    .click();
  const noteDialog = page.getByRole("dialog");
  const notes = noteDialog.getByLabel("Notes for Meera’s maintenance case");
  await notes.fill("Synthetic note to discuss with counsel");
  await expect(noteDialog.getByText("Saved in this session")).toBeVisible();
  await expect(
    noteDialog.getByText(/not sent to the case service/),
  ).toBeVisible();
  await noteDialog.getByRole("button", { name: "Done" }).click();
  await page.getByRole("link", { name: "Cause list", exact: true }).click();
  await page.getByRole("link", { name: "My cases", exact: false }).click();
  await page.getByRole("button", { name: "Edit notes" }).first().click();
  await expect(
    page.getByRole("dialog").getByLabel("Notes for Meera’s maintenance case"),
  ).toHaveValue("Synthetic note to discuss with counsel");
});

test("evidence image viewer zooms, rotates and labels visual-only highlights", async ({
  page,
}) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: "Add document", exact: true }).click();
  await page.getByLabel("Choose a document", { exact: true }).setInputFiles({
    name: "synthetic-exhibit.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pWQAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Save record" }).click();
  await page
    .locator(".evidence-row")
    .filter({ hasText: "synthetic-exhibit.png" })
    .getByRole("button", { name: "Open viewer" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Exhibit D");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator(".viewer-zoom")).toHaveText("125%");
  await page.getByRole("button", { name: "Rotate right" }).click();
  await page.getByLabel("Show visual review highlight").check();
  await expect(page.locator(".visual-highlight")).toContainText("not redacted");
  await expect(page.getByRole("dialog")).toContainText(
    "does not hide, alter, or permanently redact",
  );
});

test("same-origin loopback logout is accepted by the real adapter", async ({
  request,
}) => {
  const response = await request.post("/api/backend/auth/logout", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {},
  });
  expect(response.status()).toBe(200);
  const forbidden = await request.post("/api/backend/auth/logout", {
    headers: { origin: "https://unrelated.example" },
    data: {},
  });
  expect(forbidden.status()).toBe(403);
});
