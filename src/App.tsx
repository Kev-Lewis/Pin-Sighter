import { useMemo, useState } from "react";
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

type Center = {
  id: number;
  name: string;
  laneCount: number;
};

type Pattern = {
  id: number;
  name: string;
};

type EventSetup = {
  id: number;
  name: string;
  eventType: "League" | "Tournament";
  seriesGameCount: number;
  centerId: number;
  patternId: number;
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

type GameEntryPageProps = {
  bowlerNames: string[];
  competitionType: CompetitionType;
  format: BowlingFormat;
  centerName: string;
  patternName: string;
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

const tabs: { id: Tab; label: string }[] = [
  { id: "log-games", label: "Log Games" },
  { id: "stats", label: "Stats" },
  { id: "bowlers", label: "Bowlers" },
  { id: "centers", label: "Bowling Centers" },
  { id: "events", label: "Tournaments / Leagues" },
  { id: "patterns", label: "Patterns" },
];

const temporaryCenters: Center[] = [
  { id: 1, name: "Titan Bowl", laneCount: 8 },
  { id: 2, name: "Bowlero Fullerton", laneCount: 40 },
  { id: 3, name: "Temporary 24 Lane Center", laneCount: 24 },
];

const temporaryPatterns: Pattern[] = [
  { id: 0, name: "Unknown / House Shot" },
  { id: 1, name: "Custom Pattern" },
  { id: 2, name: "2025 PBA Wolf" },
];

const temporaryEvents: EventSetup[] = [
  {
    id: 1,
    name: "Tuesday Night League",
    eventType: "League",
    seriesGameCount: 3,
    centerId: 1,
    patternId: 0,
  },
  {
    id: 2,
    name: "Sport Shot League",
    eventType: "League",
    seriesGameCount: 4,
    centerId: 2,
    patternId: 1,
  },
  {
    id: 3,
    name: "Wolf Qualifying Block",
    eventType: "Tournament",
    seriesGameCount: 5,
    centerId: 2,
    patternId: 2,
  },
  {
    id: 4,
    name: "Scratch Sweeper",
    eventType: "Tournament",
    seriesGameCount: 3,
    centerId: 3,
    patternId: 0,
  },
];

const temporaryBowlers = [
  "Kevin",
  "Bowler 2",
  "Bowler 3",
  "Bowler 4",
  "Bowler 5",
];

const temporaryBalls = ["Venom Shock", "IQ Tour", "Spare Ball"];

const footBoardOptions = Array.from({ length: 81 }, (_, index) => index - 20);
const laneBoardOptions = Array.from({ length: 39 }, (_, index) => index + 1);

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

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

          {activeTab === "log-games" && <LogGamesPage />}
          {activeTab === "stats" && <StatsPage />}
          {activeTab === "bowlers" && <BowlersPage />}
          {activeTab === "centers" && <CentersPage />}
          {activeTab === "events" && <EventsPage />}
          {activeTab === "patterns" && <PatternsPage />}
        </section>
      )}
    </main>
  );
}

function LogGamesPage() {
  const [showGameEntry, setShowGameEntry] = useState(false);

  const [competitionType, setCompetitionType] =
    useState<CompetitionType>("Open");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [format, setFormat] = useState<BowlingFormat>("Singles");
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [selectedPatternId, setSelectedPatternId] = useState("0");
  const [laneMode, setLaneMode] = useState("Pair");
  const [startingLaneOrPair, setStartingLaneOrPair] = useState("");
  const [selectedBowlers, setSelectedBowlers] = useState<string[]>([""]);

  const isOpen = competitionType === "Open";
  const isLimitedSeries = !isOpen;

  const availableEvents = temporaryEvents.filter(
    (event) => event.eventType === competitionType
  );

  const selectedEvent = temporaryEvents.find(
    (event) => String(event.id) === selectedEventId
  );

  const selectedCenter = isOpen
    ? temporaryCenters.find((center) => String(center.id) === selectedCenterId)
    : temporaryCenters.find((center) => center.id === selectedEvent?.centerId);

  const selectedPattern = isOpen
    ? temporaryPatterns.find(
        (pattern) => String(pattern.id) === selectedPatternId
      )
    : temporaryPatterns.find(
        (pattern) => pattern.id === selectedEvent?.patternId
      );

  const seriesGameCount = isLimitedSeries
    ? selectedEvent?.seriesGameCount ?? null
    : null;

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

  const canStartGame =
    hasRequiredEvent &&
    selectedCenter !== undefined &&
    startingLaneOrPair !== "" &&
    hasEnoughBowlers &&
    !hasDuplicateBowlers;

  const bowlersForGame = format === "Baker" ? activeBowlers : selectedBowlers;

  if (showGameEntry) {
    return (
      <GameEntryPage
        bowlerNames={bowlersForGame}
        competitionType={competitionType}
        format={format}
        centerName={selectedCenter?.name ?? "Unknown Center"}
        patternName={selectedPattern?.name ?? "Unknown Pattern"}
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

                {temporaryCenters.map((center) => (
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
                {temporaryPatterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </label>
          </>
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

                  {temporaryBowlers.map((bowler) => (
                    <option
                      key={bowler}
                      value={bowler}
                      disabled={
                        selectedBowlers.includes(bowler) &&
                        selectedBowlers[index] !== bowler
                      }
                    >
                      {bowler}
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
            : `Select a ${competitionType.toLowerCase()}, starting pair/lane, and complete the bowler order to begin.`}
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

function GameEntryPage({
  bowlerNames,
  competitionType,
  format,
  centerName,
  patternName,
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
                  {temporaryBalls.map((ball) => (
                    <option key={ball} value={ball}>
                      {ball}
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

function BowlersPage() {
  return (
    <>
      <h2>Bowlers</h2>
      <p>Add bowlers, handedness, arsenal, and notes.</p>
    </>
  );
}

function CentersPage() {
  return (
    <>
      <h2>Bowling Centers</h2>
      <p>
        Add centers and lane counts so lane choices can be generated
        automatically.
      </p>
    </>
  );
}

function EventsPage() {
  return (
    <>
      <h2>Tournaments / Leagues</h2>
      <p>Create leagues, tournaments, dates, centers, patterns, and formats.</p>
    </>
  );
}

function PatternsPage() {
  return (
    <>
      <h2>Patterns</h2>
      <p>
        Add pattern name, length, volume, ratio, drop brush, source, and notes.
      </p>
    </>
  );
}

export default App;