// Tournaments / Leagues page — CRUD for events, tied to a bowling center, with
// schedule/format setup and external dashboard/standings URLs. Lifted out of
// App.tsx into src/pages/. Self-contained: react + the domain types + the
// shared EmptyStateCard; all helpers live inside the component.

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  EventSetup,
  Center,
  EventScheduleUnit,
  BowlingFormat,
} from "../types";
import { EmptyStateCard } from "../components/EmptyStateCard";

type EventsPageProps = {
  events: EventSetup[];
  setEvents: Dispatch<SetStateAction<EventSetup[]>>;
  centers: Center[];
};

export function EventsPage({
  events,
  setEvents,
  centers,
}: EventsPageProps) {
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<"League" | "Tournament">(
    "League"
  );
  const [newEventFormat, setNewEventFormat] = useState<BowlingFormat>("Singles");
  const [newSeriesGameCount, setNewSeriesGameCount] = useState("3");
  const [newBowlersPerPair, setNewBowlersPerPair] = useState("10");
  const [newScheduleUnit, setNewScheduleUnit] =
    useState<EventScheduleUnit>("Weeks");
  const [newScheduleCount, setNewScheduleCount] = useState("12");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newCenterId, setNewCenterId] = useState("");
  const [newDashboardUrl, setNewDashboardUrl] = useState("");
  const [newStandingsUrl, setNewStandingsUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [eventDrafts, setEventDrafts] = useState<Record<number, EventSetup>>(
    {}
  );
  const [addingEvent, setAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);

  useEffect(() => {
    if (!addingEvent && editingEventId === null) {
      return;
    }
    function handleEscape(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setAddingEvent(false);
        setEditingEventId(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [addingEvent, editingEventId]);

  function discardEventDraft(eventId: number) {
    setEventDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[eventId];
      return updatedDrafts;
    });
  }

  function closeEventEditor(eventId: number) {
    discardEventDraft(eventId);
    setEditingEventId(null);
  }

  function getEventDraft(event: EventSetup) {
    return eventDrafts[event.id] ?? event;
  }

  function normalizeExternalUrl(url: string | undefined) {
    const trimmedUrl = (url ?? "").trim();

    if (!trimmedUrl) {
      return "";
    }

    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  }

  function isValidExternalUrl(url: string | undefined) {
    const normalizedUrl = normalizeExternalUrl(url);

    if (!normalizedUrl) {
      return true;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);
      const isWebUrl = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
      const hostLooksValid =
        parsedUrl.hostname.includes(".") || parsedUrl.hostname === "localhost";

      return isWebUrl && hostLooksValid;
    } catch {
      return false;
    }
  }

  function getExternalUrlError(url: string | undefined) {
    if (isValidExternalUrl(url)) {
      return "";
    }

    return "Enter a valid website link, such as leaguepals.com or https://www.leaguesecretary.com.";
  }

  function hasEventChanged(event: EventSetup) {
    const draft = eventDrafts[event.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(event);
  }

  function updateEventDraft(event: EventSetup, updates: Partial<EventSetup>) {
    setEventDrafts((currentDrafts) => ({
      ...currentDrafts,
      [event.id]: {
        ...getEventDraft(event),
        ...updates,
      },
    }));
  }

  function saveEvent(eventId: number) {
    const draft = eventDrafts[eventId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Event name cannot be empty.");
      return;
    }

    if (!Number.isFinite(draft.seriesGameCount) || draft.seriesGameCount < 1) {
      window.alert("Games in series/block must be at least 1.");
      return;
    }

    if (!Number.isFinite(draft.scheduleCount) || draft.scheduleCount < 1) {
      window.alert("Number of weeks/days must be at least 1.");
      return;
    }

    if (!Number.isFinite(draft.bowlersPerPair) || draft.bowlersPerPair < 1) {
      window.alert("Bowlers per pair must be at least 1.");
      return;
    }

    if (!centers.some((center) => center.id === draft.centerId)) {
      window.alert("Choose a valid bowling center.");
      return;
    }

    if (!isValidExternalUrl(draft.dashboardUrl)) {
      window.alert(getExternalUrlError(draft.dashboardUrl));
      return;
    }

    if (!isValidExternalUrl(draft.standingsUrl)) {
      window.alert(getExternalUrlError(draft.standingsUrl));
      return;
    }

    const nameAlreadyExists = events.some(
      (event) =>
        event.id !== eventId &&
        event.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("An event with that name already exists.");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === eventId
          ? {
              ...draft,
              name: trimmedName,
              seriesGameCount: Math.max(
                1,
                Math.floor(draft.seriesGameCount)
              ),
              bowlersPerPair: Math.max(1, Math.floor(draft.bowlersPerPair)),
              scheduleCount: Math.max(1, Math.floor(draft.scheduleCount)),
              startDate: draft.startDate,
              endDate: draft.endDate,
              dashboardUrl: normalizeExternalUrl(draft.dashboardUrl),
              standingsUrl: normalizeExternalUrl(draft.standingsUrl),
              notes: draft.notes.trim(),
            }
          : event
      )
    );

    setEventDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[eventId];
      return updatedDrafts;
    });
  }

  function addEvent() {
    const trimmedName = newEventName.trim();
    const seriesGameCount = Number(newSeriesGameCount);
    const bowlersPerPair = Number(newBowlersPerPair);
    const scheduleCount = Number(newScheduleCount);
    const centerId = Number(newCenterId);

    if (
      !trimmedName ||
      !Number.isFinite(seriesGameCount) ||
      seriesGameCount < 1 ||
      !Number.isFinite(bowlersPerPair) ||
      bowlersPerPair < 1 ||
      !Number.isFinite(scheduleCount) ||
      scheduleCount < 1 ||
      !Number.isFinite(centerId)
    ) {
      return;
    }

    const nameAlreadyExists = events.some(
      (event) => event.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("An event with that name already exists.");
      return;
    }

    if (!isValidExternalUrl(newDashboardUrl)) {
      window.alert(getExternalUrlError(newDashboardUrl));
      return;
    }

    if (!isValidExternalUrl(newStandingsUrl)) {
      window.alert(getExternalUrlError(newStandingsUrl));
      return;
    }

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: Date.now(),
        name: trimmedName,
        eventType: newEventType,
        format: newEventFormat,
        seriesGameCount: Math.floor(seriesGameCount),
        bowlersPerPair: Math.floor(bowlersPerPair),
        scheduleUnit: newScheduleUnit,
        scheduleCount: Math.floor(scheduleCount),
        startDate: newStartDate,
        endDate: newEndDate,
        centerId,
        dashboardUrl: normalizeExternalUrl(newDashboardUrl),
        standingsUrl: normalizeExternalUrl(newStandingsUrl),
        notes: newNotes.trim(),
      },
    ]);

    setNewEventName("");
    setNewEventType("League");
    setNewEventFormat("Singles");
    setNewSeriesGameCount("3");
    setNewBowlersPerPair("10");
    setNewScheduleUnit("Weeks");
    setNewScheduleCount("12");
    setNewStartDate("");
    setNewEndDate("");
    setNewCenterId("");
    setNewDashboardUrl("");
    setNewStandingsUrl("");
    setNewNotes("");
  }

  function deleteEvent(eventId: number) {
    const event = events.find((currentEvent) => currentEvent.id === eventId);

    if (!event) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${event.name}? This will remove it from league/tournament selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((currentEvent) => currentEvent.id !== eventId)
    );

    setEventDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[eventId];
      return updatedDrafts;
    });
  }

  function getCenterName(centerId: number) {
    return (
      centers.find((center) => center.id === centerId)?.name ?? "Unknown Center"
    );
  }

  function getScheduleLabel(event: EventSetup) {
    return `${event.scheduleCount} ${event.scheduleUnit.toLowerCase()}`;
  }

  function formatEventSummary(event: EventSetup) {
    return `${event.eventType} • ${event.format} • ${event.seriesGameCount} game${
      event.seriesGameCount === 1 ? "" : "s"
    } • ${event.bowlersPerPair} per pair • ${getScheduleLabel(event)} • ${getCenterName(event.centerId)}`;
  }

  const trimmedNewEventName = newEventName.trim();
  const newEventNameAlreadyExists =
    trimmedNewEventName !== "" &&
    events.some(
      (event) =>
        event.name.toLowerCase() === trimmedNewEventName.toLowerCase()
    );
  const newSeriesGameCountValue = Number(newSeriesGameCount);
  const newBowlersPerPairValue = Number(newBowlersPerPair);
  const newScheduleCountValue = Number(newScheduleCount);
  const eventAddValidationMessages = [
    !trimmedNewEventName ? "Enter a league or tournament name." : "",
    newEventNameAlreadyExists
      ? "A league or tournament with that name already exists."
      : "",
    !Number.isFinite(newSeriesGameCountValue) ||
    newSeriesGameCountValue < 1
      ? "Enter at least 1 game in the series/block."
      : "",
    !Number.isFinite(newBowlersPerPairValue) ||
    newBowlersPerPairValue < 1
      ? "Enter at least 1 bowler per pair."
      : "",
    !Number.isFinite(newScheduleCountValue) || newScheduleCountValue < 1
      ? `Enter at least 1 ${newScheduleUnit.toLowerCase().slice(0, -1)}.`
      : "",
    newCenterId === "" ? "Choose a bowling center." : "",
    getExternalUrlError(newDashboardUrl),
    getExternalUrlError(newStandingsUrl),
  ].filter(Boolean);
  const canAddEvent = eventAddValidationMessages.length === 0;

  return (
    <>
      <div className="page-head">
        <div className="page-head-text">
          <h2>Tournaments / Leagues</h2>
          <p>Create leagues and tournaments.</p>
        </div>
        <button
          type="button"
          className="secondary-button add-entity-trigger"
          onClick={() => setAddingEvent(true)}
        >
          + Add League / Tournament
        </button>
      </div>

      {addingEvent && (
        <div className="ps-modal" role="dialog" aria-modal="true">
          <div
            className="ps-modal-backdrop"
            onClick={() => setAddingEvent(false)}
          />
          <div className="ps-modal-panel">
            <button
              type="button"
              className="ps-modal-close"
              onClick={() => setAddingEvent(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="ps-modal-title">Add League / Tournament</h3>

            <div className="add-form-content">
          <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newEventName}
              aria-invalid={
                !trimmedNewEventName || newEventNameAlreadyExists
              }
              aria-describedby={
                !canAddEvent ? "add-event-validation" : undefined
              }
              onChange={(event) => setNewEventName(event.target.value)}
              placeholder="Example: Tuesday Night League"
            />
          </label>

          <label>
            Type
            <select
              value={newEventType}
              onChange={(event) => {
                const nextType = event.target.value as "League" | "Tournament";
                setNewEventType(nextType);
                setNewScheduleUnit(nextType === "League" ? "Weeks" : "Days");
                setNewScheduleCount(nextType === "League" ? "12" : "1");
              }}
            >
              <option>League</option>
              <option>Tournament</option>
            </select>
          </label>

          <label>
            Format
            <select
              value={newEventFormat}
              onChange={(event) =>
                setNewEventFormat(event.target.value as BowlingFormat)
              }
            >
              <option>Singles</option>
              <option>Doubles</option>
              <option>Trios</option>
              <option>Fours</option>
              <option>Fives</option>
              <option>Baker</option>
            </select>
          </label>

          <label>
            Games in Series/Block <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newSeriesGameCount}
              aria-invalid={
                !Number.isFinite(newSeriesGameCountValue) ||
                newSeriesGameCountValue < 1
              }
              aria-describedby={
                !canAddEvent ? "add-event-validation" : undefined
              }
              onChange={(event) => setNewSeriesGameCount(event.target.value)}
              placeholder="Example: 3"
            />
          </label>

          <label>
            Bowlers Per Pair <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newBowlersPerPair}
              aria-invalid={
                !Number.isFinite(newBowlersPerPairValue) ||
                newBowlersPerPairValue < 1
              }
              aria-describedby={
                !canAddEvent ? "add-event-validation" : undefined
              }
              onChange={(event) => setNewBowlersPerPair(event.target.value)}
              placeholder="Example: 10"
            />
          </label>

          <label>
            Schedule Type
            <select
              value={newScheduleUnit}
              onChange={(event) =>
                setNewScheduleUnit(event.target.value as EventScheduleUnit)
              }
            >
              <option>Weeks</option>
              <option>Days</option>
            </select>
          </label>

          <label>
            Number of {newScheduleUnit} <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newScheduleCount}
              aria-invalid={
                !Number.isFinite(newScheduleCountValue) ||
                newScheduleCountValue < 1
              }
              aria-describedby={
                !canAddEvent ? "add-event-validation" : undefined
              }
              onChange={(event) => setNewScheduleCount(event.target.value)}
              placeholder={newScheduleUnit === "Weeks" ? "Example: 12" : "Example: 2"}
            />
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={newStartDate}
              onChange={(event) => setNewStartDate(event.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={newEndDate}
              onChange={(event) => setNewEndDate(event.target.value)}
            />
          </label>

          <label>
            Bowling Center <span className="required">*</span>
            <select
              value={newCenterId}
              aria-invalid={newCenterId === ""}
              aria-describedby={
                !canAddEvent ? "add-event-validation" : undefined
              }
              onChange={(event) => setNewCenterId(event.target.value)}
            >
              <option value="">Select bowling center</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Scores / Dashboard URL
            <input
              type="url"
              value={newDashboardUrl}
              aria-invalid={!isValidExternalUrl(newDashboardUrl)}
              aria-describedby={
                !isValidExternalUrl(newDashboardUrl)
                  ? "new-dashboard-url-error"
                  : undefined
              }
              onChange={(event) => setNewDashboardUrl(event.target.value)}
              placeholder="Optional, example: leaguepals.com/..."
            />
            {getExternalUrlError(newDashboardUrl) && (
              <span className="field-error-text" id="new-dashboard-url-error">
                {getExternalUrlError(newDashboardUrl)}
              </span>
            )}
          </label>

          <label>
            Standings URL
            <input
              type="url"
              value={newStandingsUrl}
              aria-invalid={!isValidExternalUrl(newStandingsUrl)}
              aria-describedby={
                !isValidExternalUrl(newStandingsUrl)
                  ? "new-standings-url-error"
                  : undefined
              }
              onChange={(event) => setNewStandingsUrl(event.target.value)}
              placeholder="Optional, example: tournamentbowl.com/..."
            />
            {getExternalUrlError(newStandingsUrl) && (
              <span className="field-error-text" id="new-standings-url-error">
                {getExternalUrlError(newStandingsUrl)}
              </span>
            )}
          </label>

          <label>
            Notes
            <textarea
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </label>
        </div>

          {!canAddEvent && (
            <section
              className="field-validation-card compact-validation-card"
              id="add-event-validation"
              aria-live="polite"
            >
              <h3>Before Adding</h3>
              <ul>
                {eventAddValidationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </section>
          )}

          <button
            className="save-button"
            disabled={!canAddEvent}
            onClick={() => {
              addEvent();
              setAddingEvent(false);
            }}
          >
            Add Event
          </button>
            </div>
          </div>
        </div>
      )}

      <section className="event-list">
        {events.length === 0 && (
          <EmptyStateCard
            title="No Leagues or Tournaments Added Yet"
            description="You haven't added any leagues or tournaments. Use + Add League / Tournament above to create one for tracking week/day-based sets."
          />
        )}

        {events.map((event) => {
          const draftEvent = getEventDraft(event);
          const isDirty = hasEventChanged(event);

          return (
            <details className="event-card" key={event.id}>
              <summary className="event-summary">
                <div>
                  <strong>{event.name}</strong>
                  <p>{formatEventSummary(event)}</p>
                  {(event.dashboardUrl || event.standingsUrl) && (
                    <p className="event-link-hint">External links saved</p>
                  )}
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open / Close Details</span>
              </summary>

              <div className="event-details-content">
                <section className="event-preview-card">
                  <h4>Event Summary</h4>
                  <p>
                    <strong>Type:</strong> {event.eventType}
                  </p>
                  <p>
                    <strong>Format:</strong> {event.format}
                  </p>
                  <p>
                    <strong>Games in Series/Block:</strong>{" "}
                    {event.seriesGameCount}
                  </p>
                  <p>
                    <strong>Bowlers Per Pair:</strong> {event.bowlersPerPair}
                  </p>
                  <p>
                    <strong>Schedule:</strong> {getScheduleLabel(event)}
                  </p>
                  <p>
                    <strong>Dates:</strong>{" "}
                    {event.startDate || "No start date"} →{" "}
                    {event.endDate || "No end date"}
                  </p>
                  <p>
                    <strong>Bowling Center:</strong>{" "}
                    {getCenterName(event.centerId)}
                  </p>
                  <p>
                    <strong>Pattern:</strong> selected when logging each week/day
                  </p>

                  {(event.dashboardUrl || event.standingsUrl) && (
                    <div className="event-resource-links">
                      {event.dashboardUrl && (
                        <a
                          href={normalizeExternalUrl(event.dashboardUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Scores / Dashboard
                        </a>
                      )}

                      {event.standingsUrl && (
                        <a
                          href={normalizeExternalUrl(event.standingsUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Standings
                        </a>
                      )}
                    </div>
                  )}
                </section>

                <div className="event-actions-row single">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingEventId(event.id)}
                  >
                    Edit Event
                  </button>
                </div>
              </div>

              {editingEventId === event.id && (
                <div className="ps-modal" role="dialog" aria-modal="true">
                  <div
                    className="ps-modal-backdrop"
                    onClick={() => closeEventEditor(event.id)}
                  />
                  <div className="ps-modal-panel">
                    <button
                      type="button"
                      className="ps-modal-close"
                      onClick={() => closeEventEditor(event.id)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="ps-modal-title">Edit League / Tournament</h3>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftEvent.name}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          name: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Type
                    <select
                      value={draftEvent.eventType}
                      onChange={(inputEvent) => {
                        const nextType = inputEvent.target.value as
                          | "League"
                          | "Tournament";

                        updateEventDraft(event, {
                          eventType: nextType,
                          scheduleUnit:
                            nextType === "League" ? "Weeks" : "Days",
                        });
                      }}
                    >
                      <option>League</option>
                      <option>Tournament</option>
                    </select>
                  </label>

                  <label>
                    Format
                    <select
                      value={draftEvent.format}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          format: inputEvent.target.value as BowlingFormat,
                        })
                      }
                    >
                      <option>Singles</option>
                      <option>Doubles</option>
                      <option>Trios</option>
                      <option>Fours</option>
                      <option>Fives</option>
                      <option>Baker</option>
                    </select>
                  </label>

                  <label>
                    Games in Series/Block
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.seriesGameCount}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          seriesGameCount: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Bowlers Per Pair
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.bowlersPerPair}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          bowlersPerPair: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Schedule Type
                    <select
                      value={draftEvent.scheduleUnit}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          scheduleUnit: inputEvent.target
                            .value as EventScheduleUnit,
                        })
                      }
                    >
                      <option>Weeks</option>
                      <option>Days</option>
                    </select>
                  </label>

                  <label>
                    Number of {draftEvent.scheduleUnit}
                    <input
                      type="number"
                      min="1"
                      value={draftEvent.scheduleCount}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          scheduleCount: Math.max(
                            1,
                            Math.floor(Number(inputEvent.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Start Date
                    <input
                      type="date"
                      value={draftEvent.startDate}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          startDate: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    End Date
                    <input
                      type="date"
                      value={draftEvent.endDate}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          endDate: inputEvent.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Bowling Center
                    <select
                      value={draftEvent.centerId}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          centerId: Number(inputEvent.target.value),
                        })
                      }
                    >
                      {centers.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Scores / Dashboard URL
                    <input
                      type="url"
                      value={draftEvent.dashboardUrl ?? ""}
                      aria-invalid={!isValidExternalUrl(draftEvent.dashboardUrl)}
                      aria-describedby={
                        !isValidExternalUrl(draftEvent.dashboardUrl)
                          ? `dashboard-url-error-${event.id}`
                          : undefined
                      }
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          dashboardUrl: inputEvent.target.value,
                        })
                      }
                      placeholder="Optional, example: leaguepals.com/..."
                    />
                    {getExternalUrlError(draftEvent.dashboardUrl) && (
                      <span
                        className="field-error-text"
                        id={`dashboard-url-error-${event.id}`}
                      >
                        {getExternalUrlError(draftEvent.dashboardUrl)}
                      </span>
                    )}
                  </label>

                  <label>
                    Standings URL
                    <input
                      type="url"
                      value={draftEvent.standingsUrl ?? ""}
                      aria-invalid={!isValidExternalUrl(draftEvent.standingsUrl)}
                      aria-describedby={
                        !isValidExternalUrl(draftEvent.standingsUrl)
                          ? `standings-url-error-${event.id}`
                          : undefined
                      }
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          standingsUrl: inputEvent.target.value,
                        })
                      }
                      placeholder="Optional, example: tournamentbowl.com/..."
                    />
                    {getExternalUrlError(draftEvent.standingsUrl) && (
                      <span
                        className="field-error-text"
                        id={`standings-url-error-${event.id}`}
                      >
                        {getExternalUrlError(draftEvent.standingsUrl)}
                      </span>
                    )}
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftEvent.notes}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          notes: inputEvent.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="event-preview-card">
                  <h4>Event Summary</h4>
                  <p>
                    <strong>Type:</strong> {draftEvent.eventType}
                  </p>
                  <p>
                    <strong>Format:</strong> {draftEvent.format}
                  </p>
                  <p>
                    <strong>Games in Series/Block:</strong>{" "}
                    {draftEvent.seriesGameCount}
                  </p>
                  <p>
                    <strong>Bowlers Per Pair:</strong> {draftEvent.bowlersPerPair}
                  </p>
                  <p>
                    <strong>Schedule:</strong> {getScheduleLabel(draftEvent)}
                  </p>
                  <p>
                    <strong>Dates:</strong>{" "}
                    {draftEvent.startDate || "No start date"} →{" "}
                    {draftEvent.endDate || "No end date"}
                  </p>
                  <p>
                    <strong>Bowling Center:</strong>{" "}
                    {getCenterName(draftEvent.centerId)}
                  </p>
                  <p>
                    <strong>Pattern:</strong> selected when logging each week/day
                  </p>

                  {(draftEvent.dashboardUrl || draftEvent.standingsUrl) && (
                    <div className="event-resource-links">
                      {draftEvent.dashboardUrl && (
                        <a
                          href={normalizeExternalUrl(draftEvent.dashboardUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Scores / Dashboard
                        </a>
                      )}

                      {draftEvent.standingsUrl && (
                        <a
                          href={normalizeExternalUrl(draftEvent.standingsUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Standings
                        </a>
                      )}
                    </div>
                  )}
                </section>

                    <div className="event-actions-row">
                      <button
                        className="save-button"
                        disabled={
                          !isDirty ||
                          !isValidExternalUrl(draftEvent.dashboardUrl) ||
                          !isValidExternalUrl(draftEvent.standingsUrl)
                        }
                        onClick={() => {
                          saveEvent(event.id);
                          setEditingEventId(null);
                        }}
                      >
                        Save Event
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => {
                          deleteEvent(event.id);
                          setEditingEventId(null);
                        }}
                      >
                        Delete Event
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </details>
          );
        })}
      </section>
    </>
  );
}
