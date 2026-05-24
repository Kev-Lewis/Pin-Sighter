CREATE TABLE IF NOT EXISTS bowlers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    handedness TEXT NOT NULL CHECK (handedness IN ('right', 'left')),
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS balls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bowler_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    weight_lbs INTEGER,
    surface TEXT,
    layout_notes TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bowler_id) REFERENCES bowlers(id)
);

CREATE TABLE IF NOT EXISTS centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lane_count INTEGER NOT NULL,
    surface_type TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    length_ft INTEGER,
    volume_ml REAL,
    ratio REAL,
    drop_brush_ft INTEGER,
    forward_volume_ml REAL,
    reverse_volume_ml REAL,
    oil_type TEXT,
    source TEXT,
    difficulty TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('open', 'league', 'tournament')),
    start_date TEXT,
    end_date TEXT,
    number_of_days INTEGER,
    number_of_weeks INTEGER,
    center_id INTEGER,
    pattern_id INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (center_id) REFERENCES centers(id),
    FOREIGN KEY (pattern_id) REFERENCES patterns(id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    center_id INTEGER NOT NULL,
    pattern_id INTEGER,
    session_date TEXT NOT NULL,
    competition_type TEXT NOT NULL CHECK (competition_type IN ('open', 'league', 'tournament')),
    format TEXT NOT NULL CHECK (format IN ('singles', 'doubles', 'trios', 'fours', 'fives', 'baker', 'practice')),
    lane_mode TEXT NOT NULL CHECK (lane_mode IN ('single', 'pair')),
    starting_lane INTEGER NOT NULL,
    ending_lane INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (center_id) REFERENCES centers(id),
    FOREIGN KEY (pattern_id) REFERENCES patterns(id)
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    bowler_id INTEGER,
    game_number INTEGER NOT NULL,
    is_baker INTEGER NOT NULL DEFAULT 0,
    team_name TEXT,
    final_score INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (bowler_id) REFERENCES bowlers(id)
);

CREATE TABLE IF NOT EXISTS shots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    bowler_id INTEGER NOT NULL,

    frame_number INTEGER NOT NULL,
    shot_number INTEGER NOT NULL,

    lane_number INTEGER,
    ball_id INTEGER,

    foot_board REAL,
    target_arrow_board REAL,
    target_breakpoint_board REAL,
    actual_arrow_board REAL,
    actual_breakpoint_board REAL,

    pins_before TEXT,
    pins_left TEXT NOT NULL,
    pin_count INTEGER NOT NULL,

    shot_result TEXT,
    notes TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (bowler_id) REFERENCES bowlers(id),
    FOREIGN KEY (ball_id) REFERENCES balls(id)
);