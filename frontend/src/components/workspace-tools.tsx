"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Badge, Empty, Modal, PageHeading } from "./ui";
import { dateLabel } from "@/lib/ledger";
import {
  buildCourtAlerts,
  calendarDateKey,
  filterCourtAlerts,
  milestoneStatus,
  type AlertCategory,
  type AlertStatus,
  type CourtAlert,
} from "@/lib/court";
import type {
  CaseRecord,
  DocumentRecord,
  Hearing,
  LedgerRow,
  Milestone,
  Order,
  Payment,
  Proceeding,
} from "@/lib/types";
export type { Milestone } from "@/lib/types";

const stages = [
  "Filing",
  "Summons",
  "Written Statement",
  "Interim Relief",
  "Evidence",
  "Final Arguments",
];

export function CaseMilestones({
  caseRecord,
  proceedings,
  orders,
  hearings,
  asOf,
  synthetic,
  notes,
  onNotesChange,
}: {
  caseRecord: CaseRecord;
  proceedings: Proceeding[];
  orders: Order[];
  hearings: Hearing[];
  asOf: string;
  synthetic: Milestone[];
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const [noteState, setNoteState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [notesOpen, setNotesOpen] = useState(false);
  const milestones = useMemo(() => {
    const recorded: Record<string, Milestone> = {};
    for (const milestone of synthetic) recorded[milestone.title] = milestone;
    const filedAt = proceedings.find((p) => p.filedAt)?.filedAt;
    if (filedAt) recorded.Filing = { title: "Filing", date: filedAt };
    const summons = hearings.find((hearing) => hearing.type === "summons");
    if (summons)
      recorded.Summons = {
        title: "Summons",
        date: summons.date,
        detail: summons.title,
      };
    const writtenStatement = hearings.find((hearing) =>
      /written statement/i.test(hearing.title),
    );
    if (writtenStatement)
      recorded["Written Statement"] = {
        title: "Written Statement",
        date: writtenStatement.date,
        detail: writtenStatement.title,
      };
    const interimOrder = orders.find((order) =>
      /interim/i.test(order.orderType || ""),
    );
    if (interimOrder)
      recorded["Interim Relief"] = {
        title: "Interim Relief",
        date: interimOrder.orderDate,
        detail: interimOrder.orderType,
      };
    for (const stage of ["Evidence", "Final Arguments"]) {
      const hearing = hearings.find((item) =>
        (stage === "Evidence" ? /evidence/i : /final arguments/i).test(
          item.title,
        ),
      );
      if (hearing)
        recorded[stage] = {
          title: stage,
          date: hearing.date,
          detail: hearing.title,
        };
    }
    return stages.map(
      (title) => recorded[title] || { title, detail: "No date recorded" },
    );
  }, [hearings, orders, proceedings, synthetic]);
  useEffect(() => {
    if (noteState !== "saving") return;
    const timeout = window.setTimeout(() => setNoteState("saved"), 500);
    return () => window.clearTimeout(timeout);
  }, [notes, noteState]);

  return (
    <section className="case-section milestone-section">
      <p className="eyebrow">HEARING DIARY & MILESTONES</p>
      {synthetic.length > 0 && (
        <p className="small muted milestone-disclosure">
          Illustrative demo milestones · verify dates against court records.
        </p>
      )}
      <ol className="milestone-list">
        {milestones.map((milestone) => {
          const status = milestoneStatus(milestone.date, asOf);
          return (
            <li
              className={`milestone-item milestone-${status.toLowerCase().replace(" ", "-")}`}
              key={milestone.title}
            >
              <span className="milestone-marker" aria-hidden="true">
                {status === "Completed" ? <Check size={12} /> : null}
              </span>
              <div className="milestone-content">
                <div className="milestone-title">
                  <strong>{milestone.title}</strong>
                  <Badge
                    tone={
                      status === "Upcoming"
                        ? "amber"
                        : status === "Not scheduled"
                          ? "neutral"
                          : ""
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <small>
                  {milestone.date
                    ? dateLabel(milestone.date)
                    : "Date not recorded"}
                  {milestone.detail ? ` · ${milestone.detail}` : ""}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="case-notes">
        <div className="notes-heading">
          <span>Private case notes</span>
          <span className={`notes-state notes-${noteState}`} aria-live="polite">
            {noteState === "saving"
              ? "Saving…"
              : noteState === "error"
                ? "Could not save"
                : "Saved in this session"}
          </span>
        </div>
        {notes && <p className="case-note-preview">{notes}</p>}
        <button
          className="button secondary compact"
          onClick={() => setNotesOpen(true)}
        >
          {notes ? "Edit notes" : "Add a private note"}
        </button>
        <small>
          Notes stay in this browser session only and are cleared on refresh;
          they are not sent to the case service.
        </small>
      </div>
      {notesOpen && (
        <Modal
          title="Private case notes"
          description="Your changes autosave to this open workspace session."
          onClose={() => setNotesOpen(false)}
        >
          <label
            className="notes-modal-label"
            htmlFor={`case-notes-${caseRecord.id}`}
          >
            Notes for {caseRecord.title}
          </label>
          <textarea
            className="notes-modal-textarea"
            id={`case-notes-${caseRecord.id}`}
            value={notes}
            maxLength={5000}
            rows={7}
            placeholder="Add a personal note for this case…"
            onChange={(event) => {
              try {
                setNoteState("saving");
                onNotesChange(event.target.value);
              } catch {
                setNoteState("error");
              }
            }}
          />
          <div className="notes-modal-footer">
            <span
              className={`notes-state notes-${noteState}`}
              aria-live="polite"
            >
              {noteState === "saving"
                ? "Saving…"
                : noteState === "error"
                  ? "Could not save"
                  : "Saved in this session"}
            </span>
            <button
              className="button primary"
              onClick={() => setNotesOpen(false)}
            >
              Done
            </button>
          </div>
          <p className="viewer-note">
            Notes remain in memory only. They are not sent to the case service
            and clear on refresh or session reset.
          </p>
        </Modal>
      )}
    </section>
  );
}

type CauseEvent = Hearing & { caseTitle: string };
type CalendarMode = "Month" | "Week" | "Agenda";
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const utcDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`);
const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const weekStart = (value: Date) =>
  addDays(value, -((value.getUTCDay() + 6) % 7));
const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
const shortDay = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

export function CauseListCalendar({
  hearings,
  cases,
  asOf,
  synthetic,
}: {
  hearings: Hearing[];
  cases: CaseRecord[];
  asOf: string;
  synthetic: boolean;
}) {
  const [mode, setMode] = useState<CalendarMode>("Month");
  const [selectedDate, setSelectedDate] = useState(asOf);
  const [selectedEvent, setSelectedEvent] = useState<CauseEvent | null>(null);
  const events = useMemo(
    () =>
      hearings
        .map((hearing) => ({
          ...hearing,
          caseTitle:
            cases.find((caseRecord) => caseRecord.id === hearing.caseId)
              ?.title || `Case #${hearing.caseId}`,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [cases, hearings],
  );
  const pivot = utcDate(selectedDate);
  const monthStart = new Date(
    Date.UTC(pivot.getUTCFullYear(), pivot.getUTCMonth(), 1, 12),
  );
  const gridStart = weekStart(monthStart);
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart(pivot), index),
  );
  const periodEvents =
    mode === "Month"
      ? events.filter(
          (event) =>
            utcDate(calendarDateKey(event.date)).getUTCMonth() ===
              pivot.getUTCMonth() &&
            utcDate(calendarDateKey(event.date)).getUTCFullYear() ===
              pivot.getUTCFullYear(),
        )
      : mode === "Week"
        ? events.filter((event) =>
            weekDays.some((day) => toIso(day) === calendarDateKey(event.date)),
          )
        : events.filter((event) => event.date >= selectedDate);
  function movePeriod(direction: number) {
    const next = new Date(pivot);
    if (mode === "Month") next.setUTCMonth(next.getUTCMonth() + direction);
    else
      next.setUTCDate(
        next.getUTCDate() + direction * (mode === "Week" ? 7 : 30),
      );
    setSelectedDate(toIso(next));
    setSelectedEvent(null);
  }
  const eventsForDate = (date: Date) =>
    events.filter((event) => calendarDateKey(event.date) === toIso(date));

  return (
    <>
      <PageHeading
        eyebrow="HEARING DIARY"
        title="Cause list calendar"
        description="Review hearing and summons-return dates recorded for your selected cases."
      />
      {synthetic && (
        <p className="callout calendar-disclosure">
          Demo dates are synthetic examples. Always verify cause-list details
          with the court before relying on them.
        </p>
      )}
      {!synthetic && hearings.length === 0 && (
        <p className="callout calendar-disclosure">
          Hearing and summons dates are not available from the connected case
          service yet.
        </p>
      )}
      <section
        className="panel calendar-panel"
        aria-label="Cause list calendar"
      >
        <div className="calendar-toolbar">
          <div className="calendar-period-controls">
            <button
              className="icon-button"
              aria-label="Previous period"
              onClick={() => movePeriod(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="button secondary compact"
              onClick={() => {
                setSelectedDate(asOf);
                setSelectedEvent(null);
              }}
            >
              Today
            </button>
            <button
              className="icon-button"
              aria-label="Next period"
              onClick={() => movePeriod(1)}
            >
              <ChevronRight size={18} />
            </button>
            <h2>
              {mode === "Week"
                ? `${shortDay(weekDays[0])} – ${shortDay(weekDays[6])}, ${monthLabel(pivot)}`
                : monthLabel(pivot)}
            </h2>
          </div>
          <div
            className="calendar-modes"
            role="group"
            aria-label="Calendar view"
          >
            {(["Month", "Week", "Agenda"] as const).map((view) => (
              <button
                key={view}
                className={mode === view ? "selected" : ""}
                aria-pressed={mode === view}
                onClick={() => {
                  setMode(view);
                  setSelectedEvent(null);
                }}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        {mode === "Month" && (
          <div className="calendar-grid calendar-month">
            {weekdays.map((day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            ))}
            {days.map((day) => {
              const iso = toIso(day);
              const dayEvents = eventsForDate(day);
              return (
                <div
                  className={`calendar-day ${day.getUTCMonth() !== pivot.getUTCMonth() ? "outside-month" : ""} ${iso === selectedDate ? "is-selected" : ""}`}
                  key={iso}
                >
                  <button
                    className="calendar-day-number"
                    aria-label={`Select ${shortDay(day)}`}
                    aria-pressed={iso === selectedDate}
                    onClick={() => {
                      setSelectedDate(iso);
                      setSelectedEvent(null);
                    }}
                  >
                    {day.getUTCDate()}
                  </button>
                  {dayEvents.slice(0, 2).map((event) => (
                    <button
                      className={`calendar-event-chip ${event.type === "summons" ? "summons-chip" : ""}`}
                      key={event.id}
                      aria-label={`${event.type === "summons" ? "Summons return" : event.title}, ${dateLabel(event.date)}`}
                      onClick={() => {
                        setSelectedDate(iso);
                        setSelectedEvent(event);
                      }}
                    >
                      {event.type === "summons" ? "Summons" : event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="calendar-more">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {mode === "Week" && (
          <div className="calendar-week-view">
            {weekDays.map((day) => (
              <section className="calendar-week-day" key={toIso(day)}>
                <button
                  className="calendar-week-date"
                  onClick={() => setSelectedDate(toIso(day))}
                >
                  <span>{weekdays[(day.getUTCDay() + 6) % 7]}</span>
                  {day.getUTCDate()}
                </button>
                {eventsForDate(day).map((event) => (
                  <button
                    className="calendar-event-card"
                    key={event.id}
                    onClick={() => {
                      setSelectedDate(calendarDateKey(event.date));
                      setSelectedEvent(event);
                    }}
                  >
                    <strong>
                      {event.type === "summons"
                        ? "Summons return"
                        : event.title}
                    </strong>
                    <small>{event.location}</small>
                  </button>
                ))}
                {!eventsForDate(day).length && (
                  <span className="calendar-no-events">No events</span>
                )}
              </section>
            ))}
          </div>
        )}
        {mode === "Agenda" && (
          <div className="calendar-agenda">
            {periodEvents.length ? (
              periodEvents.map((event) => (
                <button
                  className="agenda-event"
                  key={event.id}
                  onClick={() => {
                    setSelectedDate(calendarDateKey(event.date));
                    setSelectedEvent(event);
                  }}
                >
                  <span className="agenda-date">
                    <strong>{utcDate(event.date).getUTCDate()}</strong>
                    <small>
                      {utcDate(event.date).toLocaleDateString("en-IN", {
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </small>
                  </span>
                  <span className="agenda-description">
                    <strong>
                      {event.type === "summons"
                        ? "Summons return"
                        : event.title}
                    </strong>
                    <small>
                      {event.caseTitle} · {event.location}
                    </small>
                  </span>
                  <Badge tone={event.type === "summons" ? "amber" : ""}>
                    {event.type === "summons" ? "Summons" : "Hearing"}
                  </Badge>
                </button>
              ))
            ) : (
              <Empty title="No upcoming events in this period">
                Use “Add event” from a case record to add a demo hearing.
              </Empty>
            )}
          </div>
        )}
        <div className="calendar-detail">
          {selectedEvent ? (
            <>
              <div className="calendar-detail-icon">
                <CalendarDays size={19} />
              </div>
              <div className="calendar-detail-content">
                <p className="eyebrow">SELECTED EVENT</p>
                <h3>
                  {selectedEvent.type === "summons"
                    ? "Summons return"
                    : selectedEvent.title}
                </h3>
                <p>
                  {selectedEvent.caseTitle} · {dateLabel(selectedEvent.date)}
                </p>
                <small>{selectedEvent.location}</small>
              </div>
              <Badge>
                {selectedEvent.type === "summons" ? "Summons" : "Hearing"}
              </Badge>
            </>
          ) : (
            <>
              <div className="calendar-detail-icon">
                <Clock3 size={19} />
              </div>
              <div className="calendar-detail-content">
                <p className="eyebrow">EVENT DETAILS</p>
                <h3>{dateLabel(selectedDate)}</h3>
                <p>
                  {
                    events.filter(
                      (event) => calendarDateKey(event.date) === selectedDate,
                    ).length
                  }{" "}
                  event(s) recorded
                </p>
                <small>
                  Select an event on the calendar to view its details.
                </small>
              </div>
            </>
          )}
        </div>
      </section>
      <div className="calendar-footnote">
        <span>
          <span className="calendar-legend-dot hearing-legend" /> Hearing
        </span>
        <span>
          <span className="calendar-legend-dot summons-legend" /> Summons return
        </span>
        <span className="muted">Dates shown in your case records only.</span>
      </div>
    </>
  );
}

export function CourtAlerts({
  orders,
  payments,
  ledger,
  asOf,
  synthetic,
}: {
  orders: Order[];
  payments: Payment[];
  ledger: LedgerRow[];
  asOf: string;
  synthetic: boolean;
}) {
  const [categories, setCategories] = useState<AlertCategory[]>([
    "Court order",
    "Maintenance",
    "Payment",
  ]);
  const [status, setStatus] = useState<AlertStatus>("All");
  const alerts: CourtAlert[] = buildCourtAlerts(orders, payments, ledger);
  const visible = filterCourtAlerts(alerts, categories, status, asOf);
  return (
    <>
      <PageHeading
        eyebrow="COURT & MAINTENANCE"
        title="Orders and payment alerts"
        description="A single view of recorded orders, maintenance due dates, and payment updates."
      />
      {synthetic && (
        <p className="callout alert-disclosure">
          Synthetic demo alerts are based on the sample case record and
          maintenance schedule.
        </p>
      )}
      <section className="panel alert-panel">
        <div className="alert-controls">
          <fieldset className="alert-categories">
            <legend>Categories</legend>
            {(["Court order", "Maintenance", "Payment"] as const).map(
              (category) => (
                <label className="alert-toggle" key={category}>
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() =>
                      setCategories((previous) =>
                        previous.includes(category)
                          ? previous.filter((item) => item !== category)
                          : [...previous, category],
                      )
                    }
                  />
                  <span>{category}</span>
                </label>
              ),
            )}
          </fieldset>
          <div className="alert-status-filter">
            <label htmlFor="alert-status">Status</label>
            <select
              id="alert-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as AlertStatus)}
            >
              <option>All</option>
              <option>Attention</option>
              <option>Upcoming</option>
              <option>Recorded</option>
            </select>
          </div>
        </div>
        <div className="alert-count">
          {visible.length} alert{visible.length === 1 ? "" : "s"}
        </div>
        {visible.length ? (
          <div className="alert-list">
            {visible.map((alert) => (
              <article className="alert-row" key={alert.id}>
                <span
                  className={`alert-icon ${alert.attention ? "needs-attention" : ""}`}
                >
                  {alert.attention ? (
                    <AlertCircle size={18} />
                  ) : alert.category === "Court order" ? (
                    <FileText size={18} />
                  ) : (
                    <CalendarDays size={18} />
                  )}
                </span>
                <div className="alert-copy">
                  <div className="alert-title-line">
                    <h3>{alert.title}</h3>
                    <Badge
                      tone={
                        alert.attention
                          ? "amber"
                          : alert.category === "Payment"
                            ? ""
                            : "neutral"
                      }
                    >
                      {alert.status}
                    </Badge>
                  </div>
                  <p>{alert.description}</p>
                  <small>
                    {alert.date ? dateLabel(alert.date) : "Date not recorded"} ·{" "}
                    {alert.category}
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No alerts match these filters">
            Try enabling another category or selecting a different status.
          </Empty>
        )}
      </section>
      {!synthetic && orders.length === 0 && payments.length === 0 && (
        <p className="callout alert-disclosure">
          No order or payment records are available from the connected service
          for this view. Maintenance schedules and reminders require backend
          support and are not generated here.
        </p>
      )}
    </>
  );
}

function exhibitLabel(index: number) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return `Exhibit ${label}`;
}

export function EvidenceViewer({
  documents,
  demo,
}: {
  documents: DocumentRecord[];
  demo: boolean;
}) {
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [highlight, setHighlight] = useState(false);
  useEffect(() => {
    if (!selected?.file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selected.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);
  const isImage = Boolean(selected?.file?.type.startsWith("image/"));
  const isPdf = selected?.file?.type === "application/pdf";
  function openDocument(document: DocumentRecord) {
    setSelected(document);
    setZoom(1);
    setRotation(0);
    setHighlight(false);
  }
  function downloadDocument(document: DocumentRecord) {
    if (document.file) {
      const url = URL.createObjectURL(document.file);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = document.originalName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      window.location.assign(`/api/backend/documents/${document.id}/download`);
    }
  }
  return (
    <>
      <div className="evidence-list">
        {documents.map((document, index) => (
          <div className="document-row evidence-row" key={document.id}>
            <span className="file-icon">
              {document.file?.type.startsWith("image/") ? (
                <ImageIcon size={23} />
              ) : (
                <FileText size={23} />
              )}
            </span>
            <div>
              <strong>{document.originalName}</strong>
              <small>
                {document.documentType} · {Math.ceil(document.fileSize / 1024)}{" "}
                KB · {dateLabel(document.createdAt)}
              </small>
              <span className="exhibit-tags">
                <span>{exhibitLabel(index)}</span>
                <span>{document.documentType}</span>
              </span>
            </div>
            <button
              className="button secondary compact"
              onClick={() => openDocument(document)}
            >
              Open viewer
            </button>
            <button
              className="icon-button"
              disabled={demo && !document.file}
              aria-label={`Download ${document.originalName}`}
              title={
                demo && !document.file
                  ? "Illustrative record; no file attached"
                  : "Download document"
              }
              onClick={() => downloadDocument(document)}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <Modal
          title={selected.originalName}
          description={`${exhibitLabel(documents.findIndex((document) => document.id === selected.id))} · ${selected.documentType} · Preview only`}
          onClose={() => setSelected(null)}
        >
          <div
            className="viewer-toolbar"
            role="group"
            aria-label="Image viewer controls"
          >
            <button
              className="button secondary compact"
              disabled={!isImage}
              onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            >
              <ZoomOut size={15} /> Zoom out
            </button>
            <span className="viewer-zoom" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="button secondary compact"
              disabled={!isImage}
              onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
            >
              <ZoomIn size={15} /> Zoom in
            </button>
            <button
              className="button secondary compact"
              disabled={!isImage}
              onClick={() => setRotation((value) => (value - 90) % 360)}
            >
              <RotateCcw size={15} /> Rotate left
            </button>
            <button
              className="button secondary compact"
              disabled={!isImage}
              onClick={() => setRotation((value) => (value + 90) % 360)}
            >
              <RotateCw size={15} /> Rotate right
            </button>
          </div>
          {isImage && (
            <div className="viewer-redaction-control">
              <label>
                <input
                  type="checkbox"
                  checked={highlight}
                  onChange={(event) => setHighlight(event.target.checked)}
                />{" "}
                Show visual review highlight
              </label>
              <small>
                This overlay is only a viewing aid; it does not hide, alter, or
                permanently redact the original file.
              </small>
            </div>
          )}
          <div className="evidence-preview">
            {isImage && previewUrl ? (
              <div className="image-preview-stage">
                <img
                  src={previewUrl}
                  alt={`Preview of ${selected.originalName}`}
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
                {highlight && (
                  <div
                    className="visual-highlight"
                    aria-label="Visual review highlight only"
                  >
                    <span>Review highlight · not redacted</span>
                  </div>
                )}
              </div>
            ) : isPdf && previewUrl ? (
              <iframe
                className="pdf-preview"
                src={previewUrl}
                title={`Preview of ${selected.originalName}`}
              />
            ) : selected.file ? (
              <div className="preview-unavailable">
                <FileText size={28} />
                <p>This file type cannot be previewed in the browser.</p>
                <button
                  className="button secondary compact"
                  onClick={() => downloadDocument(selected)}
                >
                  Download original file
                </button>
              </div>
            ) : (
              <div className="preview-unavailable">
                <FileText size={28} />
                <p>No preview file is available in this session.</p>
                <small>
                  {demo
                    ? "This demo record has no attached file."
                    : "Live document listing and preview are not available from the connected service."}
                </small>
              </div>
            )}
          </div>
          <p className="viewer-note">
            Exhibit labels and viewer controls are for organisation only. This
            viewer does not verify evidence or change the original file.
          </p>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              Close viewer
            </button>
            <button
              className="button primary"
              onClick={() => downloadDocument(selected)}
            >
              Download original
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
