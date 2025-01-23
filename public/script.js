let selectedTeam = null;
let selectedPlayer = null;
let countdownTimer;
const draftDuration = 300; // 5 minutes in seconds
let currentTime = draftDuration;

document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    loadPlayers();

    document.getElementById('draft-player').addEventListener('click', draftPlayer);
    document.getElementById('reset-draft').addEventListener('click', resetDraft);

    startCountdown();
});

function loadTeams() {
    fetch('/teams')
        .then((res) => res.json())
        .then((teams) => {
            const teamInfo = document.getElementById('team-info');
            const draftOrder = document.createElement('ul');

            teams.forEach((team) => {
                const listItem = document.createElement('li');
                listItem.textContent = team.name;
                draftOrder.appendChild(listItem);

                listItem.addEventListener('click', () => {
                    selectedTeam = team;
                    document.getElementById('selected-team').textContent = `Selected Team: ${team.name}`;
                    toggleDraftButton();
                });
            });

            document.getElementById('draft-order').innerHTML = '';
            document.getElementById('draft-order').appendChild(draftOrder);
        });
}

function loadPlayers() {
    fetch('/players')
        .then((res) => res.json())
        .then((players) => {
            const playerList = document.getElementById('player-list');
            playerList.innerHTML = '';

            players.forEach((player) => {
                const button = document.createElement('button');
                button.textContent = `${player.rank}: ${player.prospect}`;
                button.addEventListener('click', () => {
                    selectedPlayer = player;
                    toggleDraftButton();
                });

                playerList.appendChild(button);
            });
        });
}

function toggleDraftButton() {
    const draftButton = document.getElementById('draft-player');
    draftButton.disabled = !(selectedTeam && selectedPlayer);
}

function draftPlayer() {
    if (selectedTeam && selectedPlayer) {
        fetch('/draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamId: selectedTeam.id, playerId: selectedPlayer.id }),
        })
            .then(() => {
                const draftedList = document.getElementById('drafted-list');
                const listItem = document.createElement('li');
                listItem.textContent = `${selectedTeam.name} selected ${selectedPlayer.prospect}`;
                draftedList.appendChild(listItem);

                selectedPlayer = null;
                toggleDraftButton();
            });
    }
}

function resetDraft() {
    selectedTeam = null;
    selectedPlayer = null;
    document.getElementById('selected-team').textContent = 'Selected Team: None';
    document.getElementById('drafted-list').innerHTML = '';
    loadPlayers();
}

function startCountdown() {
    const timer = document.getElementById('countdown-timer');
    countdownTimer = setInterval(() => {
        if (currentTime > 0) {
            currentTime--;
            const minutes = Math.floor(currentTime / 60);
            const seconds = currentTime % 60;
            timer.textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            clearInterval(countdownTimer);
            alert('Draft time is over!');
        }
 
    }, 1000);
}