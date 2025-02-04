let selectedTeam = null; 
let selectedPlayer = null;
let userTeamPicks = [];
let draftOrder = [];
let teams = [];
let players = [];
let originalPlayers = [];
let currentPick = 0;
let currentRound = 1;
let draftStarted = false;
let timer = 180; // 3 minutes in seconds
let speed = 'medium'; // Default speed of drafting (slow, medium, fast)

document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    loadPlayers();
    loadDraftOrder();

    document.getElementById('draft-player').addEventListener('click', draftPlayer);
    document.getElementById('reset-draft').addEventListener('click', resetDraft);
    document.getElementById('start-draft').addEventListener('click', startDraft);
    document.getElementById('slow-speed').addEventListener('click', () => setSpeed('slow'));
    document.getElementById('medium-speed').addEventListener('click', () => setSpeed('medium'));
    document.getElementById('fast-speed').addEventListener('click', () => setSpeed('fast'));
});

// Function to load teams into the team info column
function loadTeams() {
    fetch('/teams')
        .then(res => res.json())
        .then(data => {
            teams = data;
            const teamList = document.getElementById('team-list');
            teamList.innerHTML = ''; // Clear the existing list

            teams.forEach((team, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${index + 1}. ${team.name}`;
                listItem.id = `team-${team.id}`;
                listItem.classList.add('team-button'); // Add a class for button styling
                listItem.style.backgroundColor = team.color || "#007BFF"; // Assuming you have a color property
                teamList.appendChild(listItem);

                // Hover effect: Darken color
                listItem.addEventListener('mouseenter', () => {
                    listItem.style.backgroundColor = darkenColor(listItem.style.backgroundColor);
                });

                listItem.addEventListener('mouseleave', () => {
                    listItem.style.backgroundColor = team.color || "#007BFF";
                });

                listItem.addEventListener('click', () => {
                    listItem.style.backgroundColor = "green";
                });
                

                

                // Event listener for when a user selects a team
                listItem.addEventListener('click', () => {
                    if (draftStarted) return alert("Draft already started!");
                    selectedTeam = team;
                    
                    document.getElementById('selected-team').textContent = `Selected Team: ${team.name}`;
                    document.getElementById('start-draft').disabled = false; // Enable start draft button
                    
                    // Change background color to green upon selection
                    listItem.style.backgroundColor = "green";
                    
                });
            });
        })
        .catch(error => console.error('Error fetching team list:', error));
}

// Helper function to darken the color
function darkenColor(color) {
    const rgb = color.match(/\d+/g).map(Number);
    rgb[0] = Math.max(rgb[0] - 30, 0);
    rgb[1] = Math.max(rgb[1] - 30, 0);
    rgb[2] = Math.max(rgb[2] - 30, 0);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

// Function to load players into player buttons
function loadPlayers() {
    fetch('/players')
        .then(res => res.json())
        .then(data => {
            players = data;
            originalPlayers = [...players]; // Save a copy of the original player list
            const playerList = document.getElementById('player-list');
            playerList.innerHTML = ''; // Clear any existing players

            players.forEach(player => {
                const playerButton = document.createElement('button');
                playerButton.classList.add('player-button');
                playerButton.textContent = `${player.rank}. ${player.prospect} (${player.position}, ${player.college})`;
                playerButton.id = `player-${player.id}`;
                playerList.appendChild(playerButton);

                playerButton.addEventListener('click', () => {
                    if (selectedPlayer) {
                        document.getElementById(`player-${selectedPlayer.id}`).classList.remove('selected-player');
                    }
                    selectedPlayer = player;
                    playerButton.classList.add('selected-player');
                    document.getElementById('draft-player').disabled = false;
                });
            });
        })
        .catch(error => console.error('Error fetching players:', error));
}

// Function to load the draft order
function loadDraftOrder() {
    fetch('/draft')
        .then(res => res.json())
        .then(data => {
            draftOrder = data;
            displayDraftOrder();
        })
        .catch(error => console.error('Error fetching draft order:', error));
}

// Display draft order
function displayDraftOrder() {
    const draftOrderList = document.getElementById('draft-order-list');
    draftOrderList.innerHTML = '';  // Clear previous draft order

    draftOrder.forEach((team, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${team}`;
        draftOrderList.appendChild(listItem);
    });
}

// Start Draft Logic
function startDraft() {
    if (!selectedTeam) {
        alert("Please select a team to draft for!");
        return;
    }

    draftStarted = true;
    document.getElementById('start-draft').disabled = true;

    // Keep Team Info and show draft order
    document.getElementById('team-info').style.display = 'block';
    document.getElementById('draft-order').classList.remove('hidden');

    // Timer starts when draft begins
    startTimer();

    userTeamPicks = draftOrder
        .map((team, index) => ({ team, pickNumber: index }))
        .filter(entry => entry.team === selectedTeam.name);

    autoDraft();
}

// Timer countdown functionality
function startTimer() {
    timer = 180; // 3 minutes in seconds
    document.getElementById('countdown-timer').textContent = `Time Remaining: 03:00`;

    const timerInterval = setInterval(() => {
        if (!draftStarted || timer <= 0) {
            clearInterval(timerInterval);
            return;
        }

        const currentTeam = draftOrder[currentPick % draftOrder.length];
        if (currentTeam === selectedTeam.name) {
            timer--; // Only decrement timer if it’s the user’s pick
            const minutes = Math.floor(timer / 60);
            const seconds = timer % 60;
            document.getElementById('countdown-timer').textContent = `Time Remaining: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

// Draft a player
function draftPlayer() {
    if (!selectedTeam || !selectedPlayer) {
        alert("Please select a team and a player to draft.");
        return;
    }

    if (!draftStarted) {
        alert("Please start the draft first!");
        return;
    }

    const currentTeam = draftOrder[currentPick % draftOrder.length];
    if (currentTeam !== selectedTeam.name) {
        alert("It is not your turn to draft!");
        return;
    }

    const playerId = selectedPlayer.id;

    fetch('/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam.id, playerId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            
            const selectedPlayersBox = document.getElementById('selected-players-box');
            const playerListItem = document.createElement('div');
            playerListItem.textContent = `${selectedPlayer.prospect} (${selectedPlayer.position})`;
            selectedPlayersBox.appendChild(playerListItem);
            
            const draftedList = document.getElementById('drafted-list');
            const draftItem = document.createElement('li');
            draftItem.textContent = `${selectedTeam.name} drafted ${selectedPlayer.prospect}`;
            draftedList.appendChild(draftItem);

            

            // Scroll to the new draft pick
            scrollDraftPicks();

            // Remove the drafted player from the list
            document.getElementById(`player-${selectedPlayer.id}`).remove();
            players = players.filter(player => player.id !== selectedPlayer.id);
            selectedPlayer = null;

            document.getElementById('draft-player').disabled = true;
            currentPick++;

            // Update team info with the current pick
            updateCurrentPick();

            if (currentPick % 32 === 0) {
                currentRound++;
                document.getElementById('current-round').textContent = `Current Round: ${currentRound}`;
            }

            // Auto draft for CPU teams
            autoDraft();
        }
    })
    .catch(error => console.error('Error during drafting:', error));
}

// Auto draft for CPU teams (only for non-user teams)
function autoDraft() {
    if (currentPick >= draftOrder.length) return;

    const currentTeam = draftOrder[currentPick % draftOrder.length];
    if (currentTeam !== selectedTeam.name) {
        // Only auto-draft for CPU teams
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        const draftedList = document.getElementById('drafted-list');
        const draftItem = document.createElement('li');
        draftItem.textContent = `${currentTeam} drafted ${randomPlayer.prospect}`;
        draftedList.appendChild(draftItem);

        // Scroll to the new draft pick
        scrollDraftPicks();

        // Remove the drafted player from the list
        document.getElementById(`player-${randomPlayer.id}`).remove();
        players = players.filter(player => player.id !== randomPlayer.id);
        currentPick++;

        updateCurrentPick();

        // Auto draft the next pick if needed
        setTimeout(() => autoDraft(), getDraftSpeed()); // Delay based on selected speed
    }
}

// Function to get draft speed
function getDraftSpeed() {
    if (speed === 'slow') return 1500; // Slow speed (1.5 seconds between picks)
    if (speed === 'medium') return 1000; // Medium speed (1 second between picks)
    return 500; // Fast speed (0.5 seconds between picks)
}

// Set the speed for drafting
function setSpeed(selectedSpeed) {
    speed = selectedSpeed;
    alert(`Draft speed set to: ${speed}`);
}

// Scroll draft picks
function scrollDraftPicks() {
    const draftSection = document.getElementById('drafted-players');
    draftSection.scrollTop = draftSection.scrollHeight;
}

// Update current pick in draft order list
function updateCurrentPick() {
    const draftOrderList = document.getElementById('draft-order-list');
    
    // Clear previous "on-clock" class in the draft order list
    Array.from(draftOrderList.children).forEach(child => child.classList.remove('on-clock'));
    
    // Highlight the current team pick in the draft order list
    const currentTeam = draftOrder[currentPick % draftOrder.length];
    const currentTeamElement = Array.from(draftOrderList.children)
                                     .find(item => item.textContent.includes(currentTeam)); // Find the current team in the draft order list
    
    if (currentTeamElement) {
        currentTeamElement.classList.add('on-clock');
    }
    draftOrderList.scrollLeft = currentPick * (currentTeamElement ? currentTeamElement.offsetWidth : 0);
}

function filterPlayers(position) {
    const playerList = document.getElementById('player-list');
    // Clear the player list
    playerList.innerHTML = '';
    
    // Example: Assuming you have an array of player objects with position info
    const players = [
        { name: 'Player 1', position: 'QB' },
        { name: 'Player 2', position: 'RB' },
        { name: 'Player 3', position: 'WR' },
        { name: 'Player 4', position: 'TE' },
        // Add all players...
    ];
    
    // Filter players based on the selected position
    const filteredPlayers = players.filter(player => player.position === position);

    // Populate the player list with the filtered players
    filteredPlayers.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.textContent = player.name;
        playerList.appendChild(playerItem);
    });
}


// Function to show all remaining undrafted players (the "Home" button functionality)
function showAllPlayers() {
    const playerList = document.getElementById('player-list');
    // Clear the player list
    playerList.innerHTML = '';

    // Get all undrafted players (those who are not in the draftedPlayers array)
    const undraftedPlayers = allPlayers.filter(player => !player.drafted);

    // Populate the player list with all undrafted players
    undraftedPlayers.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.textContent = player.name;
        playerList.appendChild(playerItem);
    });
}


// Reset Draft
function resetDraft() {
    draftStarted = false;
    currentPick = 0;
    timer = 180;  // Reset timer to 3 minutes
    document.getElementById('start-draft').disabled = false;
    document.getElementById('draft-player').disabled = true;
    document.getElementById('team-info').style.display = 'block';
    document.getElementById('draft-order').classList.add('hidden');
    document.getElementById('team-list').innerHTML = '';
    document.getElementById('player-list').innerHTML = '';
    document.getElementById('drafted-list').innerHTML = '';
    loadTeams();
    loadPlayers();
    loadDraftOrder();
}
