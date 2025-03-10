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
let speed = 'medium'; // Default speed of drafting 
let teamPositions = {}; // Store team needs positions


let roundData = []; // Holds data for the current round
let currentIndex = 0; // Index for the ticker
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
    document.getElementById("current-round").innerHTML = "Current Round: " + currentRound;

   
});

// Array of image sets for each box
const images = [
    ["Assets/pepsi-5152332_640.jpg", "Assets/pepsi-7226342_640.jpg", "Assets/woman-5987303_640.jpg"],  // Set for box 1
    ["Assets/footwear-7042722_640.jpg", "Assets/nike-5578104_640.jpg", "Assets/shoes-5379215_640.jpg"], // Set for box 2
    ["Assets/american-792121_640.jpg", "Assets/pizza-806087_640.jpg", "Assets/n66-bet-8692765_640.jpg"], // Set for box 3
    ["Assets/apple-tv-7025964_640.jpg", "Assets/camera-1842202_640.jpg", "Assets/miniature-3365503_640.jpg"], // Set for box 4
    ["Assets/beer-820011_640.jpg", "Assets/beach-1869523_640.jpg", "Assets/party-8790935_640.jpg"]  // Set for box 5
];

// Select all the image elements inside the .additional-boxs containers
const boxes = document.querySelectorAll('.additional-boxs img');

// Set up a counter for each box to track the current image
let currentImageIndexes = [0, 0, 0, 0, 0];

// Function to change the image of each box every 60 seconds
function changeImages() {
    // Loop through all boxes
    boxes.forEach((box, index) => {
        // Update the source of the image for this box
        box.src = images[index][currentImageIndexes[index]];
        
        // Increment the counter for this box and loop back to 0 if we reach the end of the images array
        currentImageIndexes[index] = (currentImageIndexes[index] + 1) % images[index].length;
    });
}

// Call changeImages every 60 seconds (60000 milliseconds)
setInterval(changeImages, 60000);

// Call changeImages immediately to set the initial images
changeImages();

// Function to load team colors from the teamColors.txt
function loadTeamColors() {
    return fetch('/teamColors.json')  // Fetch the team colors file
        .then(res => res.json())  // Parse the JSON content from the file
        .then(data => data)       // Return the team colors object
        .catch(error => {
            console.error('Error loading team colors:', error);
            return {};  // Return empty object if there's an error
        });
}

// Function to load teams into the team info column
function loadTeams() {
    loadTeamColors().then(teamColors => {
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
                    
                    // Use team color from the loaded colors file (or default to blue)
                    const teamColor = teamColors[team.name] || "#007BFF"; // Default to blue if no color found
                    listItem.style.backgroundColor = teamColor;
                    
                    teamList.appendChild(listItem);

                    // Hover effect: Darken color
                    listItem.addEventListener('mouseenter', () => {
                        listItem.style.backgroundColor = darkenColor(listItem.style.backgroundColor);
                    });

                    listItem.addEventListener('mouseleave', () => {
                        listItem.style.backgroundColor = teamColor;
                    });

                    // Event listener for when a user selects a team
                    listItem.addEventListener('click', () => {
                        if (draftStarted) return alert("Draft already started!");
                        selectedTeam = team;

                        document.getElementById('selected-team').textContent = `Selected Team: ${team.name}`;
                        document.getElementById('start-draft').disabled = false; // Enable start draft button

                        // Change background color to green upon selection
                        listItem.style.backgroundColor = "green";

                        // Load the team positions from the loaded data
                        loadTeamPositionNeeds(team.name);
                        fetchCoachesForTeam(team.name);
                        // Fetch team news
                        fetchTeamNews(team.name);  // Fetch news for the selected team
                        // Highlight selected team
                        Array.from(document.querySelectorAll('.team-button')).forEach(item => {
                            if (item !== listItem) {
                                item.style.backgroundColor = teamColor; // Reset the color for unselected teams
                            }
                        });
                    });
                });
            })
            .catch(error => console.error('Error fetching team list:', error));
    });
}

// Utility function to darken a color (for hover effect)
function darkenColor(color) {
    // This function darkens the color by reducing its brightness
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    const darkened = {
        r: Math.max(0, rgb.r - 30),
        g: Math.max(0, rgb.g - 30),
        b: Math.max(0, rgb.b - 30)
    };

    return rgbToHex(darkened.r, darkened.g, darkened.b);
}

// Utility function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Utility function to convert RGB to hex
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}


// Load the positions for the selected team
function loadTeamPositionNeeds(teamName) {
    fetch(`/team-position-needs/${teamName}`)
        .then(res => res.json())
        .then(data => {
            const positions = data.positions;

            // Populate the "needspos-box" elements with the respective positions
            for (let i = 0; i < 4; i++) {
                const box = document.getElementById(`needspos-box-${i + 1}`);
                if (positions[i]) {
                    box.textContent = positions[i];
                    box.classList.remove('hidden'); // Ensure the box is visible
                } else {
                    box.classList.add('hidden'); // Hide the box if no position exists
                }
            }
        })
        .catch(error => console.error('Error fetching team position needs:', error));
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
                player.drafted = player.drafted || false;
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

    // Ensure scrolling works correctly
    scrollDraftPicks();
}

const apiUrl = '/getCoaches';  // Define the URL for the coaches API

// Function to fetch coaches for the selected team
function fetchCoachesForTeam() {
    if (!selectedTeam) {
        return; // If no team is selected, don't proceed
    }

    const team = selectedTeam.name; // Get the name of the selected team

    // Make a fetch request to the server to get the coach data
    fetch(`${apiUrl}?team=${team}`)
        .then(response => response.json())
        .then(data => {
            displayCoaches(data);
        })
        .catch(error => console.error('Error fetching coaches:', error));
}

// Function to display coaches' data in Box 1
function displayCoaches(data) {
    const coachesInfo = document.getElementById('coaches-info');
    coachesInfo.innerHTML = ''; // Clear any previous data

    if (data) {
        const headCoach = data.headCoach || 'N/A';
        const offensiveCoordinator = data.offensiveCoordinator || 'N/A';
        const defensiveCoordinator = data.defensiveCoordinator || 'N/A';

        coachesInfo.innerHTML = `
            <p>Head Coach: ${headCoach}</p>
            <p>Offensive Coordinator: ${offensiveCoordinator}</p>
            <p>Defensive Coordinator: ${defensiveCoordinator}</p>
        `;
    } else {
        coachesInfo.innerHTML = '<p>No coach data available.</p>';
    }
}

// Function to display team news in the UI
function displayTeamNews(data) {
    const newsList = document.getElementById('teamsNews');
    const teamImage = document.getElementById('teamImage');
    newsList.innerHTML = ''; // Clear previous news

    if (data) {
        // Display all available data for the selected team
        const teamInfoHTML = `
            <h3>${data.name}</h3>
            <p><strong>Owner:</strong> ${data.owner || 'No owner information available'}</p>
            <p><strong>Stadium:</strong> ${data.stadium || 'No stadium information available'}</p>
            <p><strong>Salary Cap:</strong> ${data.salarycap || 'No salary cap information available'}</p>
            <p><strong>Free Agents:</strong> ${data.freeagents || 'No free agents listed'}</p>
            <p><strong>Signings:</strong> ${data.signings || 'No signings available'}</p>
            <p><strong>Position Needs:</strong> ${data.positionneeds || 'No position needs available'}</p>
            <p><strong>News:</strong> ${data.news || 'No news available for this team'}</p>
            <p><strong>Opinions:</strong> ${data.opinions || 'No opinions available'}</p>
        `;

        newsList.innerHTML = teamInfoHTML;

        // Update the team image
        if (data.image) {
            teamImage.src = data.image;
            teamImage.style.display = 'block';
        } else {
            teamImage.style.display = 'none';
        }
    } else {
        newsList.innerHTML = '<p>No news available for this team.</p>';
        teamImage.style.display = 'none';
    }
}

// Function to fetch team news from the backend and display it
function fetchTeamNews(teamName) {
    fetch(`/teams-news?team=${teamName}`)
        .then(response => response.json())
        .then(data => displayTeamNews(data))
        .catch(error => console.error('Error fetching team news:', error));
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

    userTeamPicks = draftOrder
        .map((team, index) => ({ team, pickNumber: index }))
        .filter(entry => entry.team === selectedTeam.name);

    const selectedPlayerButton = document.querySelector('.selected-player');
    if (selectedPlayerButton) {
        selectedPlayerButton.classList.remove('selected-player');
    }

    autoDraft();
}

// Function to filter players based on the selected position (if using position filters)
function filterPlayers(position) {
    console.log(`Filtering players for position: ${position}`);
    
    // Filter the players based on the selected position and undrafted status
    const filteredPlayers = players.filter(player => player.position.trim() === position.trim() && !player.drafted);

    // Log the filtered players for debugging
    console.log(`Filtered players:`, filteredPlayers);

    // Update the UI to display the filtered players
    displayPlayers(filteredPlayers);

    // Continue the draft if it was interrupted
    if (draftStarted) {
        setTimeout(() => autoDraft(), getDraftSpeed());
    }
}

// Show all undrafted players
function showAllPlayers() {
    // Filter undrafted players only from the active players list
    const undraftedPlayers = players.filter(player => !player.drafted);
    displayPlayers(undraftedPlayers);  // Display the undrafted players

    // Continue the draft if it was interrupted
    if (draftStarted) {
        setTimeout(() => autoDraft(), getDraftSpeed());
    }
}

// Display players in the list (this is for the UI display only, not affecting the actual draft)
function displayPlayers(playersToDisplay) {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = ''; // Clear the existing players

    playersToDisplay.forEach(player => {
        const playerButton = document.createElement('button');
        playerButton.classList.add('player-button');
        playerButton.textContent = `${player.rank}. ${player.prospect} (${player.position}, ${player.college})`;
        playerButton.id = `player-${player.id}`;
        playerList.appendChild(playerButton);

        playerButton.addEventListener('click', () => {
            if (selectedPlayer) {
                const prevSelectedPlayerButton = document.getElementById(`player-${selectedPlayer.id}`);
                if (prevSelectedPlayerButton) {
                    prevSelectedPlayerButton.classList.remove('selected-player');
                }
            }
            selectedPlayer = player;
            playerButton.classList.add('selected-player');
            document.getElementById('draft-player').disabled = false;
        });
    });
}

// Add event listeners to the filter buttons
document.querySelectorAll('.position-btn').forEach(button => {
    button.addEventListener('click', function(event) {
        const position = event.target.getAttribute('data-position');
        filterPlayers(position);
        // Continue the draft if it was interrupted
        if (draftStarted) {
            setTimeout(() => autoDraft(), getDraftSpeed());
        }
    });
});

// To ensure draft order scrolling is not affected by player filters, modify the displayDraftOrder to scroll correctly when necessary:
function displayDraftOrder() {
    const draftOrderList = document.getElementById('draft-order-list');
    draftOrderList.innerHTML = '';  // Clear previous draft order

    draftOrder.forEach((team, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${team}`;
        draftOrderList.appendChild(listItem);
    });

    // Ensure scrolling works correctly
    scrollDraftPicks();
}

// Function to scroll draft picks
function scrollDraftPicks() {
    const draftSection = document.getElementById('draft-order-list');
    draftSection.scrollTop = draftSection.scrollHeight;  // Ensure the draft list keeps scrolling properly after each draft pick
    

}

// Ensure when a position filter is clicked, the draft order is unaffected
const positionButtons = document.querySelectorAll('.position-btn');
positionButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        // We prevent the default scroll behavior if the buttons are causing any issue
        event.preventDefault();
    });
});


function updateTicker() {
    const tickerWrapper = document.getElementById("ticker-wrapper");

    // Flatten `roundData` to get all picks in one array
    let allPicks = roundData.flat();

    // If no picks exist, show the waiting message
    if (allPicks.length === 0) {
        tickerWrapper.innerHTML = "<span class='ticker-item'>Waiting for draft picks...</span>";
        return;
    }

    // Get the current pick
    let currentPick = allPicks[currentIndex];

    // Check if pick data is valid
    if (!currentPick || !currentPick.pick || !currentPick.player || !currentPick.team) {
        console.error("Current pick data is missing or incomplete:", currentPick);
        tickerWrapper.innerHTML = "<span class='ticker-item'>Error: Invalid pick data</span>";
        return;
    }

    // Create ticker item
    const tickerItem = document.createElement('span');
    tickerItem.classList.add('ticker-item');
    tickerItem.textContent = `Pick ${currentPick.pick}: ${currentPick.player} - ${currentPick.team}`;

    // Clear and append new content
    tickerWrapper.innerHTML = ''; 
    tickerWrapper.appendChild(tickerItem);

    // Move to the next pick
    currentIndex = (currentIndex + 1) % allPicks.length;
}

let tickerStarted = false;

function addPick(player, team) {
    let totalPicks = roundData.flat().length + 1;
    let roundNumber = Math.ceil(totalPicks / 32);
    let playerPick = { player, team, pick: totalPicks };

    if (!roundData[roundNumber - 1]) {
        roundData[roundNumber - 1] = [];
    }
    roundData[roundNumber - 1].push(playerPick);

    currentIndex = roundData.flat().length - 1;

    console.log("New pick added:", playerPick);
    updateTicker();

    if (!tickerStarted) {
        setInterval(updateTicker, 2000);
        tickerStarted = true;
    }
}

// Draft player function
function draftPlayer() {
    if (!selectedTeam || !selectedPlayer) {
        alert("Please select a team and a player to draft.");
        return;
    }

    if (!draftStarted) {
        alert("Please start the draft first!");
        return;
    }

    // Example logic to check if the round should be incremented
    if (currentPick >= teams.length) {
        currentPick = 0;
        currentRound++;
        document.getElementById('current-round').innerHTML = "Current Round: " + currentRound;
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

            // Mark the player as drafted
            selectedPlayer.drafted = true;

            // Remove the drafted player from the list
            const playerButton = document.getElementById(`player-${selectedPlayer.id}`);
            if (playerButton) {
                playerButton.remove();
            } else {
                console.error(`Player button with ID player-${selectedPlayer.id} not found`);
            }
            players = players.filter(player => player.id !== selectedPlayer.id);  // Remove from active list
            selectedPlayer = null;

            document.getElementById('draft-player').disabled = true;
            currentPick++;  // Increment currentPick BEFORE checking for round

            // Update team info with the current pick
            updateCurrentPick();

            // Check if we need to increment the round
            if (currentPick % 32 === 0) {
                currentRound++; // Increment the round after 32 picks
                document.getElementById('current-round').textContent = `Current Round: ${currentRound}`;
            }

                 // Add the drafted player to the roundData array
                // addPick(selectedPlayer.prospect, selectedTeam.name);
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

        // Filter out undrafted players only based on the players array (not originalPlayers)
        const undraftedPlayers = players.filter(player => !player.drafted);

        // If there are no players left to draft, stop the process
        if (undraftedPlayers.length === 0) {
            console.log("No undrafted players left");
            return;
        }

        // Pick a random player from the undrafted list
        const randomPlayer = undraftedPlayers[Math.floor(Math.random() * undraftedPlayers.length)];

        // Add the drafted player to the drafted list
        const draftedList = document.getElementById('drafted-list');
        const draftItem = document.createElement('li');
        draftItem.textContent = `${currentTeam} drafted ${randomPlayer.prospect}`;
        draftedList.appendChild(draftItem);

        // Scroll to the new draft pick
        scrollDraftPicks();

        // Mark the player as drafted and remove from the display
        randomPlayer.drafted = true;

        // Remove the drafted player from the active players array (players array)
        players = players.filter(player => player.id !== randomPlayer.id);

        // Also remove the player button from the UI
        const playerButton = document.getElementById(`player-${randomPlayer.id}`);
        if (playerButton) {
            playerButton.remove();
        } else {
            console.error(`Player button with ID player-${randomPlayer.id} not found`);
        }

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

// Reset Draft
function resetDraft() {
    draftStarted = false;
    currentPick = 0;
    
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
    loadTeamPositionNeeds(); // Reload team positions
}
