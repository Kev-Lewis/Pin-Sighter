import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import "./App.css";

type Tab =
  | "home"
  | "log-games"
  | "stats"
  | "bowlers"
  | "centers"
  | "events"
  | "patterns";

type CompetitionType = "Open" | "League" | "Tournament";

type BowlingFormat =
  | "Singles"
  | "Doubles"
  | "Trios"
  | "Fours"
  | "Fives"
  | "Baker";

type Handedness = "Right" | "Left";

type BowlingBall = {
  id: number;
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

type Bowler = {
  id: number;
  name: string;
  handedness: Handedness;
  notes: string;
  arsenal: BowlingBall[];
};

type Center = {
  id: number;
  name: string;
  laneCount: number;
  notes: string;
};

type Pattern = {
  id: number;
  name: string;
  length: string;
  volume: string;
  ratio: string;
  dropBrush: string;
  source: string;
  notes: string;
};

type EventScheduleUnit = "Weeks" | "Days";

type EventSetup = {
  id: number;
  name: string;
  eventType: "League" | "Tournament";
  seriesGameCount: number;
  scheduleUnit: EventScheduleUnit;
  scheduleCount: number;
  startDate: string;
  endDate: string;
  centerId: number;
  patternId: number;
  notes: string;
};

type CarryoverFields = {
  ballUsed: string;
  footBoard: string;
  targetArrow: string;
  targetBreakpoint: string;
  actualArrow: string;
  actualBreakpoint: string;
};

type FrameEntry = CarryoverFields & {
  frameNumber: number;
  bowlerName: string;
  firstShotKnockedPins: number[];
  secondShotKnockedPins: number[];
  isComplete: boolean;
};

type LaneOption = {
  value: string;
  label: string;
};

type CompletedGameScore = {
  label: string;
  score: number;
};

type CompletedGameSummary = {
  gameNumber: number;
  laneLabel: string;
  scores: CompletedGameScore[];
};

type LogGamesPageProps = {
  bowlers: Bowler[];
  centers: Center[];
  patterns: Pattern[];
  events: EventSetup[];
};

type BowlersPageProps = {
  bowlers: Bowler[];
  setBowlers: Dispatch<SetStateAction<Bowler[]>>;
};

type CentersPageProps = {
  centers: Center[];
  setCenters: Dispatch<SetStateAction<Center[]>>;
};

type PatternsPageProps = {
  patterns: Pattern[];
  setPatterns: Dispatch<SetStateAction<Pattern[]>>;
};

type EventsPageProps = {
  events: EventSetup[];
  setEvents: Dispatch<SetStateAction<EventSetup[]>>;
  centers: Center[];
  patterns: Pattern[];
};

type GameEntryPageProps = {
  bowlers: Bowler[];
  bowlerNames: string[];
  competitionType: CompetitionType;
  format: BowlingFormat;
  centerName: string;
  patternName: string;
  eventStageLabel: string;
  laneMode: string;
  startingLaneOrPair: string;
  laneOptions: LaneOption[];
  seriesGameCount: number | null;
  onBack: () => void;
};

type PinDeckProps = {
  knockedPins: number[];
  onChange: (knockedPins: number[]) => void;
  availablePins?: number[];
};

type BoardSelectProps = {
  label: string;
  value: string;
  options: number[];
  onChange: (value: string) => void;
};

type NewBallFormState = {
  name: string;
  brand: string;
  surface: string;
  layout: string;
  notes: string;
};

const tabs: { id: Tab; label: string }[] = [
  { id: "log-games", label: "Log Games" },
  { id: "stats", label: "Stats" },
  { id: "bowlers", label: "Bowlers" },
  { id: "centers", label: "Bowling Centers" },
  { id: "events", label: "Tournaments / Leagues" },
  { id: "patterns", label: "Patterns" },
];

const defaultCenters: Center[] = [
  { id: 1, name: "Titan Bowl", laneCount: 8, notes: "School bowling center" },
  { id: 2, name: "Bowlero Fullerton", laneCount: 40, notes: "" },
  { id: 3, name: "Temporary 24 Lane Center", laneCount: 24, notes: "" },
];

const defaultPatterns: Pattern[] = [
  {
    id: 0,
    name: "Unknown / House Shot",
    length: "",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "",
    notes: "Fallback pattern when the condition is unknown.",
  },
  {
    id: 1,
    name: "Custom Pattern",
    length: "",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "",
    notes: "",
  },
  {
    id: 2,
    name: "2025 PBA Wolf",
    length: "32",
    volume: "",
    ratio: "",
    dropBrush: "",
    source: "PBA",
    notes: "",
  },
];

const defaultEvents: EventSetup[] = [
  {
    id: 1,
    name: "Tuesday Night League",
    eventType: "League",
    seriesGameCount: 3,
    scheduleUnit: "Weeks",
    scheduleCount: 12,
    startDate: "",
    endDate: "",
    centerId: 1,
    patternId: 0,
    notes: "",
  },
  {
    id: 2,
    name: "Sport Shot League",
    eventType: "League",
    seriesGameCount: 4,
    scheduleUnit: "Weeks",
    scheduleCount: 10,
    startDate: "",
    endDate: "",
    centerId: 2,
    patternId: 1,
    notes: "",
  },
  {
    id: 3,
    name: "Wolf Qualifying Block",
    eventType: "Tournament",
    seriesGameCount: 5,
    scheduleUnit: "Days",
    scheduleCount: 1,
    startDate: "",
    endDate: "",
    centerId: 2,
    patternId: 2,
    notes: "",
  },
  {
    id: 4,
    name: "Scratch Sweeper",
    eventType: "Tournament",
    seriesGameCount: 3,
    scheduleUnit: "Days",
    scheduleCount: 1,
    startDate: "",
    endDate: "",
    centerId: 3,
    patternId: 0,
    notes: "",
  },
];

const defaultBowlers: Bowler[] = [
  {
    id: 1,
    name: "Kevin",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 101,
        name: "Venom Shock",
        brand: "Motiv",
        surface: "2K",
        layout: "",
        notes: "Benchmark ball",
      },
      {
        id: 102,
        name: "IQ Tour",
        brand: "Storm",
        surface: "",
        layout: "",
        notes: "",
      },
      {
        id: 103,
        name: "Spare Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 2,
    name: "Bowler 2",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 201,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
  {
    id: 3,
    name: "Bowler 3",
    handedness: "Right",
    notes: "",
    arsenal: [
      {
        id: 301,
        name: "House Ball",
        brand: "",
        surface: "",
        layout: "",
        notes: "",
      },
    ],
  },
];

const handednessOptions: Handedness[] = ["Right", "Left"];

const footBoardOptions = Array.from({ length: 81 }, (_, index) => index - 20);
const laneBoardOptions = Array.from({ length: 39 }, (_, index) => index + 1);

const emptyBallForm: NewBallFormState = {
  name: "",
  brand: "",
  surface: "",
  layout: "",
  notes: "",
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [bowlers, setBowlers] = useState<Bowler[]>(defaultBowlers);
  const [centers, setCenters] = useState<Center[]>(defaultCenters);
  const [patterns, setPatterns] = useState<Pattern[]>(defaultPatterns);
  const [events, setEvents] = useState<EventSetup[]>(defaultEvents);

  return (
    <main className="app-shell">
      <section className="logo-card" onClick={() => setActiveTab("home")}>
        <h1>Pin-Sighter</h1>
        <p>Bowling stats, shot tracking, and analytics</p>
      </section>

      {activeTab === "home" ? (
        <nav className="home-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className="nav-button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      ) : (
        <section className="page-card">
          <button className="back-button" onClick={() => setActiveTab("home")}>
            ← Back
          </button>

          {activeTab === "log-games" && (
            <LogGamesPage
              bowlers={bowlers}
              centers={centers}
              patterns={patterns}
              events={events}
            />
          )}
          {activeTab === "stats" && <StatsPage />}
          {activeTab === "bowlers" && (
            <BowlersPage bowlers={bowlers} setBowlers={setBowlers} />
          )}
          {activeTab === "centers" && (
            <CentersPage centers={centers} setCenters={setCenters} />
          )}
          {activeTab === "events" && (
            <EventsPage
              events={events}
              setEvents={setEvents}
              centers={centers}
              patterns={patterns}
            />
          )}
          {activeTab === "patterns" && (
            <PatternsPage patterns={patterns} setPatterns={setPatterns} />
          )}
        </section>
      )}
    </main>
  );
}

function LogGamesPage({
  bowlers,
  centers,
  patterns,
  events,
}: LogGamesPageProps) {
  const [showGameEntry, setShowGameEntry] = useState(false);

  const [competitionType, setCompetitionType] =
    useState<CompetitionType>("Open");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventStage, setSelectedEventStage] = useState("");
  const [format, setFormat] = useState<BowlingFormat>("Singles");
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState("0");
  const [laneMode, setLaneMode] = useState("Pair");
  const [startingLaneOrPair, setStartingLaneOrPair] = useState("");
  const [selectedBowlers, setSelectedBowlers] = useState<string[]>([""]);

  const isOpen = competitionType === "Open";
  const isLimitedSeries = !isOpen;

  const availableEvents = events.filter(
    (event) => event.eventType === competitionType
  );

  const selectedEvent = events.find(
    (event) => String(event.id) === selectedEventId
  );

  const selectedCenter = isOpen
    ? centers.find((center) => String(center.id) === selectedCenterId)
    : centers.find((center) => center.id === selectedEvent?.centerId);

  const selectedPattern = isOpen
    ? patterns.find(
        (pattern) => String(pattern.id) === selectedPatternId
      )
    : patterns.find(
        (pattern) => pattern.id === selectedEvent?.patternId
      );

  const seriesGameCount = isLimitedSeries
    ? selectedEvent?.seriesGameCount ?? null
    : null;

  const eventStageOptions =
    selectedEvent && selectedEvent.scheduleCount > 0
      ? Array.from(
          { length: selectedEvent.scheduleCount },
          (_, index) => index + 1
        )
      : [];

  const eventStageSingular =
    selectedEvent?.scheduleUnit === "Days" ? "Day" : "Week";

  const eventStageLabel =
    selectedEvent && selectedEventStage
      ? `${eventStageSingular} ${selectedEventStage}`
      : "";

  const bowlerSlotCount = getBowlerSlotCount(format);
  const activeBowlers = selectedBowlers.filter(Boolean);

  const laneOptions = useMemo<LaneOption[]>(() => {
    if (!selectedCenter) {
      return [];
    }

    if (laneMode === "Single Lane") {
      return Array.from({ length: selectedCenter.laneCount }, (_, index) => {
        const laneNumber = index + 1;

        return {
          value: String(laneNumber),
          label: `Lane ${laneNumber}`,
        };
      });
    }

    return Array.from(
      { length: Math.floor(selectedCenter.laneCount / 2) },
      (_, index) => {
        const leftLane = index * 2 + 1;
        const rightLane = leftLane + 1;

        return {
          value: `${leftLane}/${rightLane}`,
          label: `Pair ${leftLane}/${rightLane}`,
        };
      }
    );
  }, [selectedCenter, laneMode]);

  function handleCompetitionTypeChange(newCompetitionType: CompetitionType) {
    setCompetitionType(newCompetitionType);
    setSelectedEventId("");
    setSelectedEventStage("");
    setSelectedCenterId("");
    setSelectedPatternId("0");
    setStartingLaneOrPair("");
  }

  function handleFormatChange(newFormat: BowlingFormat) {
    setFormat(newFormat);

    const newSlotCount = getBowlerSlotCount(newFormat);

    setSelectedBowlers((currentBowlers) => {
      const resizedBowlers = currentBowlers.slice(0, newSlotCount);

      while (resizedBowlers.length < newSlotCount) {
        resizedBowlers.push("");
      }

      return resizedBowlers;
    });
  }

  function handleEventChange(newEventId: string) {
    setSelectedEventId(newEventId);
    setSelectedEventStage("");
    setStartingLaneOrPair("");
  }

  function handleCenterChange(newCenterId: string) {
    setSelectedCenterId(newCenterId);
    setStartingLaneOrPair("");
  }

  function handleLaneModeChange(newLaneMode: string) {
    setLaneMode(newLaneMode);
    setStartingLaneOrPair("");
  }

  function handleBowlerChange(index: number, bowlerName: string) {
    setSelectedBowlers((currentBowlers) => {
      const updatedBowlers = [...currentBowlers];
      updatedBowlers[index] = bowlerName;
      return updatedBowlers;
    });
  }

  const selectedNonEmptyBowlers = selectedBowlers.filter(Boolean);

  const hasEnoughBowlers =
    format === "Baker"
      ? selectedBowlers[0] !== "" && selectedBowlers[1] !== ""
      : selectedBowlers.length === bowlerSlotCount &&
        selectedBowlers.every((bowler) => bowler !== "");

  const hasDuplicateBowlers =
    new Set(selectedNonEmptyBowlers).size !== selectedNonEmptyBowlers.length;

  const hasRequiredEvent = isOpen || selectedEvent !== undefined;
  const hasRequiredEventStage =
    isOpen || eventStageOptions.length === 0 || selectedEventStage !== "";

  const canStartGame =
    hasRequiredEvent &&
    hasRequiredEventStage &&
    selectedCenter !== undefined &&
    startingLaneOrPair !== "" &&
    hasEnoughBowlers &&
    !hasDuplicateBowlers;

  const bowlersForGame = format === "Baker" ? activeBowlers : selectedBowlers;

  if (showGameEntry) {
    return (
      <GameEntryPage
        bowlers={bowlers}
        bowlerNames={bowlersForGame}
        competitionType={competitionType}
        format={format}
        centerName={selectedCenter?.name ?? "Unknown Center"}
        patternName={selectedPattern?.name ?? "Unknown Pattern"}
        eventStageLabel={eventStageLabel}
        laneMode={laneMode}
        startingLaneOrPair={startingLaneOrPair}
        laneOptions={laneOptions}
        seriesGameCount={seriesGameCount}
        onBack={() => setShowGameEntry(false)}
      />
    );
  }

  return (
    <>
      <h2>Log Games</h2>
      <p>
        Set up an open, league, or tournament session before entering shot data.
      </p>

      <div className="form-grid">
        <label>
          Competition Type
          <select
            value={competitionType}
            onChange={(event) =>
              handleCompetitionTypeChange(
                event.target.value as CompetitionType
              )
            }
          >
            <option>Open</option>
            <option>League</option>
            <option>Tournament</option>
          </select>
        </label>

        {isLimitedSeries && (
          <label>
            {competitionType} <span className="required">*</span>
            <select
              value={selectedEventId}
              onChange={(event) => handleEventChange(event.target.value)}
            >
              <option value="">Select {competitionType.toLowerCase()}</option>

              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Format
          <select
            value={format}
            onChange={(event) =>
              handleFormatChange(event.target.value as BowlingFormat)
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

        {isOpen && (
          <>
            <label>
              Bowling Center <span className="required">*</span>
              <select
                value={selectedCenterId}
                onChange={(event) => handleCenterChange(event.target.value)}
              >
                <option value="">Select bowling center</option>

                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name} — {center.laneCount} lanes
                  </option>
                ))}
              </select>
            </label>

            <label>
              Pattern
              <select
                value={selectedPatternId}
                onChange={(event) => setSelectedPatternId(event.target.value)}
              >
                {patterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {selectedEvent && eventStageOptions.length > 0 && (
          <label>
            {eventStageSingular} <span className="required">*</span>
            <select
              value={selectedEventStage}
              onChange={(event) => setSelectedEventStage(event.target.value)}
            >
              <option value="">Select {eventStageSingular.toLowerCase()}</option>
              {eventStageOptions.map((stageNumber) => (
                <option key={stageNumber} value={stageNumber}>
                  {eventStageSingular} {stageNumber}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Lane Mode
          <select
            value={laneMode}
            onChange={(event) => handleLaneModeChange(event.target.value)}
            disabled={!selectedCenter}
          >
            <option>Single Lane</option>
            <option>Pair</option>
          </select>
        </label>

        <label>
          Starting Pair/Lane <span className="required">*</span>
          <select
            value={startingLaneOrPair}
            onChange={(event) => setStartingLaneOrPair(event.target.value)}
            disabled={!selectedCenter}
          >
            <option value="">
              {!selectedCenter
                ? isOpen
                  ? "Select center first"
                  : `Select ${competitionType.toLowerCase()} first`
                : laneMode === "Pair"
                ? "Select starting pair"
                : "Select starting lane"}
            </option>

            {laneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedEvent && (
        <section className="event-summary-card">
          <h3>{selectedEvent.name}</h3>
          <p>
            <strong>Games in Series/Block:</strong>{" "}
            {selectedEvent.seriesGameCount}
          </p>
          <p>
            <strong>Schedule:</strong> {selectedEvent.scheduleCount}{" "}
            {selectedEvent.scheduleUnit.toLowerCase()}
          </p>
          {eventStageLabel && (
            <p>
              <strong>Logging For:</strong> {eventStageLabel}
            </p>
          )}
          <p>
            <strong>Bowling Center:</strong> {selectedCenter?.name}
          </p>
          <p>
            <strong>Pattern:</strong> {selectedPattern?.name}
          </p>
        </section>
      )}

      <section className="bowler-order-card">
        <h3>Bowler Order</h3>
        <p>
          {format === "Baker"
            ? "For Baker, choose 2 to 5 bowlers. Positions 1 and 2 are required; positions 3–5 are optional. The rotation repeats automatically based on the bowlers selected."
            : "Select bowlers after choosing the format so the order matches singles or team games."}
        </p>

        {format === "Baker" && (
          <BakerRotationPreview selectedBowlers={activeBowlers} />
        )}

        <div className="form-grid">
          {Array.from({ length: bowlerSlotCount }, (_, index) => {
            const isRequired =
              format !== "Baker" || (format === "Baker" && index < 2);

            return (
              <label key={index}>
                {format === "Baker"
                  ? `Baker Position ${index + 1}`
                  : `Bowler ${index + 1}`}{" "}
                {isRequired ? (
                  <span className="required">*</span>
                ) : (
                  <span className="helper-text">Optional</span>
                )}
                <select
                  value={selectedBowlers[index] ?? ""}
                  onChange={(event) =>
                    handleBowlerChange(index, event.target.value)
                  }
                >
                  <option value="">Select bowler</option>

                  {bowlers.map((bowler) => (
                    <option
                      key={bowler.id}
                      value={bowler.name}
                      disabled={
                        selectedBowlers.includes(bowler.name) &&
                        selectedBowlers[index] !== bowler.name
                      }
                    >
                      {bowler.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        {hasDuplicateBowlers && (
          <p className="error-text">Each bowler can only be selected once.</p>
        )}
      </section>

      <button
        className="primary-button"
        disabled={!canStartGame}
        onClick={() => setShowGameEntry(true)}
      >
        Start Game
      </button>

      {!canStartGame && (
        <p className="helper-text">
          {format === "Baker"
            ? "Select at least 2 Baker bowlers, a starting pair/lane, and any required event setup to begin."
            : isOpen
            ? "Select a bowling center, starting pair/lane, and complete the bowler order to begin."
            : `Select a ${competitionType.toLowerCase()}, week/day, starting pair/lane, and complete the bowler order to begin.`}
        </p>
      )}
    </>
  );
}

function getBowlerSlotCount(format: BowlingFormat) {
  switch (format) {
    case "Doubles":
      return 2;
    case "Trios":
      return 3;
    case "Fours":
      return 4;
    case "Fives":
    case "Baker":
      return 5;
    case "Singles":
    default:
      return 1;
  }
}

function BakerRotationPreview({
  selectedBowlers,
}: {
  selectedBowlers: string[];
}) {
  if (selectedBowlers.length < 2) {
    return (
      <p className="helper-text">
        Choose at least 2 bowlers to preview the Baker frame rotation.
      </p>
    );
  }

  const assignments = selectedBowlers.map((bowlerName, bowlerIndex) => {
    const frames = Array.from({ length: 10 }, (_, index) => index + 1).filter(
      (frameNumber) =>
        (frameNumber - 1) % selectedBowlers.length === bowlerIndex
    );

    return {
      bowlerName,
      position: bowlerIndex + 1,
      frames,
    };
  });

  return (
    <section className="baker-rotation-card">
      <h4>Baker Rotation Preview</h4>

      <div className="baker-rotation-list">
        {assignments.map((assignment) => (
          <p key={assignment.position}>
            <strong>
              Position {assignment.position} — {assignment.bowlerName}:
            </strong>{" "}
            Frames {assignment.frames.join(", ")}
          </p>
        ))}
      </div>
    </section>
  );
}

function BowlersPage({ bowlers, setBowlers }: BowlersPageProps) {
  const [newBowlerName, setNewBowlerName] = useState("");
  const [newBowlerHandedness, setNewBowlerHandedness] =
    useState<Handedness>("Right");
  const [newBowlerNotes, setNewBowlerNotes] = useState("");
  const [newBallForms, setNewBallForms] = useState<
    Record<number, NewBallFormState>
  >({});
  const [bowlerDrafts, setBowlerDrafts] = useState<Record<number, Bowler>>({});

  function getBowlerDraft(bowler: Bowler) {
    return bowlerDrafts[bowler.id] ?? bowler;
  }

  function hasBowlerChanged(bowler: Bowler) {
    const draft = bowlerDrafts[bowler.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(bowler);
  }

  function updateBowlerDraft(bowler: Bowler, updates: Partial<Bowler>) {
    setBowlerDrafts((currentDrafts) => ({
      ...currentDrafts,
      [bowler.id]: {
        ...getBowlerDraft(bowler),
        ...updates,
      },
    }));
  }

  function saveBowler(bowlerId: number) {
    const draft = bowlerDrafts[bowlerId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Bowler name cannot be empty.");
      return;
    }

    const nameAlreadyExists = bowlers.some(
      (bowler) =>
        bowler.id !== bowlerId &&
        bowler.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowler with that name already exists.");
      return;
    }

    setBowlers((currentBowlers) =>
      currentBowlers.map((bowler) =>
        bowler.id === bowlerId
          ? {
              ...draft,
              name: trimmedName,
              notes: draft.notes.trim(),
              arsenal: draft.arsenal.map((ball) => ({
                ...ball,
                name: ball.name.trim(),
                brand: ball.brand.trim(),
                surface: ball.surface.trim(),
                layout: ball.layout.trim(),
                notes: ball.notes.trim(),
              })),
            }
          : bowler
      )
    );

    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowlerId];
      return updatedDrafts;
    });
  }

  function addBowler() {
    const trimmedName = newBowlerName.trim();

    if (!trimmedName) {
      return;
    }

    const nameAlreadyExists = bowlers.some(
      (bowler) => bowler.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowler with that name already exists.");
      return;
    }

    setBowlers((currentBowlers) => [
      ...currentBowlers,
      {
        id: Date.now(),
        name: trimmedName,
        handedness: newBowlerHandedness,
        notes: newBowlerNotes.trim(),
        arsenal: [],
      },
    ]);

    setNewBowlerName("");
    setNewBowlerHandedness("Right");
    setNewBowlerNotes("");
  }

  function deleteBowler(bowlerId: number) {
    const bowler = bowlers.find(
      (currentBowler) => currentBowler.id === bowlerId
    );

    if (!bowler) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${bowler.name}? This will also remove their arsenal.`
    );

    if (!shouldDelete) {
      return;
    }

    setBowlers((currentBowlers) =>
      currentBowlers.filter((currentBowler) => currentBowler.id !== bowlerId)
    );

    setBowlerDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[bowlerId];
      return updatedDrafts;
    });
  }

  function getBallForm(bowlerId: number) {
    return newBallForms[bowlerId] ?? emptyBallForm;
  }

  function updateBallForm(
    bowlerId: number,
    updates: Partial<NewBallFormState>
  ) {
    setNewBallForms((currentForms) => ({
      ...currentForms,
      [bowlerId]: {
        ...getBallForm(bowlerId),
        ...updates,
      },
    }));
  }

  function addBallToBowler(bowler: Bowler) {
    const form = getBallForm(bowler.id);
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      return;
    }

    const draftBowler = getBowlerDraft(bowler);

    updateBowlerDraft(bowler, {
      arsenal: [
        ...draftBowler.arsenal,
        {
          id: Date.now(),
          name: trimmedName,
          brand: form.brand.trim(),
          surface: form.surface.trim(),
          layout: form.layout.trim(),
          notes: form.notes.trim(),
        },
      ],
    });

    setNewBallForms((currentForms) => ({
      ...currentForms,
      [bowler.id]: emptyBallForm,
    }));
  }

  function deleteBall(bowler: Bowler, ballId: number) {
    const draftBowler = getBowlerDraft(bowler);
    const ball = draftBowler.arsenal.find(
      (currentBall) => currentBall.id === ballId
    );

    if (!ball) {
      return;
    }

    const shouldDelete = window.confirm(
      `Remove ${ball.name} from ${draftBowler.name}'s arsenal?`
    );

    if (!shouldDelete) {
      return;
    }

    updateBowlerDraft(bowler, {
      arsenal: draftBowler.arsenal.filter(
        (currentBall) => currentBall.id !== ballId
      ),
    });
  }

  return (
    <>
      <h2>Bowlers</h2>
      <p>
        Add bowlers, set handedness, manage notes, and build each bowler’s
        arsenal for shot logging.
      </p>

      <section className="bowler-form-card">
        <h3>Add Bowler</h3>

        <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newBowlerName}
              onChange={(event) => setNewBowlerName(event.target.value)}
              placeholder="Example: Kevin"
            />
          </label>

          <label>
            Handedness
            <select
              value={newBowlerHandedness}
              onChange={(event) =>
                setNewBowlerHandedness(event.target.value as Handedness)
              }
            >
              {handednessOptions.map((handedness) => (
                <option key={handedness} value={handedness}>
                  {handedness}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={newBowlerNotes}
              onChange={(event) => setNewBowlerNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

        <button
          className="primary-button"
          disabled={!newBowlerName.trim()}
          onClick={addBowler}
        >
          Add Bowler
        </button>
      </section>

      <section className="bowler-list">
        {bowlers.map((bowler) => {
          const draftBowler = getBowlerDraft(bowler);
          const ballForm = getBallForm(bowler.id);
          const isDirty = hasBowlerChanged(bowler);

          return (
            <details className="bowler-card" key={bowler.id}>
              <summary className="bowler-summary">
                <div>
                  <strong>{bowler.name}</strong>
                  <p>
                    {bowler.handedness} • {bowler.arsenal.length} ball
                    {bowler.arsenal.length === 1 ? "" : "s"}
                  </p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="bowler-details-content">
                <div className="bowler-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveBowler(bowler.id)}
                  >
                    Save Bowler
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteBowler(bowler.id)}
                  >
                    Delete Bowler
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftBowler.name}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Handedness
                    <select
                      value={draftBowler.handedness}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          handedness: event.target.value as Handedness,
                        })
                      }
                    >
                      {handednessOptions.map((handedness) => (
                        <option key={handedness} value={handedness}>
                          {handedness}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftBowler.notes}
                      onChange={(event) =>
                        updateBowlerDraft(bowler, {
                          notes: event.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="arsenal-section">
                  <h4>Arsenal</h4>

                  {draftBowler.arsenal.length === 0 ? (
                    <p className="helper-text">No balls added yet.</p>
                  ) : (
                    <div className="arsenal-list">
                      {draftBowler.arsenal.map((ball) => (
                        <div className="ball-card" key={ball.id}>
                          <div>
                            <strong>{ball.name}</strong>
                            <p>
                              {[ball.brand, ball.surface]
                                .filter(Boolean)
                                .join(" • ") || "No brand/surface entered"}
                            </p>

                            {ball.layout && (
                              <p>
                                <strong>Layout:</strong> {ball.layout}
                              </p>
                            )}

                            {ball.notes && <p>{ball.notes}</p>}
                          </div>

                          <button
                            className="danger-button small-button"
                            onClick={() => deleteBall(bowler, ball.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="add-ball-card">
                    <summary className="add-ball-summary">
                      <strong>Add Ball</strong>
                      <span className="summary-hint">Open Form</span>
                    </summary>

                    <div className="add-ball-content">
                      <div className="form-grid">
                        <label>
                          Ball Name <span className="required">*</span>
                          <input
                            value={ballForm.name}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                name: event.target.value,
                              })
                            }
                            placeholder="Example: Venom Shock"
                          />
                        </label>

                        <label>
                          Brand
                          <input
                            value={ballForm.brand}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                brand: event.target.value,
                              })
                            }
                            placeholder="Optional"
                          />
                        </label>

                        <label>
                          Surface
                          <input
                            value={ballForm.surface}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                surface: event.target.value,
                              })
                            }
                            placeholder="Example: 2K, box, polish"
                          />
                        </label>

                        <label>
                          Layout
                          <input
                            value={ballForm.layout}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                layout: event.target.value,
                              })
                            }
                            placeholder="Optional, example: 5 x 4 x 2"
                          />
                        </label>

                        <label>
                          Notes
                          <textarea
                            value={ballForm.notes}
                            onChange={(event) =>
                              updateBallForm(bowler.id, {
                                notes: event.target.value,
                              })
                            }
                            rows={3}
                            placeholder="Optional notes"
                          />
                        </label>
                      </div>

                      <button
                        className="secondary-button"
                        disabled={!ballForm.name.trim()}
                        onClick={() => addBallToBowler(bowler)}
                      >
                        Add Ball
                      </button>
                    </div>
                  </details>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}

function GameEntryPage({
  bowlers,
  bowlerNames,
  competitionType,
  format,
  centerName,
  patternName,
  eventStageLabel,
  laneMode,
  startingLaneOrPair,
  laneOptions,
  seriesGameCount,
  onBack,
}: GameEntryPageProps) {
  const frameOrder = useMemo(() => {
    const orderedEntries: { frameNumber: number; bowlerName: string }[] = [];

    for (let frameNumber = 1; frameNumber <= 10; frameNumber += 1) {
      if (format === "Baker") {
        const bowlerIndex = (frameNumber - 1) % bowlerNames.length;

        orderedEntries.push({
          frameNumber,
          bowlerName: bowlerNames[bowlerIndex],
        });
      } else {
        bowlerNames.forEach((bowlerName) => {
          orderedEntries.push({
            frameNumber,
            bowlerName,
          });
        });
      }
    }

    return orderedEntries;
  }, [bowlerNames, format]);

  const [gameNumber, setGameNumber] = useState(1);
  const [currentStartingLaneOrPair, setCurrentStartingLaneOrPair] =
    useState(startingLaneOrPair);
  const [nextLaneOrPair, setNextLaneOrPair] = useState(startingLaneOrPair);
  const [showNextGameSetup, setShowNextGameSetup] = useState(false);

  const [completedGames, setCompletedGames] = useState<CompletedGameSummary[]>(
    []
  );

  const [bowlerCarryovers, setBowlerCarryovers] = useState<
    Record<string, CarryoverFields>
  >({});

  function buildEntries(
    carryovers: Record<string, CarryoverFields>
  ): FrameEntry[] {
    return frameOrder.map((entry) => {
      const carryover = carryovers[entry.bowlerName];

      return {
        frameNumber: entry.frameNumber,
        bowlerName: entry.bowlerName,
        firstShotKnockedPins: [],
        secondShotKnockedPins: [],
        ballUsed: carryover?.ballUsed ?? "",
        footBoard: carryover?.footBoard ?? "",
        targetArrow: carryover?.targetArrow ?? "",
        targetBreakpoint: carryover?.targetBreakpoint ?? "",
        actualArrow: carryover?.actualArrow ?? "",
        actualBreakpoint: carryover?.actualBreakpoint ?? "",
        isComplete: false,
      };
    });
  }

  const [entries, setEntries] = useState<FrameEntry[]>(() => buildEntries({}));
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);

  const currentEntry = entries[currentEntryIndex];
  const isLastEntry = currentEntryIndex === entries.length - 1;
  const isGameComplete = entries.every((entry) => entry.isComplete);

  const currentBowler = bowlers.find(
    (bowler) => bowler.name === currentEntry.bowlerName
  );
  const currentBowlerBalls = currentBowler?.arsenal ?? [];

  const isLimitedSeries = seriesGameCount !== null;
  const isLastGameInSeries =
    isLimitedSeries && gameNumber >= (seriesGameCount ?? 0);

  const gameDisplay = isLimitedSeries
    ? `${gameNumber}/${seriesGameCount}`
    : `${gameNumber}`;

  const firstShotStandingPins = getPinsStanding(
    currentEntry.firstShotKnockedPins
  );
  const firstShotPinCount = currentEntry.firstShotKnockedPins.length;
  const isStrike = firstShotPinCount === 10;

  const secondShotPinCount = currentEntry.secondShotKnockedPins.length;
  const pinsStandingAfterFrame = firstShotStandingPins.filter(
    (pin) => !currentEntry.secondShotKnockedPins.includes(pin)
  );

  const totalFramePinCount = isStrike
    ? 10
    : firstShotPinCount + secondShotPinCount;

  const frameResult = getFrameResult(isStrike, pinsStandingAfterFrame);

  function hasUnsavedProgress() {
    return (
      completedGames.length > 0 ||
      entries.some(
        (entry) =>
          entry.isComplete ||
          entry.firstShotKnockedPins.length > 0 ||
          entry.secondShotKnockedPins.length > 0 ||
          entry.ballUsed !== "" ||
          entry.footBoard !== "" ||
          entry.targetArrow !== "" ||
          entry.targetBreakpoint !== "" ||
          entry.actualArrow !== "" ||
          entry.actualBreakpoint !== ""
      )
    );
  }

  function handleBackDuringScoring() {
    if (!hasUnsavedProgress()) {
      onBack();
      return;
    }

    const shouldExit = window.confirm(
      "Exit scoring? Any unsaved game data in this session will be lost."
    );

    if (shouldExit) {
      onBack();
    }
  }

  function updateCurrentEntry(updatedFields: Partial<FrameEntry>) {
    setEntries((currentEntries) => {
      const updatedEntries = [...currentEntries];

      updatedEntries[currentEntryIndex] = {
        ...updatedEntries[currentEntryIndex],
        ...updatedFields,
      };

      return updatedEntries;
    });
  }

  function updateFirstShotPins(knockedPins: number[]) {
    const newStandingPins = getPinsStanding(knockedPins);

    const filteredSecondShotPins = currentEntry.secondShotKnockedPins.filter(
      (pin) => newStandingPins.includes(pin)
    );

    updateCurrentEntry({
      firstShotKnockedPins: knockedPins,
      secondShotKnockedPins: filteredSecondShotPins,
    });
  }

  function goToPreviousEntry() {
    if (currentEntryIndex > 0) {
      setCurrentEntryIndex((index) => index - 1);
    }
  }

  function goToNextEntry() {
    if (currentEntryIndex < maxUnlockedIndex) {
      setCurrentEntryIndex((index) => index + 1);
    }
  }

  function getCarryoverFromEntry(entry: FrameEntry): CarryoverFields {
    return {
      ballUsed: entry.ballUsed,
      footBoard: entry.footBoard,
      targetArrow: entry.targetArrow,
      targetBreakpoint: entry.targetBreakpoint,
      actualArrow: entry.actualArrow,
      actualBreakpoint: entry.actualBreakpoint,
    };
  }

  function applyCarryoverToEntry(
    entry: FrameEntry,
    carryover: CarryoverFields | undefined
  ): FrameEntry {
    if (!carryover) {
      return entry;
    }

    return {
      ...entry,
      ballUsed: entry.ballUsed || carryover.ballUsed,
      footBoard: entry.footBoard || carryover.footBoard,
      targetArrow: entry.targetArrow || carryover.targetArrow,
      targetBreakpoint: entry.targetBreakpoint || carryover.targetBreakpoint,
      actualArrow: entry.actualArrow || carryover.actualArrow,
      actualBreakpoint: entry.actualBreakpoint || carryover.actualBreakpoint,
    };
  }

  function completeCurrentEntry() {
    const nextIndex = currentEntryIndex + 1;
    const currentCarryover = getCarryoverFromEntry(currentEntry);

    const updatedCarryovers = {
      ...bowlerCarryovers,
      [currentEntry.bowlerName]: currentCarryover,
    };

    setBowlerCarryovers(updatedCarryovers);

    const updatedEntries = [...entries];

    updatedEntries[currentEntryIndex] = {
      ...updatedEntries[currentEntryIndex],
      isComplete: true,
    };

    if (nextIndex < updatedEntries.length) {
      const nextBowlerName = updatedEntries[nextIndex].bowlerName;

      updatedEntries[nextIndex] = applyCarryoverToEntry(
        updatedEntries[nextIndex],
        updatedCarryovers[nextBowlerName]
      );
    }

    setEntries(updatedEntries);

    if (isLastEntry) {
      const scores = calculateScoresForGame(updatedEntries, bowlerNames, format);
      const laneLabel = formatLaneLabel(laneMode, currentStartingLaneOrPair);

      setCompletedGames((currentGames) => {
        const otherGames = currentGames.filter(
          (game) => game.gameNumber !== gameNumber
        );

        return [
          ...otherGames,
          {
            gameNumber,
            laneLabel,
            scores,
          },
        ].sort((a, b) => a.gameNumber - b.gameNumber);
      });

      return;
    }

    setMaxUnlockedIndex((currentMax) => Math.max(currentMax, nextIndex));
    setCurrentEntryIndex(nextIndex);
  }

  function handleSaveAndExit() {
    onBack();
  }

  function handleStartAnotherGame() {
    if (isLastGameInSeries) {
      return;
    }

    setCurrentStartingLaneOrPair(nextLaneOrPair);
    setGameNumber((currentGameNumber) => currentGameNumber + 1);
    setEntries(buildEntries(bowlerCarryovers));
    setCurrentEntryIndex(0);
    setMaxUnlockedIndex(0);
    setShowNextGameSetup(false);
  }

  return (
    <>
      <button className="back-button" onClick={handleBackDuringScoring}>
        ← Back to Setup
      </button>

      <h2>Game Entry</h2>

      <div className="session-summary">
        <p>
          <strong>Game:</strong> {gameDisplay}
        </p>
        <p>
          <strong>Competition:</strong> {competitionType}
        </p>
        <p>
          <strong>Format:</strong> {format}
        </p>
        <p>
          <strong>Bowling Center:</strong> {centerName}
        </p>
        <p>
          <strong>Pattern:</strong> {patternName}
        </p>
        {eventStageLabel && (
          <p>
            <strong>Week/Day:</strong> {eventStageLabel}
          </p>
        )}
        <p>
          <strong>Pair/Lane:</strong>{" "}
          {formatLaneLabel(laneMode, currentStartingLaneOrPair)}
        </p>
        <p>
          <strong>Bowler Order:</strong> {bowlerNames.join(" → ")}
        </p>
      </div>

      <section className="frame-card current-frame-card">
        <div className="frame-header">
          <div>
            <p className="eyebrow">Current Frame</p>
            <h3>Frame {currentEntry.frameNumber}</h3>
          </div>

          <div>
            <p className="eyebrow">Current Bowler</p>
            <h3>{currentEntry.bowlerName}</h3>
          </div>
        </div>

        <div className="progress-row">
          <span>Game {gameDisplay}</span>
          <span>
            Entry {currentEntryIndex + 1} of {entries.length}
          </span>
          <span>Frame {currentEntry.frameNumber} of 10</span>
          <span>{frameResult}</span>
          {currentEntry.isComplete && <span>Completed</span>}
          {format === "Baker" && <span>Baker rotation</span>}
        </div>

        <div className="pin-entry-layout">
          <div className="shot-decks">
            <div>
              <h3>First Ball Pin Deck</h3>
              <p className="helper-text">
                Click the pins that were knocked down. Pins not selected are
                treated as standing.
              </p>

              <PinDeck
                knockedPins={currentEntry.firstShotKnockedPins}
                onChange={updateFirstShotPins}
              />
            </div>

            {!isStrike && (
              <div className="second-shot-card">
                <h3>Second Ball Pin Deck</h3>
                <p className="helper-text">
                  Click the pins picked up on the spare attempt.
                </p>

                <PinDeck
                  knockedPins={currentEntry.secondShotKnockedPins}
                  availablePins={firstShotStandingPins}
                  onChange={(knockedPins) =>
                    updateCurrentEntry({ secondShotKnockedPins: knockedPins })
                  }
                />
              </div>
            )}

            <div className="shot-summary">
              <p>
                <strong>First Shot Count:</strong> {firstShotPinCount}
              </p>
              {!isStrike && (
                <p>
                  <strong>Second Shot Count:</strong> {secondShotPinCount}
                </p>
              )}
              <p>
                <strong>Frame Pin Count:</strong> {totalFramePinCount}
              </p>
              <p>
                <strong>Pins Standing After Frame:</strong>{" "}
                {pinsStandingAfterFrame.length === 0
                  ? "None"
                  : pinsStandingAfterFrame.join("-")}
              </p>
              <p>
                <strong>Result:</strong> {frameResult}
              </p>
            </div>
          </div>

          <div>
            <div className="form-grid compact-grid">
              <label>
                Ball Used
                <select
                  value={currentEntry.ballUsed}
                  onChange={(event) =>
                    updateCurrentEntry({ ballUsed: event.target.value })
                  }
                >
                  <option value="">Select ball</option>

                  {currentBowlerBalls.length === 0 && (
                    <option value="" disabled>
                      No balls in arsenal
                    </option>
                  )}

                  {currentBowlerBalls.map((ball) => (
                    <option key={ball.id} value={ball.name}>
                      {ball.name}
                      {ball.brand ? ` — ${ball.brand}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <BoardSelect
                label="Foot Board"
                value={currentEntry.footBoard}
                options={footBoardOptions}
                onChange={(value) => updateCurrentEntry({ footBoard: value })}
              />

              <BoardSelect
                label="Target Arrow"
                value={currentEntry.targetArrow}
                options={laneBoardOptions}
                onChange={(value) => updateCurrentEntry({ targetArrow: value })}
              />

              <BoardSelect
                label="Target Breakpoint"
                value={currentEntry.targetBreakpoint}
                options={laneBoardOptions}
                onChange={(value) =>
                  updateCurrentEntry({ targetBreakpoint: value })
                }
              />

              <BoardSelect
                label="Actual Arrow"
                value={currentEntry.actualArrow}
                options={laneBoardOptions}
                onChange={(value) => updateCurrentEntry({ actualArrow: value })}
              />

              <BoardSelect
                label="Actual Breakpoint"
                value={currentEntry.actualBreakpoint}
                options={laneBoardOptions}
                onChange={(value) =>
                  updateCurrentEntry({ actualBreakpoint: value })
                }
              />
            </div>
          </div>
        </div>

        <div className="frame-navigation">
          <button
            className="secondary-button"
            disabled={currentEntryIndex === 0}
            onClick={goToPreviousEntry}
          >
            ← Previous
          </button>

          <button
            className="secondary-button"
            disabled={currentEntryIndex >= maxUnlockedIndex}
            onClick={goToNextEntry}
          >
            Next →
          </button>

          <button
            className="primary-button"
            disabled={isGameComplete}
            onClick={completeCurrentEntry}
          >
            {isLastEntry ? "Complete Game" : "Complete Frame"}
          </button>
        </div>

        {isGameComplete && (
          <section className="post-game-actions">
            <h3>
              {isLastGameInSeries
                ? `${competitionType} Set Complete`
                : `Game ${gameDisplay} Complete`}
            </h3>

            <CompletedGamesList completedGames={completedGames} />

            <p className="success-text">
              {isLastGameInSeries
                ? "This series/block is complete. Save and exit when ready."
                : "Choose whether to exit or start another game in the same session."}
            </p>

            <div className="post-game-buttons">
              <button className="primary-button" onClick={handleSaveAndExit}>
                Save and Exit
              </button>

              {!isLastGameInSeries && (
                <button
                  className="secondary-button"
                  onClick={() => setShowNextGameSetup((current) => !current)}
                >
                  Start Another Game
                </button>
              )}
            </div>

            {showNextGameSetup && !isLastGameInSeries && (
              <div className="next-game-card">
                <label>
                  Next Pair/Lane
                  <select
                    value={nextLaneOrPair}
                    onChange={(event) => setNextLaneOrPair(event.target.value)}
                  >
                    {laneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="primary-button"
                  disabled={!nextLaneOrPair}
                  onClick={handleStartAnotherGame}
                >
                  Start Game {gameNumber + 1}
                  {isLimitedSeries ? `/${seriesGameCount}` : ""}
                </button>
              </div>
            )}
          </section>
        )}
      </section>
    </>
  );
}

function CompletedGamesList({
  completedGames,
}: {
  completedGames: CompletedGameSummary[];
}) {
  if (completedGames.length === 0) {
    return null;
  }

  return (
    <section className="completed-games-card">
      <h4>Completed Game Scores</h4>

      {completedGames.map((game) => (
        <div className="completed-game-row" key={game.gameNumber}>
          <div>
            <strong>Game {game.gameNumber}</strong>
            <p>{game.laneLabel}</p>
          </div>

          <div className="score-list">
            {game.scores.map((score) => (
              <p key={score.label}>
                <strong>{score.label}:</strong> {score.score}
              </p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function BoardSelect({ label, value, options, onChange }: BoardSelectProps) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Optional</option>
        {options.map((board) => (
          <option key={board} value={board}>
            {board}
          </option>
        ))}
      </select>
    </label>
  );
}

function getPinsStanding(knockedPins: number[]) {
  const allPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return allPins.filter((pin) => !knockedPins.includes(pin));
}

function getFrameResult(isStrike: boolean, pinsStandingAfterFrame: number[]) {
  if (isStrike) {
    return "Strike";
  }

  if (pinsStandingAfterFrame.length === 0) {
    return "Spare";
  }

  return "Open";
}

function formatLaneLabel(laneMode: string, laneOrPair: string) {
  return laneMode === "Pair" ? `Pair ${laneOrPair}` : `Lane ${laneOrPair}`;
}

function calculateScoresForGame(
  entries: FrameEntry[],
  bowlerNames: string[],
  format: BowlingFormat
): CompletedGameScore[] {
  if (format === "Baker") {
    return [
      {
        label: "Baker Team",
        score: scoreBowlingFrames(entries),
      },
    ];
  }

  return bowlerNames.map((bowlerName) => {
    const bowlerFrames = entries
      .filter((entry) => entry.bowlerName === bowlerName)
      .sort((a, b) => a.frameNumber - b.frameNumber)
      .slice(0, 10);

    return {
      label: bowlerName,
      score: scoreBowlingFrames(bowlerFrames),
    };
  });
}

function scoreBowlingFrames(frames: FrameEntry[]) {
  const rolls = frames.flatMap((frame) => {
    const firstShot = frame.firstShotKnockedPins.length;

    if (firstShot === 10) {
      return [10];
    }

    return [firstShot, frame.secondShotKnockedPins.length];
  });

  let score = 0;
  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame += 1) {
    const firstRoll = rolls[rollIndex] ?? 0;
    const secondRoll = rolls[rollIndex + 1] ?? 0;
    const thirdRoll = rolls[rollIndex + 2] ?? 0;

    if (firstRoll === 10) {
      score += 10 + secondRoll + thirdRoll;
      rollIndex += 1;
    } else if (firstRoll + secondRoll === 10) {
      score += 10 + thirdRoll;
      rollIndex += 2;
    } else {
      score += firstRoll + secondRoll;
      rollIndex += 2;
    }
  }

  return score;
}

function PinDeck({ knockedPins, onChange, availablePins }: PinDeckProps) {
  const pins = [
    { number: 7, left: 15, top: 15 },
    { number: 8, left: 38, top: 15 },
    { number: 9, left: 62, top: 15 },
    { number: 10, left: 85, top: 15 },

    { number: 4, left: 27, top: 38 },
    { number: 5, left: 50, top: 38 },
    { number: 6, left: 73, top: 38 },

    { number: 2, left: 38, top: 61 },
    { number: 3, left: 62, top: 61 },

    { number: 1, left: 50, top: 84 },
  ];

  const availablePinNumbers = availablePins ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  function togglePin(pinNumber: number) {
    if (!availablePinNumbers.includes(pinNumber)) {
      return;
    }

    if (knockedPins.includes(pinNumber)) {
      onChange(knockedPins.filter((pin) => pin !== pinNumber));
      return;
    }

    onChange([...knockedPins, pinNumber].sort((a, b) => a - b));
  }

  function selectAllPins() {
    onChange([...availablePinNumbers].sort((a, b) => a - b));
  }

  function clearPins() {
    onChange([]);
  }

  return (
    <div>
      <div className="pin-deck">
        {pins.map((pin) => {
          const isAvailable = availablePinNumbers.includes(pin.number);
          const isKnocked = knockedPins.includes(pin.number);

          return (
            <button
              key={pin.number}
              type="button"
              className={`pin-button ${isKnocked ? "knocked" : ""} ${
                !isAvailable ? "unavailable" : ""
              }`}
              disabled={!isAvailable}
              style={{
                left: `${pin.left}%`,
                top: `${pin.top}%`,
              }}
              onClick={() => togglePin(pin.number)}
              title={
                isKnocked
                  ? `Pin ${pin.number} knocked down`
                  : `Pin ${pin.number} standing`
              }
            >
              {pin.number}
            </button>
          );
        })}
      </div>

      <div className="pin-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={selectAllPins}
        >
          Select All
        </button>

        <button type="button" className="secondary-button" onClick={clearPins}>
          Clear
        </button>
      </div>
    </div>
  );
}

function StatsPage() {
  return (
    <>
      <h2>Stats</h2>
      <p>
        View averages, strike percentage, spare percentage, ball stats, pattern
        stats, filters, tables, graphs, and exports.
      </p>
    </>
  );
}

function CentersPage({ centers, setCenters }: CentersPageProps) {
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterLaneCount, setNewCenterLaneCount] = useState("8");
  const [newCenterNotes, setNewCenterNotes] = useState("");
  const [centerDrafts, setCenterDrafts] = useState<Record<number, Center>>({});

  function getCenterDraft(center: Center) {
    return centerDrafts[center.id] ?? center;
  }

  function hasCenterChanged(center: Center) {
    const draft = centerDrafts[center.id];

    if (!draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(center);
  }

  function updateCenterDraft(center: Center, updates: Partial<Center>) {
    setCenterDrafts((currentDrafts) => ({
      ...currentDrafts,
      [center.id]: {
        ...getCenterDraft(center),
        ...updates,
      },
    }));
  }

  function saveCenter(centerId: number) {
    const draft = centerDrafts[centerId];

    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Center name cannot be empty.");
      return;
    }

    if (!Number.isFinite(draft.laneCount) || draft.laneCount < 1) {
      window.alert("Lane count must be at least 1.");
      return;
    }

    const nameAlreadyExists = centers.some(
      (center) =>
        center.id !== centerId &&
        center.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowling center with that name already exists.");
      return;
    }

    setCenters((currentCenters) =>
      currentCenters.map((center) =>
        center.id === centerId
          ? {
              ...draft,
              name: trimmedName,
              laneCount: Math.max(1, Math.floor(draft.laneCount)),
              notes: draft.notes.trim(),
            }
          : center
      )
    );

    setCenterDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[centerId];
      return updatedDrafts;
    });
  }

  function addCenter() {
    const trimmedName = newCenterName.trim();
    const laneCount = Number(newCenterLaneCount);

    if (!trimmedName || !Number.isFinite(laneCount) || laneCount < 1) {
      return;
    }

    const nameAlreadyExists = centers.some(
      (center) => center.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A bowling center with that name already exists.");
      return;
    }

    setCenters((currentCenters) => [
      ...currentCenters,
      {
        id: Date.now(),
        name: trimmedName,
        laneCount: Math.floor(laneCount),
        notes: newCenterNotes.trim(),
      },
    ]);

    setNewCenterName("");
    setNewCenterLaneCount("8");
    setNewCenterNotes("");
  }

  function deleteCenter(centerId: number) {
    const center = centers.find((currentCenter) => currentCenter.id === centerId);

    if (!center) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${center.name}? This will remove it from center selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setCenters((currentCenters) =>
      currentCenters.filter((currentCenter) => currentCenter.id !== centerId)
    );

    setCenterDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[centerId];
      return updatedDrafts;
    });
  }

  return (
    <>
      <h2>Bowling Centers</h2>
      <p>
        Add bowling centers and lane counts. Log Games uses this lane count to
        generate single-lane and pair dropdowns automatically.
      </p>

      <section className="center-form-card">
        <h3>Add Bowling Center</h3>

        <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newCenterName}
              onChange={(event) => setNewCenterName(event.target.value)}
              placeholder="Example: Titan Bowl"
            />
          </label>

          <label>
            Number of Lanes <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newCenterLaneCount}
              onChange={(event) => setNewCenterLaneCount(event.target.value)}
              placeholder="Example: 8"
            />
          </label>

          <label>
            Notes
            <textarea
              value={newCenterNotes}
              onChange={(event) => setNewCenterNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

        <button
          className="primary-button"
          disabled={!newCenterName.trim() || Number(newCenterLaneCount) < 1}
          onClick={addCenter}
        >
          Add Center
        </button>
      </section>

      <section className="center-list">
        {centers.map((center) => {
          const draftCenter = getCenterDraft(center);
          const isDirty = hasCenterChanged(center);

          return (
            <details className="center-card" key={center.id}>
              <summary className="center-summary">
                <div>
                  <strong>{center.name}</strong>
                  <p>
                    {center.laneCount} lane{center.laneCount === 1 ? "" : "s"}
                  </p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="center-details-content">
                <div className="center-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveCenter(center.id)}
                  >
                    Save Center
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteCenter(center.id)}
                  >
                    Delete Center
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftCenter.name}
                      onChange={(event) =>
                        updateCenterDraft(center, { name: event.target.value })
                      }
                    />
                  </label>

                  <label>
                    Number of Lanes
                    <input
                      type="number"
                      min="1"
                      value={draftCenter.laneCount}
                      onChange={(event) =>
                        updateCenterDraft(center, {
                          laneCount: Math.max(
                            1,
                            Math.floor(Number(event.target.value))
                          ),
                        })
                      }
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftCenter.notes}
                      onChange={(event) =>
                        updateCenterDraft(center, { notes: event.target.value })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="lane-preview-card">
                  <h4>Generated Lane Options</h4>
                  <p>
                    <strong>Single Lane Mode:</strong> Lanes 1 through{" "}
                    {draftCenter.laneCount}
                  </p>
                  <p>
                    <strong>Pair Mode:</strong>{" "}
                    {Math.floor(draftCenter.laneCount / 2) > 0
                      ? `Pairs 1/2 through ${
                          Math.floor(draftCenter.laneCount / 2) * 2 - 1
                        }/${Math.floor(draftCenter.laneCount / 2) * 2}`
                      : "No pairs available"}
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}

function EventsPage({
  events,
  setEvents,
  centers,
  patterns,
}: EventsPageProps) {
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<"League" | "Tournament">(
    "League"
  );
  const [newSeriesGameCount, setNewSeriesGameCount] = useState("3");
  const [newScheduleUnit, setNewScheduleUnit] =
    useState<EventScheduleUnit>("Weeks");
  const [newScheduleCount, setNewScheduleCount] = useState("12");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newCenterId, setNewCenterId] = useState("");
  const [newPatternId, setNewPatternId] = useState("0");
  const [newNotes, setNewNotes] = useState("");
  const [eventDrafts, setEventDrafts] = useState<Record<number, EventSetup>>(
    {}
  );

  function getEventDraft(event: EventSetup) {
    return eventDrafts[event.id] ?? event;
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

    if (!centers.some((center) => center.id === draft.centerId)) {
      window.alert("Choose a valid bowling center.");
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
              scheduleCount: Math.max(1, Math.floor(draft.scheduleCount)),
              startDate: draft.startDate,
              endDate: draft.endDate,
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
    const scheduleCount = Number(newScheduleCount);
    const centerId = Number(newCenterId);
    const patternId = Number(newPatternId);

    if (
      !trimmedName ||
      !Number.isFinite(seriesGameCount) ||
      seriesGameCount < 1 ||
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

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: Date.now(),
        name: trimmedName,
        eventType: newEventType,
        seriesGameCount: Math.floor(seriesGameCount),
        scheduleUnit: newScheduleUnit,
        scheduleCount: Math.floor(scheduleCount),
        startDate: newStartDate,
        endDate: newEndDate,
        centerId,
        patternId: Number.isFinite(patternId) ? patternId : 0,
        notes: newNotes.trim(),
      },
    ]);

    setNewEventName("");
    setNewEventType("League");
    setNewSeriesGameCount("3");
    setNewScheduleUnit("Weeks");
    setNewScheduleCount("12");
    setNewStartDate("");
    setNewEndDate("");
    setNewCenterId("");
    setNewPatternId("0");
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

  function getPatternName(patternId: number) {
    return (
      patterns.find((pattern) => pattern.id === patternId)?.name ??
      "Unknown Pattern"
    );
  }

  function getScheduleLabel(event: EventSetup) {
    return `${event.scheduleCount} ${event.scheduleUnit.toLowerCase()}`;
  }

  function formatEventSummary(event: EventSetup) {
    return `${event.eventType} • ${event.seriesGameCount} game${
      event.seriesGameCount === 1 ? "" : "s"
    } • ${getScheduleLabel(event)} • ${getCenterName(event.centerId)}`;
  }

  const canAddEvent =
    newEventName.trim() !== "" &&
    Number(newSeriesGameCount) >= 1 &&
    Number(newScheduleCount) >= 1 &&
    newCenterId !== "";

  return (
    <>
      <h2>Tournaments / Leagues</h2>
      <p>
        Create leagues and tournaments so Log Games can pull the center, pattern,
        number of games in the set/block, and exact week/day automatically.
      </p>

      <section className="event-form-card">
        <h3>Add League / Tournament</h3>

        <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newEventName}
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
            Games in Series/Block <span className="required">*</span>
            <input
              type="number"
              min="1"
              value={newSeriesGameCount}
              onChange={(event) => setNewSeriesGameCount(event.target.value)}
              placeholder="Example: 3"
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
            Pattern
            <select
              value={newPatternId}
              onChange={(event) => setNewPatternId(event.target.value)}
            >
              {patterns.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {pattern.name}
                </option>
              ))}
            </select>
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

        <button
          className="primary-button"
          disabled={!canAddEvent}
          onClick={addEvent}
        >
          Add Event
        </button>
      </section>

      <section className="event-list">
        {events.map((event) => {
          const draftEvent = getEventDraft(event);
          const isDirty = hasEventChanged(event);

          return (
            <details className="event-card" key={event.id}>
              <summary className="event-summary">
                <div>
                  <strong>{event.name}</strong>
                  <p>{formatEventSummary(event)}</p>
                  {isDirty && <p className="unsaved-text">Unsaved changes</p>}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="event-details-content">
                <div className="event-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => saveEvent(event.id)}
                  >
                    Save Event
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deleteEvent(event.id)}
                  >
                    Delete Event
                  </button>
                </div>

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
                    Pattern
                    <select
                      value={draftEvent.patternId}
                      onChange={(inputEvent) =>
                        updateEventDraft(event, {
                          patternId: Number(inputEvent.target.value),
                        })
                      }
                    >
                      {patterns.map((pattern) => (
                        <option key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </option>
                      ))}
                    </select>
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
                    <strong>Games in Series/Block:</strong>{" "}
                    {draftEvent.seriesGameCount}
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
                    <strong>Pattern:</strong>{" "}
                    {getPatternName(draftEvent.patternId)}
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
function PatternsPage({ patterns, setPatterns }: PatternsPageProps) {
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternLength, setNewPatternLength] = useState("");
  const [newPatternVolume, setNewPatternVolume] = useState("");
  const [newPatternRatio, setNewPatternRatio] = useState("");
  const [newPatternDropBrush, setNewPatternDropBrush] = useState("");
  const [newPatternSource, setNewPatternSource] = useState("");
  const [newPatternNotes, setNewPatternNotes] = useState("");
  const [patternDrafts, setPatternDrafts] = useState<Record<number, Pattern>>(
    {}
  );

  function getPatternDraft(pattern: Pattern) {
    return patternDrafts[pattern.id] ?? pattern;
  }

  function hasPatternChanged(pattern: Pattern) {
    const draft = patternDrafts[pattern.id];

    if (!draft) {
      return false;
    }

    return (
      draft.name !== pattern.name ||
      draft.length !== pattern.length ||
      draft.volume !== pattern.volume ||
      draft.ratio !== pattern.ratio ||
      draft.dropBrush !== pattern.dropBrush ||
      draft.source !== pattern.source ||
      draft.notes !== pattern.notes
    );
  }

  function updatePatternDraft(pattern: Pattern, updates: Partial<Pattern>) {
    setPatternDrafts((currentDrafts) => ({
      ...currentDrafts,
      [pattern.id]: {
        ...getPatternDraft(pattern),
        ...updates,
      },
    }));
  }

  function savePattern(patternId: number) {
    const draft = patternDrafts[patternId];

    if (!draft) {
      return;
    }

    setPatterns((currentPatterns) =>
      currentPatterns.map((pattern) =>
        pattern.id === patternId ? { ...draft } : pattern
      )
    );

    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function addPattern() {
    const trimmedName = newPatternName.trim();

    if (!trimmedName) {
      return;
    }

    const nameAlreadyExists = patterns.some(
      (pattern) => pattern.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameAlreadyExists) {
      window.alert("A pattern with that name already exists.");
      return;
    }

    setPatterns((currentPatterns) => [
      ...currentPatterns,
      {
        id: Date.now(),
        name: trimmedName,
        length: newPatternLength.trim(),
        volume: newPatternVolume.trim(),
        ratio: newPatternRatio.trim(),
        dropBrush: newPatternDropBrush.trim(),
        source: newPatternSource.trim(),
        notes: newPatternNotes.trim(),
      },
    ]);

    setNewPatternName("");
    setNewPatternLength("");
    setNewPatternVolume("");
    setNewPatternRatio("");
    setNewPatternDropBrush("");
    setNewPatternSource("");
    setNewPatternNotes("");
  }

  function deletePattern(patternId: number) {
    const pattern = patterns.find(
      (currentPattern) => currentPattern.id === patternId
    );

    if (!pattern) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${pattern.name}? This will remove it from pattern selection.`
    );

    if (!shouldDelete) {
      return;
    }

    setPatterns((currentPatterns) =>
      currentPatterns.filter(
        (currentPattern) => currentPattern.id !== patternId
      )
    );

    setPatternDrafts((currentDrafts) => {
      const updatedDrafts = { ...currentDrafts };
      delete updatedDrafts[patternId];
      return updatedDrafts;
    });
  }

  function formatPatternSummary(pattern: Pattern) {
    const details = [
      pattern.length ? `${pattern.length} ft` : "",
      pattern.volume ? `${pattern.volume} mL` : "",
      pattern.ratio ? `${pattern.ratio}:1` : "",
    ].filter(Boolean);

    return details.length > 0 ? details.join(" • ") : "No specs entered";
  }

  return (
    <>
      <h2>Patterns</h2>
      <p>
        Add oil patterns with length, volume, ratio, drop brush, source, and
        notes. Log Games will use this list when selecting a pattern.
      </p>

      <section className="pattern-form-card">
        <h3>Add Pattern</h3>

        <div className="form-grid">
          <label>
            Name <span className="required">*</span>
            <input
              value={newPatternName}
              onChange={(event) => setNewPatternName(event.target.value)}
              placeholder="Example: 2025 PBA Wolf"
            />
          </label>

          <label>
            Length
            <input
              value={newPatternLength}
              onChange={(event) => setNewPatternLength(event.target.value)}
              placeholder="Example: 32"
            />
          </label>

          <label>
            Volume
            <input
              value={newPatternVolume}
              onChange={(event) => setNewPatternVolume(event.target.value)}
              placeholder="Example: 28.5"
            />
          </label>

          <label>
            Ratio
            <input
              value={newPatternRatio}
              onChange={(event) => setNewPatternRatio(event.target.value)}
              placeholder="Example: 2.0"
            />
          </label>

          <label>
            Drop Brush
            <input
              value={newPatternDropBrush}
              onChange={(event) => setNewPatternDropBrush(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Source
            <input
              value={newPatternSource}
              onChange={(event) => setNewPatternSource(event.target.value)}
              placeholder="Example: Kegel, PBA, custom"
            />
          </label>

          <label>
            Notes
            <textarea
              value={newPatternNotes}
              onChange={(event) => setNewPatternNotes(event.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </label>
        </div>

        <button
          className="primary-button"
          disabled={!newPatternName.trim()}
          onClick={addPattern}
        >
          Add Pattern
        </button>
      </section>

      <section className="pattern-list">
        {patterns.map((pattern) => {
          const draftPattern = getPatternDraft(pattern);
          const isDirty = hasPatternChanged(pattern);

          return (
            <details className="pattern-card" key={pattern.id}>
              <summary className="pattern-summary">
                <div>
                  <strong>{pattern.name}</strong>
                  <p>{formatPatternSummary(pattern)}</p>
                  {isDirty && (
                    <p className="unsaved-text">Unsaved changes</p>
                  )}
                </div>

                <span className="summary-hint">Open Details</span>
              </summary>

              <div className="pattern-details-content">
                <div className="pattern-actions-row">
                  <button
                    className="save-button"
                    disabled={!isDirty}
                    onClick={() => savePattern(pattern.id)}
                  >
                    Save Pattern
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => deletePattern(pattern.id)}
                  >
                    Delete Pattern
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={draftPattern.name}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          name: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    Length
                    <input
                      value={draftPattern.length}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          length: event.target.value,
                        })
                      }
                      placeholder="Example: 32"
                    />
                  </label>

                  <label>
                    Volume
                    <input
                      value={draftPattern.volume}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          volume: event.target.value,
                        })
                      }
                      placeholder="Example: 28.5"
                    />
                  </label>

                  <label>
                    Ratio
                    <input
                      value={draftPattern.ratio}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          ratio: event.target.value,
                        })
                      }
                      placeholder="Example: 2.0"
                    />
                  </label>

                  <label>
                    Drop Brush
                    <input
                      value={draftPattern.dropBrush}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          dropBrush: event.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    Source
                    <input
                      value={draftPattern.source}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          source: event.target.value,
                        })
                      }
                      placeholder="Example: Kegel, PBA, custom"
                    />
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={draftPattern.notes}
                      onChange={(event) =>
                        updatePatternDraft(pattern, {
                          notes: event.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                <section className="pattern-preview-card">
                  <h4>Pattern Summary</h4>
                  <p>
                    <strong>Length:</strong>{" "}
                    {draftPattern.length
                      ? `${draftPattern.length} ft`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Volume:</strong>{" "}
                    {draftPattern.volume
                      ? `${draftPattern.volume} mL`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Ratio:</strong>{" "}
                    {draftPattern.ratio
                      ? `${draftPattern.ratio}:1`
                      : "Not entered"}
                  </p>
                  <p>
                    <strong>Drop Brush:</strong>{" "}
                    {draftPattern.dropBrush || "Not entered"}
                  </p>
                  <p>
                    <strong>Source:</strong>{" "}
                    {draftPattern.source || "Not entered"}
                  </p>
                </section>
              </div>
            </details>
          );
        })}
      </section>
    </>
  );
}
export default App;