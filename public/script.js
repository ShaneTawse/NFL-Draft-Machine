let teams = [];
let players = [];
let draftBoard = [];

// Fetch teams from the server
function fetchTeams() {
    fetch('http://localhost:3000/teams')
        .then(response => response.json())
        .then(data => {
            console.log('Teams:', data);
            teams = data;
            renderTeams();
        })
        .catch(err => console.error('Error fetching teams:', err));
}

// Fetch players from the server
function fetchPlayers() {
    fetch('http://localhost:3000/players')
        .then(response => response.json())
        .then(data => {
            console.log('Players:', data);
            players = data;
            renderPlayers();
        })
        .catch(err => console.error('Error fetching players:', err));
}

// Draft a player and update data
function draftPlayer(teamId, playerId) {
    fetch('http://localhost:3000/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, playerId })
    })
    .then(() => {
        fetchTeams();
        fetchPlayers();
        fetchDraftBoard();
    })
    .catch(err => console.error('Error drafting player:', err));
}

// Fetch the draft board
function fetchDraftBoard() {
    fetch('http://localhost:3000/draft-board')
        .then(response => response.json())
        .then(data => {
            console.log('Draft Board:', data);
            draftBoard = data;
            renderDraftBoard();
        })
        .catch(err => console.error('Error fetching draft board:', err));
}

// Render teams
function renderTeams() {
    const teamsDiv = document.getElementById('teams');
    teamsDiv.innerHTML = '';
    teams.forEach(team => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        teamDiv.innerHTML = `<h2><img src="${team.logo}" alt="${team.name}"> ${team.name}</h2>`;
        teamsDiv.appendChild(teamDiv);
    });
}

// Render players
function renderPlayers() {
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '<h2>Available Players</h2>';
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.innerHTML = `
            ${player.prospect} (${player.position}) - Speed: ${player.speed}, Strength: ${player.strength}, Mental Processing: ${player.mental_processing}
            ${teams.map(
                team => `<button onclick="draftPlayer(${team.id}, ${player.id})">Draft to ${team.name}</button>`
            ).join('')}
        `;
        playersDiv.appendChild(playerDiv);
    });
}

// Render draft board
function renderDraftBoard() {
    const draftBoardDiv = document.getElementById('draft-board');
    draftBoardDiv.innerHTML = '<h2>Draft Board</h2>';
    draftBoard.forEach(pick => {
        const pickDiv = document.createElement('div');
        pickDiv.className = 'pick';
        pickDiv.innerHTML = `${pick.player} drafted by ${pick.team}`;
        draftBoardDiv.appendChild(pickDiv);
    });
}

// Initialize the app
fetchTeams();
fetchPlayers();
fetchDraftBoard();
