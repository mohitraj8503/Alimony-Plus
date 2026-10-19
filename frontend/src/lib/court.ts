import type { LedgerRow, Order, Payment } from "./types";
import { money } from "./ledger";

export type MilestoneStatus = "Completed" | "Upcoming" | "Not scheduled";
export type AlertCategory = "Court order" | "Maintenance" | "Payment";
export type AlertStatus = "All" | "Attention" | "Upcoming" | "Recorded";
export type CourtAlert = {
  id: string;
  category: AlertCategory;
  date: string;
  title: string;
  description: string;
  status: string;
  attention: boolean;
};

export function milestoneStatus(
  date: string | undefined,
  asOf: string,
): MilestoneStatus {
  if (!date) return "Not scheduled";
  return date.slice(0, 10) <= asOf ? "Completed" : "Upcoming";
}

export function calendarDateKey(value: string) {
  return value.slice(0, 10);
}

export function buildCourtAlerts(
  orders: Order[],
  payments: Payment[],
  ledger: LedgerRow[],
): CourtAlert[] {
  return [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      category: "Court order" as const,
      date: order.orderDate || "",
      title: order.orderType || "Court order recorded",
      description:
        order.description || `Order #${order.id} · ${money(order.amount)}`,
      status: "Recorded",
      attention: false,
    })),
    ...ledger.map((row) => ({
      id: `maintenance-${row.orderId}-${row.period}`,
      category: "Maintenance" as const,
      date: row.dueDate,
      title: `${new Date(`${row.period}-01T12:00:00Z`).toLocaleDateString(
        "en-IN",
        { month: "long", year: "numeric", timeZone: "UTC" },
      )} maintenance`,
      description: `Order #${row.orderId} · ${money(row.outstanding)} outstanding`,
      status: row.status,
      attention: row.status === "Overdue" || row.status === "Partially paid",
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      category: "Payment" as const,
      date: payment.paymentDate,
      title: `Payment ${payment.status.toLowerCase()}`,
      description: `Order #${payment.orderId} · ${money(payment.amount)}${
        payment.reference ? ` · Ref ${payment.reference}` : ""
      }`,
      status: payment.status === "RECEIVED" ? "Recorded" : payment.status,
      attention: payment.status === "FAILED",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export function filterCourtAlerts(
  alerts: CourtAlert[],
  categories: AlertCategory[],
  status: AlertStatus,
  asOf: string,
) {
  return alerts.filter(
    (alert) =>
      categories.includes(alert.category) &&
      (status === "All" ||
        (status === "Attention" && alert.attention) ||
        (status === "Upcoming" &&
          alert.date >= asOf &&
          alert.status !== "Recorded") ||
        (status === "Recorded" && alert.status === "Recorded")),
  );
}
