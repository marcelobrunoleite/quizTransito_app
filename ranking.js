document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    initializeRanking();
    setupPerformanceChart(currentUser.id);
    updateStatistics();
});

function initializeRanking() {
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    
    // Calcular médias por usuário
    const userStats = {};
    results.forEach(result => {
        if (!userStats[result.userId]) {
            userStats[result.userId] = {
                name: result.userName,
                totalScore: 0,
                simulations: 0,
                bestScore: 0
            };
        }
        
        userStats[result.userId].totalScore += result.score;
        userStats[result.userId].simulations++;
        userStats[result.userId].bestScore = Math.max(userStats[result.userId].bestScore, result.score);
    });

    // Converter para array e ordenar
    const rankingData = Object.entries(userStats)
        .map(([userId, stats]) => ({
            userId,
            name: stats.name,
            score: stats.bestScore,
            simulations: stats.simulations,
            average: (stats.totalScore / stats.simulations).toFixed(1)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    // Atualizar pódium
    updatePodium(rankingData);

    // Atualizar tabela
    const tableBody = document.getElementById('rankingTableBody');
    tableBody.innerHTML = '';
    
    rankingData.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}º</td>
            <td>${player.name}</td>
            <td>${player.score.toFixed(1)}%</td>
            <td>${player.simulations}</td>
            <td>${player.average}%</td>
        `;
        tableBody.appendChild(row);
    });
}

function updatePodium(rankingData) {
    const podiumPlaces = {
        first: rankingData[0] || { name: "Vazio", score: 0 },
        second: rankingData[1] || { name: "Vazio", score: 0 },
        third: rankingData[2] || { name: "Vazio", score: 0 }
    };

    Object.entries(podiumPlaces).forEach(([place, data]) => {
        const placeElement = document.querySelector(`.${place}`);
        if (placeElement) {
            placeElement.querySelector('.name').textContent = data.name;
            placeElement.querySelector('.score').textContent = `${data.score.toFixed(1)}%`;
        }
    });
}

function setupPerformanceChart(userId) {
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    const userResults = results
        .filter(r => r.userId === userId)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-6);

    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    const performanceData = {
        labels: userResults.map(r => new Date(r.date).toLocaleDateString()),
        datasets: [{
            label: 'Média de Acertos',
            data: userResults.map(r => r.score),
            borderColor: '#00fff2',
            backgroundColor: 'rgba(0, 255, 242, 0.1)',
            tension: 0.4
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: performanceData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

function updateStatistics() {
    const results = JSON.parse(localStorage.getItem('quizResults')) || [];
    
    const stats = {
        totalSimulados: results.length,
        mediaGeral: results.reduce((acc, r) => acc + r.score, 0) / results.length || 0,
        taxaAprovacao: (results.filter(r => r.score >= PORCENTAGEM_APROVACAO).length / results.length) * 100 || 0
    };

    document.querySelector('.stat-value:nth-child(1)').textContent = stats.totalSimulados;
    document.querySelector('.stat-value:nth-child(2)').textContent = `${stats.mediaGeral.toFixed(1)}%`;
    document.querySelector('.stat-value:nth-child(3)').textContent = `${stats.taxaAprovacao.toFixed(1)}%`;
} 