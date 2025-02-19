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
const teamPositionNeedsFilePath = path.join(__dirname, 'Team Position Needs.txt');
const coachesFilePath = path.join(__dirname, 'Coaches.txt');


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
let teamPositionNeeds = {};


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


// Route to get coaches for a specific team
app.get('/getCoaches', (req, res) => {
    const team = req.query.team;

    if (!team) {
        return res.status(400).json({ error: 'Team is required' });
    }

    // Read the Coaches.txt file using the coachesFilePath variable
    fs.readFile(coachesFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading the coaches file' });
        }

        // Process and send coach data
        const teamData = extractCoachesForTeam(data, team);
        
        if (!teamData) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Send back the coaches' data as JSON
        res.json(teamData);
    });
});

// Function to extract coaches for a specific team
function extractCoachesForTeam(data, team) {
    // Normalize the team input to lowercase and trim extra spaces
    const normalizedTeam = team.trim().toLowerCase();

    // Regex to capture the coach data for the team
    const teamRegex = new RegExp(`^\\s*${normalizedTeam}\\s*:\\s*([\\s\\S]*?)(?=\\n\\w+:|$)`, 'im');

    // Find the team and extract coach info
    const teamMatch = data.match(teamRegex);

    if (!teamMatch) {
        return null;  // Team not found
    }

    const coachesText = teamMatch[1];

    // Parse the coaches' details
    const coaches = {};
    const lines = coachesText.trim().split(',');

    // Loop through each line to extract coach data
    lines.forEach(line => {
        if (line.includes('headCoach:')) {
            coaches.headCoach = line.replace('headCoach:', '').trim();
        }
        if (line.includes('offensiveCoordinator:')) {
            coaches.offensiveCoordinator = line.replace('offensiveCoordinator:', '').trim();
        }
        if (line.includes('defensiveCoordinator:')) {
            coaches.defensiveCoordinator = line.replace('defensiveCoordinator:', '').trim();
        }
    });

    return coaches;
}


function loadTeamPositionNeedsSync() {
    try {
        const data = fs.readFileSync(teamPositionNeedsFilePath, 'utf8');
        console.log('Raw position needs file content:', data); // Log raw content for debugging

        const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Loop through each line and map teams to their position needs
        for (let i = 0; i < lines.length; i++) {
            const teamLine = lines[i];
            const teamName = teamLine.split(':')[0].trim();
            const positions = teamLine.split(':')[1].split(',').map(pos => pos.trim());

            teamPositionNeeds[teamName] = positions;
        }
        console.log('Team position needs loaded:', teamPositionNeeds);
    } catch (err) {
        console.error("Error reading the team position needs file:", err);
    }
}


// Load the draft order, team list, and team position needs synchronously before starting the server
loadDraftOrderSync();
loadTeamListSync();
loadTeamPositionNeedsSync();

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

// **Team Position Needs Route**
app.get('/team-position-needs/:teamName', (req, res) => {
    const teamName = req.params.teamName;

    if (teamPositionNeeds[teamName]) {
        res.json({ positions: teamPositionNeeds[teamName] });
    } else {
        res.status(404).json({ error: 'Team not found or no position needs available' });
    }
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


// Endpoint to get team news from teamReading.txt
app.get('/teams-news', (req, res) => {
    const teamName = req.query.team;
    if (!teamName) {
        return res.status(400).json({ error: 'Team name is required' });
    }

    fs.readFile(path.join(__dirname, 'teamReading.txt'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read file' });
        }

        console.log("File data:", data);  // Log raw data from the file

        const teamsData = parseTeamData(data);
        console.log("Parsed teams data:", teamsData);  // Log parsed teams data

        const normalizedTeamName = teamName.trim().toLowerCase();
        console.log("Team Name:", normalizedTeamName);  // Log normalized team name

        const teamInfo = teamsData[normalizedTeamName];

        if (teamInfo) {
            res.json(teamInfo);
        } else {
            res.status(404).json({ error: 'Team not found' });
        }
    });
});

// Parse the team data from the text file
function parseTeamData(data) {
    const teams = {};
    const teamsArr = data.split('\n\n'); // Split teams by two newlines, assuming each team block is separated by blank lines

    teamsArr.forEach(teamData => {
        const lines = teamData.split('\n');
        const teamName = lines[0].trim().toLowerCase(); // Normalize the team name here as well
        const teamInfo = {};

        lines.slice(1).forEach(line => {
            const [key, value] = line.split(':').map(str => str.trim());
            if (key && value) {
                // Normalize keys and assign values
                const normalizedKey = key.toLowerCase().replace(/\s+/g, ''); // Normalize keys to lowercase
                teamInfo[normalizedKey] = value;
            }
        });

        teams[teamName] = {
            name: teamName,
            ...teamInfo
        };
    });

    return teams;
}



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
