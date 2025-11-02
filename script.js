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

// ---------------- FETCH JSON ----------------
fetch('data/All_Data.json')
.then(res => res.json())
.then(data => {
    allData = data;

    // Popuni dropdown sa državama
    const countrySelect = document.getElementById("countryFilter");
    const uniqueCountries = [...new Set(allData.map(d => d.CS))].sort();
    uniqueCountries.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        countrySelect.appendChild(opt);
    });

    // Kad se promeni država, ponovo renderuj home page
    countrySelect.addEventListener("change", renderHomePage);

    // Prvi prikaz
    renderHomePage();
});

// --------------- HOME PAGE ----------------
function renderHomePage(){
    document.getElementById('homeContainer').style.display='grid';
    document.getElementById('citizenContainer').style.display='none';

    const selectedCountry = document.getElementById("countryFilter").value;
    const dataToUse = selectedCountry === "Global" ? allData : allData.filter(d => d.CS === selectedCountry);

    sections.forEach(section=>{
        const cardList = document.querySelector(`#${sectionToCardId[section]} .card-list`);
        cardList.innerHTML='';

        const latestDate = new Date(Math.max(...dataToUse.map(d=>new Date(d.CollectedAt))));
        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - 30);

        const playerGroups = {};
        dataToUse.forEach(d=>{
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

    const playerData = allData.filter(d => {
        const idStr = d.ID?.toString().toLowerCase() || "";
        const nameStr = d.Name?.toString().toLowerCase() || "";
        return idStr === query || nameStr.includes(query);
    });

    console.log("Query:", query, "Nađeno zapisa:", playerData.length);

    if(playerData.length > 0) {
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
    const previous = playerData[playerData.length-2] || latest;

    const now = new Date(latest.CollectedAt);
    const date7 = new Date(now); date7.setDate(now.getDate() - 7);
    const date30 = new Date(now); date30.setDate(now.getDate() - 30);

    let tableHTML = `
        <h2>${latest.Name} (ID: ${latest.ID})</h2>
        <p><b>CS:</b> ${latest.CS}</p>
        <table style="width:100%; margin:auto; border-collapse: collapse; color: white;">
            <thead>
                <tr>
                    <th style="border-bottom: 1px solid #fff; text-align:left; padding:5px;">Stat</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Current</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last 1 Day</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last 7 Days</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last 30 Days</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    sections.forEach(s=>{
        const current = latest[s] ?? 0;
        const prev = previous[s] ?? 0;
        const diffPrev = current - prev;

        // poslednjih 7 dana
        const last7 = playerData.filter(d => new Date(d.CollectedAt) >= date7);
        const first7 = last7[0] ?? latest;
        const last7Value = last7[last7.length-1]?.[s] ?? current;
        const diff7 = last7Value - first7[s];

        // poslednjih 30 dana
        const last30 = playerData.filter(d => new Date(d.CollectedAt) >= date30);
        const first30 = last30[0] ?? latest;
        const last30Value = last30[last30.length-1]?.[s] ?? current;
        const diff30 = last30Value - first30[s];

        const lastUpdate = latest.CollectedAt.split(' ')[0]; // samo datum

        tableHTML += `
            <tr>
                <td style="padding:5px;">${s}</td>
                <td style="padding:5px; text-align:right;">${current.toLocaleString('en-US')}</td>
                <td style="padding:5px; text-align:right; color:${diffPrev>=1?'lightgreen':'red'};">${diffPrev>=0?'+':''}${diffPrev.toLocaleString('en-US')}</td>
                <td style="padding:5px; text-align:right; color:${diff7>=1?'lightgreen':'red'};">${diff7>=0?'+':''}${diff7.toLocaleString('en-US')}</td>
                <td style="padding:5px; text-align:right; color:${diff30>=1?'lightgreen':'red'};">${diff30>=0?'+':''}${diff30.toLocaleString('en-US')}</td>
                <td style="padding:5px; text-align:right;">${lastUpdate}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    document.getElementById('citizenCard').innerHTML = tableHTML;

    // Charts ostaju isti
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

