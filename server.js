const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const dbPath = './database.db';

app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Delete the existing database file if it exists
try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
} catch (err) {
    console.error('Error deleting the database file:', err.message);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
        return;
    }
    console.log('Connected to the database.');

    // Initialize the database
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, logo TEXT NOT NULL)`);
        db.run(`CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY AUTOINCREMENT, rank INTEGER NOT NULL, cng TEXT, prospect TEXT NOT NULL, college TEXT, position TEXT NOT NULL, height TEXT, weight TEXT, eligibility TEXT, dr TEXT, speed INTEGER, strength INTEGER, mental_processing INTEGER)`);
        db.run(`CREATE TABLE IF NOT EXISTS picks (id INTEGER PRIMARY KEY AUTOINCREMENT, team_id INTEGER NOT NULL, player_id INTEGER NOT NULL, FOREIGN KEY(team_id) REFERENCES teams(id), FOREIGN KEY(player_id) REFERENCES players(id))`);

        console.log('Database schema created.');

        // Seed initial data
        db.run("DELETE FROM teams");
        db.run("DELETE FROM players");
        db.run("DELETE FROM picks");
        db.run(`INSERT INTO teams (name, logo) VALUES 
            ('Arizona Cardinals', 'arizona-cardinals-logo.png'), 
            ('Atlanta Falcons', 'atlanta-falcons-logo.png'), 
            ('Baltimore Ravens', 'baltimore-ravens-logo.png'), 
            ('Buffalo Bills', 'buffalo-bills-logo.png'), 
            ('Carolina Panthers', 'carolina-panthers-logo.png'), 
            ('Chicago Bears', 'chicago-bears-logo.png'), 
            ('Cincinnati Bengals', 'cincinnati-bengals-logo.png'), 
            ('Cleveland Browns', 'cleveland-browns-logo.png'), 
            ('Dallas Cowboys', 'dallas-cowboys-logo.png'), 
            ('Denver Broncos', 'denver-broncos-logo.png'), 
            ('Detroit Lions', 'detroit-lions-logo.png'), 
            ('Green Bay Packers', 'green-bay-packers-logo.png'), 
            ('Houston Texans', 'houston-texans-logo.png'), 
            ('Indianapolis Colts', 'indianapolis-colts-logo.png'), 
            ('Jacksonville Jaguars', 'jacksonville-jaguars-logo.png'), 
            ('Kansas City Chiefs', 'kansas-city-chiefs-logo.png'), 
            ('Las Vegas Raiders', 'las-vegas-raiders-logo.png'), 
            ('Los Angeles Chargers', 'los-angeles-chargers-logo.png'), 
            ('Los Angeles Rams', 'los-angeles-rams-logo.png'), 
            ('Miami Dolphins', 'miami-dolphins-logo.png'), 
            ('Minnesota Vikings', 'minnesota-vikings-logo.png'), 
            ('New England Patriots', 'new-england-patriots-logo.png'), 
            ('New Orleans Saints', 'new-orleans-saints-logo.png'), 
            ('New York Giants', 'new-york-giants-logo.png'), 
            ('New York Jets', 'new-york-jets-logo.png'), 
            ('Philadelphia Eagles', 'philadelphia-eagles-logo.png'), 
            ('Pittsburgh Steelers', 'pittsburgh-steelers-logo.png'), 
            ('San Francisco 49ers', 'san-francisco-49ers-logo.png'), 
            ('Seattle Seahawks', 'seattle-seahawks-logo.png'), 
            ('Tampa Bay Buccaneers', 'tampa-bay-buccaneers-logo.png'), 
            ('Tennessee Titans', 'tennessee-titans-logo.png'), 
            ('Washington Commanders', 'washington-commanders-logo.png')`);

        const players = parsePlayersFile();
        const stmt = db.prepare(
            `INSERT INTO players 
            (rank, cng, prospect, college, position, height, weight, eligibility, dr, speed, strength, mental_processing) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        players.forEach(player => {
            stmt.run(
                player.Rank,
                player.CNG,
                player.Prospect,
                player.College,
                player.P1,
                player.Ht,
                player.Wt,
                player.Elig,
                player.DR,
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100),
                Math.floor(Math.random() * 100)
            );
        });
        stmt.finalize();
    });
});

// API Endpoints
app.get('/teams', (req, res) => {
    db.all("SELECT * FROM teams", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/players', (req, res) => {
    db.all("SELECT * FROM players", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/draft', (req, res) => {
    const { teamId, playerId } = req.body;
    db.run("INSERT INTO picks (team_id, player_id) VALUES (?, ?)", [teamId, playerId], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.get('/draft-board', (req, res) => {
    db.all(
        `SELECT players.prospect AS player, teams.name AS team
         FROM picks
         JOIN players ON picks.player_id = players.id
         JOIN teams ON picks.team_id = teams.id`,
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Read and parse the Players.log file
function parsePlayersFile() {
    const data = fs.readFileSync('./Players.log', 'utf8');
    const lines = data.split('\n');
    const headers = lines[0].split('\t');
    const players = lines.slice(1).map(line => {
        const values = line.split('\t');
        const player = {};
        headers.forEach((header, index) => {
            const value = values[index];
            player[header.trim()] = value ? value.trim() : '';
        });
        return player;
    });
    return players;
}
