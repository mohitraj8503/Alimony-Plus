import { describe, expect, it } from "vitest";
import {
  buildCourtAlerts,
  calendarDateKey,
  filterCourtAlerts,
  milestoneStatus,
} from "../src/lib/court";
import type { LedgerRow, Order, Payment } from "../src/lib/types";

const order: Order = {
  id: 5,
  proceedingId: 2,
  orderType: "Interim maintenance",
  orderDate: "2026-08-15",
  amount: 12000,
};
const payment: Payment = {
  id: 8,
  orderId: 5,
  amount: 3000,
  paymentDate: "2026-10-04",
  status: "FAILED",
};
const ledger: LedgerRow = {
  orderId: 5,
  period: "2026-10",
  dueDate: "2026-10-05",
  expected: 12000,
  received: 0,
  outstanding: 12000,
  status: "Overdue",
  credit: 0,
};

describe("hearing diary and court alerts", () => {
  it("marks milestone dates completed, upcoming, or unscheduled", () => {
    expect(milestoneStatus("2026-10-09T11:30:00Z", "2026-10-09")).toBe(
      "Completed",
    );
    expect(milestoneStatus("2026-10-10", "2026-10-09")).toBe("Upcoming");
    expect(milestoneStatus(undefined, "2026-10-09")).toBe("Not scheduled");
  });

  it("normalizes calendar timestamps to their case-date key", () => {
    expect(calendarDateKey("2026-10-16T09:30:00Z")).toBe("2026-10-16");
  });

  it("builds alerts from known orders, payments and explicit ledger rows", () => {
    expect(buildCourtAlerts([order], [payment], [ledger])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "order-5",
          category: "Court order",
          status: "Recorded",
        }),
        expect.objectContaining({
          id: "payment-8",
          category: "Payment",
          status: "FAILED",
          attention: true,
        }),
        expect.objectContaining({
          id: "maintenance-5-2026-10",
          category: "Maintenance",
          status: "Overdue",
          attention: true,
        }),
      ]),
    );
  });

  it("filters alert categories and attention without inventing records", () => {
    const alerts = buildCourtAlerts([order], [payment], [ledger]);
    expect(
      filterCourtAlerts(alerts, ["Maintenance"], "Attention", "2026-10-09"),
    ).toHaveLength(1);
    expect(
      filterCourtAlerts(alerts, ["Court order"], "Upcoming", "2026-10-09"),
    ).toEqual([]);
    expect(
      filterCourtAlerts(alerts, ["Payment"], "Recorded", "2026-10-09"),
    ).toEqual([]);
  });
});
