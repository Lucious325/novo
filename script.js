const sections = ['Level','XP','Strength','Rank','TotalDMG','TruePatriotDmg','TrueAllyDmg','TrueRevolutionaryDmg'];
console.log("JS fajl se učitao");
const sectionToCardId = {
    Level: 'levelCard',
    XP: 'xpCard',
    Strength: 'strengthCard',
    Rank: 'rankCard',
    TotalDMG: 'totaldmgCard',
    TruePatriotDmg: 'TruePatriotDmgCard',
    TrueAllyDmg: 'TrueAllyDmgCard',
    TrueRevolutionaryDmg: 'TrueRevolutionaryDmgCard'
};

let allData = [];

fetch('data/All_Data.json')
.then(res => res.json())
.then(data => {
    allData = data;
    renderHomePage();
});

// --------------- HOME PAGE ----------------
function renderHomePage(){
    document.getElementById('homeContainer').style.display='grid';
    document.getElementById('citizenContainer').style.display='none';

    sections.forEach(section=>{
        const cardList = document.querySelector(`#${sectionToCardId[section]} .card-list`);
        cardList.innerHTML='';

        const latestDate = new Date(Math.max(...allData.map(d=>new Date(d.CollectedAt))));
        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 30);

        const playerGroups = {};
        allData.forEach(d=>{
            if(new Date(d.CollectedAt) >= startDate){
                if(!playerGroups[d.ID]) playerGroups[d.ID] = [];
                playerGroups[d.ID].push(d);
            }
        });

        const deltas = [];
        for(let id in playerGroups){
            const arr = playerGroups[id].sort((a,b)=>new Date(a.CollectedAt)-new Date(b.CollectedAt));
            const diff = Number(arr[arr.length-1][section] ?? 0) - Number(arr[0][section] ?? 0);
            deltas.push({Name: arr[arr.length-1].Name, diff});
        }

        deltas.sort((a,b)=>b.diff - a.diff);

        deltas.slice(0,10).forEach(p=>{
            const pElem = document.createElement('p');
            pElem.innerHTML = `<span class="player-name">${p.Name}</span> <span class="player-diff">+${p.diff.toLocaleString('en-US')}</span>`;
            cardList.appendChild(pElem);
        });
    });
}

// --------------- SEARCH / CITIZEN VIEW ----------------
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if(query.length === 0) return;

    // filter koji ignoriše null i undefined
    const playerData = allData.filter(d => {
        const idStr = d.ID?.toString().toLowerCase() || "";
        const nameStr = d.Name?.toString().toLowerCase() || "";
        return idStr === query || nameStr.includes(query);
    });

    console.log("Query:", query, "Nađeno zapisa:", playerData.length);

    if(playerData.length > 0) {
        // sortiramo po datumu
        playerData.sort((a,b)=> new Date(a.CollectedAt) - new Date(b.CollectedAt));
        renderCitizenView(playerData);
    } else {
        alert("Nema rezultata za: " + query);
    }
}


// klik na dugme
document.getElementById('searchBtn').addEventListener('click', handleSearch);

// Enter na tastaturi
document.getElementById('searchInput').addEventListener('keypress', function(e){
    if(e.key === 'Enter') handleSearch();
});

// Logo shortcut
document.getElementById('logo').addEventListener('click', ()=>{
    document.getElementById('searchInput').value='';
    renderHomePage();
});

// --------------- CITIZEN VIEW ----------------
function renderCitizenView(playerData){
    document.getElementById('homeContainer').style.display='none';
    document.getElementById('citizenContainer').style.display='flex';

    playerData.sort((a,b)=> new Date(a.CollectedAt) - new Date(b.CollectedAt));

    const latest = playerData[playerData.length-1];
    const card = document.getElementById('citizenCard');
    card.innerHTML = `
        <h2>${latest.Name} (ID: ${latest.ID})</h2>
        ${sections.map(s=>`<p><b>${s}:</b> ${latest[s].toLocaleString('en-US')}</p>`).join('')}
        <p><b>CS:</b> ${latest.CS}</p>
    `;

    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML='';

    sections.forEach(section=>{
        const wrapper = document.createElement('div');
        wrapper.className='chart-wrapper';
        const canvas = document.createElement('canvas');
        wrapper.appendChild(canvas);
        chartsContainer.appendChild(wrapper);

        const labels = playerData.map(d=>d.CollectedAt.split(' ')[0]);
        const values = playerData.map(d=>d[section]);

        new Chart(canvas.getContext('2d'),{
            type:'line',
            data:{
                labels,
                datasets:[{
                    label: section,
                    data: values,
                    borderColor:'rgba(52, 82, 82, 0.11)',
                    backgroundColor:'rgba(75,192,192,0.2)',
                    fill:true,
                    tension:0.1
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{ labels:{ color:'white', font:{size:14} } }
                },
                scales:{
                    y:{ beginAtZero:true, ticks:{ color:'white', font:{size:12} }, grid:{ color:'rgba(255,255,255,0.2)'}},
                    x:{ ticks:{ color:'white', font:{size:12} }, grid:{ color:'rgba(255,255,255,0.2)'}}
                },
                interaction:{ mode:'index', intersect:false }
            }
        });
    });
}