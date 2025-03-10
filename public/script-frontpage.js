document.addEventListener('DOMContentLoaded', () => {
    fetch('/LeagueNews.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON content from the file
    })
    .then(data => {
        console.log(data); // Log the JSON content to ensure it's correct
        const leagueNewsElement = document.getElementById('LeagueNews'); // Use the correct id
        if (leagueNewsElement) {
            // Display the news items (the array of strings)
            leagueNewsElement.innerHTML = data.LeagueNews.map(item => `
                <div class="news-item">
                    <p>${item}</p>  <!-- Directly display the string -->
                </div>
            `).join('');
        } else {
            console.error('LeagueNews element not found');
        }
    })
    .catch(error => console.error('Error fetching league news:', error));

    fetch('/rumors.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON content from the file
    })
    .then(data => {
        console.log(data); // Log the JSON content to ensure it's correct
        const rumorsElement = document.getElementById('rumors'); // Use the correct id
        if (rumorsElement) {
            // Display the news items (the array of strings)
            rumorsElement.innerHTML = data.rumors.map(item => `
                <div class="news-item">
                    <p>${item}</p>  <!-- Directly display the string -->
                </div>
            `).join('');
        } else {
            console.error('Rumors element not found');
        }
    })
    .catch(error => console.error('Error fetching Rumors:', error));

    fetch('/signings.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON content from the file
    })
    .then(data => {
        console.log(data); // Log the JSON content to ensure it's correct
        const signingsElement = document.getElementById('signings'); // Use the correct id
        if (signingsElement) {
            // Display the news items (the array of strings)
            signingsElement.innerHTML = data.signings.map(item => `
                <div class="news-item">
                    <p>${item}</p>  <!-- Directly display the string -->
                </div>
            `).join('');
        } else {
            console.error('Signings element not found');
        }
    })
    .catch(error => console.error('Error fetching signings:', error));

    fetch('/freeAgents.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON content from the file
    })
    .then(data => {
        console.log(data); // Log the JSON content to ensure it's correct
        const freeAgentsElement = document.getElementById('freeAgents'); // Use the correct id
        if (freeAgentsElement) {
            // Display the news items (the array of strings)
            freeAgentsElement.innerHTML = data.freeAgents.map(item => `
                <div class="news-item">
                    <p>${item}</p>  <!-- Directly display the string -->
                </div>
            `).join('');
        } else {
            console.error('FreeAgents element not found');
        }
    })
    .catch(error => console.error('Error fetching Free Agents:', error));
});