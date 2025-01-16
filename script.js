let selectedTeam = null;
let selectedPlayer = null;
let timer;
const countdownDuration = 5 * 60;

document.addEventListener('DOMContentLoaded', () => {
    const enterDraftButton = document.getElementById('enter-draft');
    const resetDraftButton = document.getElementById('reset-draft');
    const draftPlayerButton = document.getElementById('draft-player-button');
    const entryPage = document.getElementById('entry-page');
    const draftPage = document.getElementById('draft-page');
    const countdownTimer = document.getElementById('countdown-timer');

    // Fetch teams and render buttons
    fetchTeams();

    enterDraftButton.addEventListener('click', () => {
        if (!selectedTeam) {
            alert('Please select a team first!');
            return;
        }
        switchToDraftPage();
    });

    resetDraftButton.addEventListener('click', () => {
        resetDraft();
    });

    draftPlayerButton.addEventListener('click', () => {
        if (!selectedPlayer) {
            alert('Please select a player first!');
            return;
        }
        draftPlayer(selectedPlayer);
    });

    function fetchTeams() {
        fetch('/teams')
            .then(response => response.json())
            .then(data => renderTeamButtons(data))
            .catch(err => console.error(err));
    }

    function renderTeamButtons(teams) {
        const teamButtonsDiv = document.getElementById('team-buttons');
        teamButtonsDiv.innerHTML = '';
        teams.forEach(team => {
            const button = document.createElement('button');
            button.textContent = team.name;
            button.className = 'team-button';
            button.onclick = (event) => selectTeam(team.id, event);
            teamButtonsDiv.appendChild(button);
        });
    }

    function selectTeam(teamId, event) {
        selectedTeam = teamId;
        document.querySelectorAll('.team-button').forEach(button => button.classList.remove('selected'));
        event.target.classList.add('selected');

        // Set selected team name
        const selectedTeamName = event.target.textContent;
        document.getElementById('selected-team-name').textContent = selectedTeamName;
    }

    function switchToDraftPage() {
        entryPage.classList.add('hidden');
        draftPage.classList.remove('hidden');
        startCountdown();
        fetchPlayers();
    }

    function resetDraft() {
        selectedTeam = null;
        selectedPlayer = null;
        // Additional logic for resetting the database can be added here
        console.log('Draft reset');
        document.querySelectorAll('.team-button').forEach(button => button.classList.remove('selected'));
        entryPage.classList.remove('hidden');
        draftPage.classList.add('hidden');
        clearInterval(timer);
        countdownTimer.textContent = 'Time Remaining: 5:00';
        document.getElementById('selected-team-name').textContent = '';
        document.getElementById('drafted-players').innerHTML = '';
    }

    function startCountdown() {
        let timeRemaining = countdownDuration;
        updateTimerDisplay(timeRemaining);

        timer = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 0) {
                clearInterval(timer);
                alert('Time expired! No pick selected.');
            }
            updateTimerDisplay(timeRemaining);
        }, 1000);
    }

    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        countdownTimer.textContent = `Time Remaining: ${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function fetchPlayers() {
        fetch('/players')
            .then(response => response.json())
            .then(data => renderPlayers(data))
            .catch(err => console.error(err));
    }

    function renderPlayers(players) {
        const playersSection = document.getElementById('players');
        playersSection.innerHTML = '';
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.textContent = `${player.prospect} (${player.position}) - ${player.college}`;
            playerDiv.onclick = () => selectPlayer(player);
            playersSection.appendChild(playerDiv);
        });
    }

    function selectPlayer(player) {
        selectedPlayer = player;
        document.querySelectorAll('.player').forEach(playerDiv => playerDiv.classList.remove('selected'));
        event.target.classList.add('selected');
    }

    function draftPlayer(player) {
        fetch('/draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teamId: selectedTeam, playerId: player.id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const draftedPlayersList = document.getElementById('drafted-players');
                const playerItem = document.createElement('li');
                playerItem.textContent = `${player.prospect} (${player.position})`;
                draftedPlayersList.appendChild(playerItem);

                // Remove the drafted player from the list
                const playersSection = document.getElementById('players');
                playersSection.removeChild(document.querySelector(`.player[data-id="${player.id}"]`));

                selectedPlayer = null;
            } else {
                alert('Failed to draft player.');
            }
        })
        .catch(err => console.error(err));
    }
});
