// Global variables
let teams = [];
let challenges = [];
let currentChallengeId = null;
let timerRunning = false;
let globalStartTime = null;
let timerInterval = null;
let tempMembers = [];

// Load data from localStorage
function loadData() {
    const storedTeams = localStorage.getItem('teams');
    const storedChallenges = localStorage.getItem('challenges');

    if (storedTeams) {
        teams = JSON.parse(storedTeams);
        teams = teams.map(team => ({
            id: team.id,
            name: team.name,
            members: team.members || [],
            totalScore: team.totalScore || 0,
            challengeScores: team.challengeScores || {}
        }));
    }
    if (storedChallenges) {
        challenges = JSON.parse(storedChallenges);
        // Ensure all challenges have pointsPerExercise (default to 50 if missing)
        challenges = challenges.map(c => ({
            ...c,
            pointsPerExercise: c.pointsPerExercise || 50
        }));
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('teams', JSON.stringify(teams));
    localStorage.setItem('challenges', JSON.stringify(challenges));
}

// Switch between tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.closest('.tab-btn').classList.add('active');
    
    if (tabName === 'competition') {
        renderTeamsGrid();
    } else if (tabName === 'ranking') {
        renderRanking();
    }
}

// Add member to temporary list
function addMemberToTemp() {
    const input = document.getElementById('memberNameInput');
    const name = input.value.trim();
    
    if (!name) return;
    
    tempMembers.push(name);
    input.value = '';
    renderTempMembers();
}

// Remove member from temporary list
function removeTempMember(index) {
    tempMembers.splice(index, 1);
    renderTempMembers();
}

// Render temporary members
function renderTempMembers() {
    const container = document.getElementById('tempMembers');
    container.innerHTML = tempMembers.map((member, i) => 
        `<span class="member-tag">${member}<i class="fas fa-times" onclick="removeTempMember(${i})"></i></span>`
    ).join('');
}

// Add a new team
function addTeam() {
    const nameInput = document.getElementById('teamNameInput');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a team name');
        return;
    }

    if (tempMembers.length === 0) {
        alert('Please add at least one team member');
        return;
    }

    const team = {
        id: Date.now(),
        name: name,
        members: [...tempMembers],
        totalScore: 0,
        challengeScores: {}
    };

    teams.push(team);
    console.log('Team added:', team);
    saveData();
    nameInput.value = '';
    tempMembers = [];
    renderTempMembers();
    renderTeamsList();
    renderTeamsGrid();
    alert('Team added successfully!');
}

// Delete a team
function deleteTeam(teamId) {
    if (confirm('Are you sure you want to delete this team?')) {
        teams = teams.filter(t => t.id !== teamId);
        saveData();
        renderTeamsList();
        renderTeamsGrid();
        renderRanking();
    }
}

// Add a new challenge
function addChallenge() {
    const name = document.getElementById('challengeNameInput').value.trim();
    const duration = parseInt(document.getElementById('challengeDurationInput').value);
    const numExercises = parseInt(document.getElementById('challengeExercisesInput').value);
    const pointsPerExercise = parseInt(document.getElementById('challengePointsPerExerciseInput').value);
    const description = document.getElementById('challengeDescInput').value.trim();

    if (!name) {
        alert('Please enter challenge name');
        return;
    }

    if (!duration || duration < 1) {
        alert('Please enter a valid duration in minutes');
        return;
    }

    if (!numExercises || numExercises < 1) {
        alert('Please enter number of exercises (minimum 1)');
        return;
    }

    if (!pointsPerExercise || pointsPerExercise < 1) {
        alert('Please enter valid points per exercise (minimum 1)');
        return;
    }

    if (!description) {
        alert('Please enter a challenge description');
        return;
    }

    const challenge = {
        id: Date.now(),
        name: name,
        duration: duration,
        numExercises: numExercises,
        pointsPerExercise: pointsPerExercise, // This is the key field
        description: description
    };

    challenges.push(challenge);
    saveData();
    
    document.getElementById('challengeNameInput').value = '';
    document.getElementById('challengeDurationInput').value = '';
    document.getElementById('challengeExercisesInput').value = '';
    document.getElementById('challengePointsPerExerciseInput').value = '50';
    document.getElementById('challengeDescInput').value = '';
    
    renderChallengesList();
    updateChallengeSelect();
    alert(`Challenge added! Each completed exercise will award ${pointsPerExercise} points.`);
}

// Delete a challenge
function deleteChallenge(challengeId) {
    if (confirm('Are you sure you want to delete this challenge?')) {
        challenges = challenges.filter(c => c.id !== challengeId);
        saveData();
        renderChallengesList();
        updateChallengeSelect();
    }
}

// Update challenge dropdown
function updateChallengeSelect() {
    const select = document.getElementById('challengeSelect');
    select.innerHTML = '<option value="">-- Select a Challenge --</option>' +
        challenges.map((c, i) => 
            `<option value="${c.id}">Challenge ${i + 1}: ${c.name} (${c.numExercises} exercises × ${c.pointsPerExercise}pts = ${c.numExercises * c.pointsPerExercise}pts max)</option>`
        ).join('');
}

// Update selected challenge
function updateSelectedChallenge() {
    const select = document.getElementById('challengeSelect');
    currentChallengeId = select.value ? parseInt(select.value) : null;
    
    const startBtn = document.getElementById('startBtn');
    if (currentChallengeId && !timerRunning) {
        startBtn.disabled = false;
        const challenge = challenges.find(c => c.id === currentChallengeId);
        document.getElementById('currentChallengeInfo').innerHTML = 
            `<i class="fas fa-info-circle"></i> Selected: ${challenge.name} (${challenge.numExercises} exercises × ${challenge.pointsPerExercise}pts = ${challenge.numExercises * challenge.pointsPerExercise}pts max)`;
    } else {
        startBtn.disabled = true;
        document.getElementById('currentChallengeInfo').innerHTML = 
            'Select a challenge to begin';
    }
}

// Show challenge explanation modal
function showChallengeModal() {
    if (!currentChallengeId) {
        alert('Please select a challenge first');
        return;
    }

    const challenge = challenges.find(c => c.id === currentChallengeId);
    if (!challenge) return;

    const challengeIndex = challenges.findIndex(c => c.id === currentChallengeId);
    
    document.getElementById('modalChallengeNumber').textContent = 
        `Challenge ${challengeIndex + 1} of ${challenges.length}`;
    document.getElementById('modalChallengeName').textContent = challenge.name;
    document.getElementById('modalChallengeDesc').innerHTML = `
        <strong>Duration:</strong> ${challenge.duration} minutes<br>
        <strong>Exercises:</strong> ${challenge.numExercises}<br>
        <strong>Points per exercise:</strong> ${challenge.pointsPerExercise} points<br>
        <strong>Maximum score:</strong> ${challenge.numExercises * challenge.pointsPerExercise} points<br><br>
        <strong>Description:</strong><br>
        ${challenge.description}
    `;
    
    document.getElementById('challengeModal').classList.add('active');
}

// Start challenge timer
function startChallengeTimer() {
    document.getElementById('challengeModal').classList.remove('active');
    
    if (!currentChallengeId || timerRunning) return;

    if (teams.length === 0) {
        alert('Please add teams first!');
        return;
    }

    timerRunning = true;
    globalStartTime = Date.now();

    const challenge = challenges.find(c => c.id === currentChallengeId);

    teams.forEach(team => {
        if (!team.challengeScores[currentChallengeId]) {
            team.challengeScores[currentChallengeId] = {
                exercises: {}
            };
        }
    });

    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('challengeSelect').disabled = true;

    document.getElementById('currentChallengeInfo').innerHTML = 
        `<i class="fas fa-running"></i> Running: ${challenge.name} (${challenge.numExercises} exercises × ${challenge.pointsPerExercise}pts each)`;

    timerInterval = setInterval(updateGlobalTimer, 100);
    renderTeamsGrid();
}

// Update global timer only
function updateGlobalTimer() {
    if (!timerRunning) return;

    const challenge = challenges.find(c => c.id === currentChallengeId);
    if (!challenge) return;

    const elapsed = Date.now() - globalStartTime;
    const totalDuration = challenge.duration * 60 * 1000;
    const remaining = Math.max(0, totalDuration - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    document.getElementById('globalTimerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (remaining <= 0) {
        stopAllTimers(true);
    }
}

// Mark exercise as done or failed - THIS IS WHERE POINTS ARE AWARDED
function markExercise(teamId, exerciseIndex, status) {
    const team = teams.find(t => t.id === teamId);
    if (!team || !currentChallengeId) return;

    const challenge = challenges.find(c => c.id === currentChallengeId);
    if (!challenge) return;

    if (!team.challengeScores[currentChallengeId]) {
        team.challengeScores[currentChallengeId] = { exercises: {} };
    }

    // Mark the exercise status
    team.challengeScores[currentChallengeId].exercises[exerciseIndex] = status;

    // Recalculate total score using EACH challenge's specific pointsPerExercise
    team.totalScore = 0;
    Object.keys(team.challengeScores).forEach(chalId => {
        const chalData = team.challengeScores[chalId];
        const chal = challenges.find(c => c.id == chalId);
        if (chalData && chalData.exercises && chal) {
            Object.values(chalData.exercises).forEach(s => {
                if (s === 'done') {
                    // Add the specific points for THIS challenge
                    team.totalScore += chal.pointsPerExercise;
                }
            });
        }
    });

    saveData();
    renderTeamsGrid();
    renderRanking();
    
    // Optional: Show feedback
    if (status === 'done') {
        console.log(`Team ${team.name} earned ${challenge.pointsPerExercise} points! Total: ${team.totalScore}`);
    }
}

// Stop all timers
function stopAllTimers(autoStop = false) {
    if (!timerRunning) return;

    const message = autoStop ? 
        'Time is up! Challenge ended automatically.' : 
        'Stop and save this challenge?';

    if (!autoStop && !confirm(message)) return;

    timerRunning = false;
    clearInterval(timerInterval);

    const challenge = challenges.find(c => c.id === currentChallengeId);
    if (challenge) {
        teams.forEach(team => {
            if (team.challengeScores[currentChallengeId]) {
                for (let i = 0; i < challenge.numExercises; i++) {
                    if (!team.challengeScores[currentChallengeId].exercises[i]) {
                        team.challengeScores[currentChallengeId].exercises[i] = 'failed';
                    }
                }
            }
        });
    }

    currentChallengeId = null;
    globalStartTime = null;

    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('challengeSelect').disabled = false;
    document.getElementById('challengeSelect').value = '';
    document.getElementById('globalTimerDisplay').textContent = '00:00';
    document.getElementById('currentChallengeInfo').innerHTML = autoStop ? 
        'Time is up! Challenge ended. Select next challenge.' :
        'Challenge stopped. Select next challenge.';

    saveData();
    renderTeamsGrid();
    renderRanking();

    if (autoStop) {
        alert('Time is up! All incomplete exercises marked as failed.');
    }
}

// Show winner
function showWinner() {
    if (teams.length === 0) {
        alert('No teams available!');
        return;
    }

    const teamsWithScores = teams.filter(t => t.totalScore > 0);

    if (teamsWithScores.length === 0) {
        alert('No team has scored any points yet!');
        return;
    }

    const sortedTeams = [...teamsWithScores].sort((a, b) => b.totalScore - a.totalScore);
    
    createConfetti();
    
    let podiumHTML = '<div class="podium-container">';
    
    for (let i = 0; i < Math.min(3, sortedTeams.length); i++) {
        const team = sortedTeams[i];
        
        let rankClass = '';
        let rankEmoji = '';
        if (i === 0) {
            rankClass = 'first';
            rankEmoji = '🥇';
        } else if (i === 1) {
            rankClass = 'second';
            rankEmoji = '🥈';
        } else {
            rankClass = 'third';
            rankEmoji = '🥉';
        }
        
        podiumHTML += `
            <div class="podium-place ${rankClass}">
                <div class="rank-number">${rankEmoji}</div>
                <div class="team-name">${team.name}</div>
                <div class="team-time">${team.totalScore} PTS</div>
                <div class="team-members-list">
                    <i class="fas fa-users"></i> ${team.members.join(', ')}
                </div>
            </div>
        `;
    }
    
    podiumHTML += '</div>';

    document.getElementById('winnerDetails').innerHTML = podiumHTML;
    document.getElementById('winnerModal').classList.add('active');
}

// Create confetti animation
function createConfetti() {
    const winnerContent = document.getElementById('winnerContent');
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        winnerContent.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Close winner modal
function closeWinnerModal() {
    document.getElementById('winnerModal').classList.remove('active');
}

// Manual point adjustment functions
function showAddPointsModal(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const points = prompt(`Add points to "${team.name}"\n\nCurrent score: ${team.totalScore} points\n\nEnter points to add:`, '0');
    
    if (points === null) return; // User cancelled
    
    const pointsToAdd = parseInt(points);
    
    if (isNaN(pointsToAdd) || pointsToAdd < 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    if (pointsToAdd === 0) {
        alert('No points added');
        return;
    }
    
    team.totalScore += pointsToAdd;
    saveData();
    renderRanking();
    renderTeamsGrid();
    alert(`✅ Added ${pointsToAdd} points to "${team.name}"\n\nNew total: ${team.totalScore} points`);
}

function showMinusPointsModal(teamId) {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const points = prompt(`Subtract points from "${team.name}"\n\nCurrent score: ${team.totalScore} points\n\nEnter points to subtract:`, '0');
    
    if (points === null) return; // User cancelled
    
    const pointsToMinus = parseInt(points);
    
    if (isNaN(pointsToMinus) || pointsToMinus < 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    if (pointsToMinus === 0) {
        alert('No points subtracted');
        return;
    }
    
    team.totalScore = Math.max(0, team.totalScore - pointsToMinus); // Don't go below 0
    saveData();
    renderRanking();
    renderTeamsGrid();
    alert(`✅ Subtracted ${pointsToMinus} points from "${team.name}"\n\nNew total: ${team.totalScore} points`);
}

// Render ranking page
function renderRanking() {
    const container = document.getElementById('rankingContainer');
    if (!container) return;

    const teamsWithScores = teams.filter(t => t.totalScore > 0);

    if (teamsWithScores.length === 0) {
        container.innerHTML = `
            <div class="no-ranking">
                <i class="fas fa-trophy"></i>
                <p>No rankings available yet.</p>
                <p style="font-size: 14px; margin-top: 10px;">Teams must score points to appear in rankings.</p>
            </div>
        `;
        return;
    }

    const sortedTeams = [...teamsWithScores].sort((a, b) => b.totalScore - a.totalScore);

    let html = '<h3 style="text-align: center; color: #2596be; margin-bottom: 80px; font-size: 32px; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);"> TOP 3 CHAMPIONS</h3>';
    html += '<div class="podium-container">';
    
    for (let i = 0; i < Math.min(3, sortedTeams.length); i++) {
        const team = sortedTeams[i];
        
        let rankClass = '';
        let rankEmoji = '';
        let rankLabel = '';
        if (i === 0) {
            rankClass = 'first';
            rankEmoji = '🥇';
            rankLabel = '<div style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ffd700 0%, #ffc700 100%); color: #333; padding: 8px 20px; border-radius: 20px; font-weight: 800; font-size: 14px; box-shadow: 0 5px 20px rgba(255,215,0,0.6); border: 2px solid #fff;">🏆 1ST PLACE</div>';
        } else if (i === 1) {
            rankClass = 'second';
            rankEmoji = '🥈';
            rankLabel = '<div style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #c0c0c0 0%, #d3d3d3 100%); color: #333; padding: 8px 20px; border-radius: 20px; font-weight: 800; font-size: 14px; box-shadow: 0 5px 20px rgba(192,192,192,0.6); border: 2px solid #fff;">⭐ 2ND PLACE</div>';
        } else {
            rankClass = 'third';
            rankEmoji = '🥉';
            rankLabel = '<div style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%); color: white; padding: 8px 20px; border-radius: 20px; font-weight: 800; font-size: 14px; box-shadow: 0 5px 20px rgba(205,127,50,0.6); border: 2px solid rgba(255,255,255,0.6);">🎯 3RD PLACE</div>';
        }
        
        let completedChallenges = 0;
        Object.keys(team.challengeScores || {}).forEach(chalId => {
            const chalData = team.challengeScores[chalId];
            if (chalData && chalData.exercises && Object.keys(chalData.exercises).length > 0) {
                completedChallenges++;
            }
        });
        
        html += `
            <div class="podium-place ${rankClass}">
                ${rankLabel}
                <div class="rank-number">${rankEmoji}</div>
                <div class="team-name">${team.name}</div>
                <div class="team-time">${team.totalScore} pts</div>
                <div class="team-members-list">
                    <i class="fas fa-user-friends"></i> ${team.members.join(', ')}
                </div>
                <div style="margin-top: 15px; font-size: 13px; font-weight: 600; opacity: 0.95;">
                    <i class="fas fa-trophy"></i> ${completedChallenges} challenge${completedChallenges !== 1 ? 's' : ''} completed
                </div>
            </div>
        `;
    }
    
    html += '</div>';

    html += '<h3 style="text-align: center; color: #2596be; margin: 50px 0 30px; font-size: 24px;">Complete Rankings</h3>';
    html += `
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Team Name</th>
                    <th>Total Score</th>
                    <th>Members</th>
                    <th>Challenges</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedTeams.forEach((team, index) => {
        let completedChallenges = 0;
        Object.keys(team.challengeScores || {}).forEach(chalId => {
            const chalData = team.challengeScores[chalId];
            if (chalData && chalData.exercises && Object.keys(chalData.exercises).length > 0) {
                completedChallenges++;
            }
        });
        
        const rankClass = `rank-${index + 1}`;
        
        html += `
            <tr class="${index < 3 ? rankClass : ''}">
                <td>${index + 1}</td>
                <td class="team-name-col">${team.name}</td>
                <td class="time-col">${team.totalScore} pts</td>
                <td class="members-col">${team.members.join(', ')}</td>
                <td class="challenges-col">${completedChallenges} / ${challenges.length}</td>
                <td class="actions-col">
                    <button class="btn btn-mini btn-success" onclick="showAddPointsModal(${team.id})" title="Add points">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-mini btn-danger" onclick="showMinusPointsModal(${team.id})" title="Subtract points">
                        <i class="fas fa-minus"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Render teams grid
function renderTeamsGrid() {
    const grid = document.getElementById('teamsGrid');
    
    if (!grid) {
        console.error('teamsGrid element not found!');
        return;
    }

    if (teams.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#666;"><i class="fas fa-info-circle"></i> No teams added yet. Go to Admin Dashboard to add teams.</p>';
        return;
    }

    const challenge = currentChallengeId ? challenges.find(c => c.id === currentChallengeId) : null;

    const cardsHTML = teams.map(team => {
        const teamScore = team.totalScore || 0;
        let currentChallengeScore = 0;
        let exerciseButtons = '';

        if (challenge && timerRunning) {
            const chalData = team.challengeScores[currentChallengeId];
            if (chalData && chalData.exercises) {
                Object.values(chalData.exercises).forEach(s => {
                    if (s === 'done') currentChallengeScore += challenge.pointsPerExercise;
                });

                exerciseButtons = '<div class="exercise-controls">';
                for (let i = 0; i < challenge.numExercises; i++) {
                    const status = chalData.exercises[i];
                    const isDone = status === 'done';
                    const isFailed = status === 'failed';
                    
                    exerciseButtons += `
                        <div class="exercise-item ${isDone ? 'done' : ''} ${isFailed ? 'failed' : ''}">
                            <div class="exercise-label">Exercise ${i + 1}</div>
                            <div class="exercise-buttons">
                                <button class="btn btn-mini btn-success" 
                                        onclick="markExercise(${team.id}, ${i}, 'done')"
                                        ${isDone || isFailed ? 'disabled' : ''}>
                                    <i class="fas fa-check"></i> Done
                                </button>
                                <button class="btn btn-mini btn-danger" 
                                        onclick="markExercise(${team.id}, ${i}, 'failed')"
                                        ${isDone || isFailed ? 'disabled' : ''}>
                                    <i class="fas fa-times"></i> Failed
                                </button>
                            </div>
                            ${isDone ? `<div class="exercise-status">✓ Completed (+${challenge.pointsPerExercise}pts)</div>` : ''}
                            ${isFailed ? '<div class="exercise-status failed-text">✗ Failed (0pts)</div>' : ''}
                        </div>
                    `;
                }
                exerciseButtons += '</div>';
            }
        }

        let completedChallenges = 0;
        Object.keys(team.challengeScores || {}).forEach(chalId => {
            const chalData = team.challengeScores[chalId];
            if (chalData && chalData.exercises && Object.keys(chalData.exercises).length > 0) {
                completedChallenges++;
            }
        });

        return `
            <div class="team-card" data-team-id="${team.id}">
                <h3><i class="fas fa-users"></i> ${team.name}</h3>
                <div class="team-members">
                    <strong><i class="fas fa-user-friends"></i> Members:</strong><br>
                    ${team.members.join(', ')}
                </div>
                <div class="team-info">
                    <p><strong><i class="fas fa-star"></i> Total Score:</strong> ${teamScore} points</p>
                    ${timerRunning && challenge ? `<p><strong><i class="fas fa-trophy"></i> Current Challenge:</strong> ${currentChallengeScore} pts (${challenge.pointsPerExercise}pts per exercise)</p>` : ''}
                    <p><strong><i class="fas fa-check-circle"></i> Completed:</strong> ${completedChallenges} / ${challenges.length} challenges</p>
                </div>
                ${exerciseButtons}
            </div>
        `;
    }).join('');
    
    grid.innerHTML = cardsHTML;
}

// Render teams list (admin view)
function renderTeamsList() {
    const list = document.getElementById('teamsList');
    if (!list) return;

    if (teams.length === 0) {
        list.innerHTML = '<p style="color:#666;"><i class="fas fa-info-circle"></i> No teams added yet.</p>';
        return;
    }

    list.innerHTML = teams.map(team => {
        let completedChallenges = 0;
        Object.keys(team.challengeScores || {}).forEach(chalId => {
            const chalData = team.challengeScores[chalId];
            if (chalData && chalData.exercises && Object.keys(chalData.exercises).length > 0) {
                completedChallenges++;
            }
        });
        
        return `
            <div class="challenge-item">
                <h4><i class="fas fa-users"></i> ${team.name}</h4>
                <p><strong>Members:</strong> ${team.members.join(', ')}</p>
                <p><strong>Total Score:</strong> ${team.totalScore || 0} points</p>
                <p><strong>Challenges Completed:</strong> ${completedChallenges}</p>
                <div class="actions">
                    <button class="btn btn-danger" onclick="deleteTeam(${team.id})">
                        <i class="fas fa-trash"></i> Delete Team
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render challenges list (admin view)
function renderChallengesList() {
    const list = document.getElementById('challengesList');
    if (!list) return;

    if (challenges.length === 0) {
        list.innerHTML = '<p style="color:#666;"><i class="fas fa-info-circle"></i> No challenges added yet.</p>';
        return;
    }

    list.innerHTML = challenges.map((challenge, index) => `
        <div class="challenge-item">
            <h4><i class="fas fa-flag-checkered"></i> Challenge ${index + 1}: ${challenge.name}</h4>
            <p><strong><i class="fas fa-clock"></i> Duration:</strong> ${challenge.duration} minutes</p>
            <p><strong><i class="fas fa-dumbbell"></i> Exercises:</strong> ${challenge.numExercises}</p>
            <p><strong><i class="fas fa-coins"></i> Points per Exercise:</strong> ${challenge.pointsPerExercise} points</p>
            <p><strong><i class="fas fa-star"></i> Max Score:</strong> ${challenge.numExercises * challenge.pointsPerExercise} points</p>
            <p><strong><i class="fas fa-align-left"></i> Description:</strong> ${challenge.description}</p>
            <div class="actions">
                <button class="btn btn-danger" onclick="deleteChallenge(${challenge.id})">
                    <i class="fas fa-trash"></i> Delete Challenge
                </button>
            </div>
        </div>
    `).join('');
}


// Download localStorage data
function downloadLocalStorage() {
    const data = {
        teams: teams,
        challenges: challenges,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `competition-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Reset everything
function resetEverything() {
    if (confirm('Are you sure? This will delete ALL teams, challenges, and scores!')) {
        teams = [];
        challenges = [];
        currentChallengeId = null;
        timerRunning = false;
        globalStartTime = null;
        if (timerInterval) clearInterval(timerInterval);
        
        localStorage.clear();
        
        renderTeamsList();
        renderChallengesList();
        renderTeamsGrid();
        renderRanking();
        updateChallengeSelect();
        
        document.getElementById('globalTimerDisplay').textContent = '00:00';
        document.getElementById('currentChallengeInfo').innerHTML = 'Select a challenge to begin';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = true;
        document.getElementById('challengeSelect').disabled = false;
        
        alert('Everything has been reset!');
    }
}

// Initialize on page load
function downloadLocalStorage() {
  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    let value = localStorage.getItem(key);

    // Try to parse JSON if possible
    try {
      value = JSON.parse(value);
    } catch (e) {
      // Not JSON, keep as string
    }

    data[key] = value;
  }

  // Create a blob with organized JSON
  const blob = new Blob(
    [JSON.stringify(data, null, 2)], // null, 2 -> pretty print
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "localStorage-organized.json";
  a.click();

  URL.revokeObjectURL(url);
}
// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    loadData();
    console.log('Teams:', teams);
    console.log('Challenges:', challenges);
    renderTeamsList();
    renderChallengesList();
    renderTeamsGrid();
    renderRanking();
    updateChallengeSelect();
});