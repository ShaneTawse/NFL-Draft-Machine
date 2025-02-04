const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const dbPath = './database.db';
const draftFilePath = 'Full 2025 NFL Draft Order.txt';
const teamsFilePath = 'Teams List.md';

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
        return;
    }
    console.log('Connected to the database.');
});

// **Initialize Draft Order Using the Text File**
let draftOrder = [];
let teamList = [];

// Function to load the draft order from the file
function loadDraftOrderSync() {
    try {
        const data = fs.readFileSync(draftFilePath, 'utf8');
        console.log('Raw file content:', data); // Log the raw file content

        // Process the file content (each line should be a team name)
        draftOrder = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log('Draft order loaded:', draftOrder);
    } catch (err) {
        console.error("Error reading the draft order file:", err);
    }
}

// Function to load the team list from the file
function loadTeamListSync() {
    try {
        const data = fs.readFileSync(teamsFilePath, 'utf8');
        console.log('Raw file content:', data); // Log the raw file content

        // Process the file content (each line should be a team name)
        teamList = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log('Team list loaded:', teamList);
    } catch (err) {
        console.error("Error reading the team list file:", err);
    }
}

// Load the draft order and team list synchronously before starting the server
loadDraftOrderSync();
loadTeamListSync();

// **Team List Route**
app.get('/teams', (req, res) => {
    res.json(teamList.map((name, index) => ({ id: index + 1, name })));
});

// **Draft Order Route**
app.get('/draft', (req, res) => {
    res.json(draftOrder);
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

app.get('/players', (req, res) => {
    db.all("SELECT * FROM players", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
