const sections = [
    'Level','XP','Strength','Rank',
    'TotalDMG','TruePatriotDmg','TrueAllyDmg','TrueRevolutionaryDmg','Ability'
];

const sectionToCardId = {
    Level:'levelCard', XP:'xpCard', Strength:'strengthCard', Rank:'rankCard',
    TotalDMG:'totaldmgCard', TruePatriotDmg:'TruePatriotDmgCard', TrueAllyDmg:'TrueAllyDmgCard',
    TrueRevolutionaryDmg:'TrueRevolutionaryDmgCard', Ability:'abilityCard'
};

let allData = [];
const currentPages = {};

fetch('data/All_Data.json')
.then(res => res.json())
.then(data => {
    allData = data;

    const countrySelect = document.getElementById("countryFilter");
    const uniqueCountries = [...new Set(allData.map(d=>d.CS))].sort();
    uniqueCountries.forEach(c=>{
        const opt = document.createElement("option");
        opt.value=c; opt.textContent=c;
        countrySelect.appendChild(opt);
    });

    countrySelect.addEventListener("change", renderHomePage);

    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', e=>{
        if(e.key==='Enter') handleSearch();
    });
    document.getElementById('logo').addEventListener('click', ()=>{
        document.getElementById('searchInput').value='';
        renderHomePage();
    });

    renderHomePage();
});

function paginate(array, page, perPage=10){
    const start = (page-1)*perPage;
    return array.slice(start, start+perPage);
}

function renderPagination(container, currentPage, totalItems, callback, perPage=10){
    container.innerHTML='';
    const totalPages = Math.ceil(totalItems/perPage);

    const prev = document.createElement("button");
    prev.textContent="Prev"; prev.disabled=currentPage===1;
    prev.onclick=()=>callback(currentPage-1);

    const next = document.createElement("button");
    next.textContent="Next"; next.disabled=currentPage===totalPages;
    next.onclick=()=>callback(currentPage+1);

    container.appendChild(prev); container.appendChild(next);
}

function renderHomePage(){
    document.getElementById('homeContainer').style.display='grid';
    document.getElementById('citizenContainer').style.display='none';

    const selectedCountry = document.getElementById("countryFilter").value;
    const dataToUse = selectedCountry==="Global"? allData : allData.filter(d=>d.CS===selectedCountry);

    sections.forEach(section=>{
        if(!currentPages[section]) currentPages[section]=1;
        renderSection(section, dataToUse);
    });
}

function renderSection(section, dataToUse){
    const cardList = document.querySelector(`#${sectionToCardId[section]} .card-list`);
    const paginationDiv = document.querySelector(`#${sectionToCardId[section]} .pagination`);
    cardList.innerHTML='';

    const latestDate = new Date(Math.max(...dataToUse.map(d=>new Date(d.CollectedAt))));
    const startDate = new Date(latestDate); startDate.setDate(startDate.getDate()-30);

    const playerGroups = {};
    dataToUse.forEach(d=>{
        if(new Date(d.CollectedAt)>=startDate){
            if(!playerGroups[d.ID]) playerGroups[d.ID]=[];
            playerGroups[d.ID].push(d);
        }
    });

    const deltas=[];
    for(let id in playerGroups){
        const arr = playerGroups[id].sort((a,b)=>new Date(a.CollectedAt)-new Date(b.CollectedAt));
        const diff = Number(arr[arr.length-1][section]??0) - Number(arr[0][section]??0);
        deltas.push({Name: arr[arr.length-1].Name, ID: id, diff});
    }

    deltas.sort((a,b)=>b.diff-a.diff);

    const perPage=10;
    const currentPage=currentPages[section];
    const pageData = paginate(deltas,currentPage,perPage);

    pageData.forEach((p, index) => {
    const globalIndex = (currentPage - 1) * perPage + index + 1;

    const pElem = document.createElement('p');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'player-name';
    nameSpan.textContent = `${globalIndex}.${p.Name}`;
    nameSpan.style.cursor = 'pointer';

    nameSpan.addEventListener('click', () => {
        const playerData = allData.filter(d => d.ID === p.ID);
        renderCitizenView(playerData);
    });

    const diffSpan = document.createElement('span');
    diffSpan.className = 'player-diff';
    diffSpan.textContent = `+${p.diff.toLocaleString('en-US')}`;

    pElem.appendChild(nameSpan);
    pElem.appendChild(diffSpan);
    cardList.appendChild(pElem);
});


    renderPagination(paginationDiv,currentPage,deltas.length,page=>{
        currentPages[section]=page;
        renderSection(section,dataToUse);
    });
}

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
        alert("No result for: " + query);
    }
}

document.getElementById('searchBtn').addEventListener('click', handleSearch);


document.getElementById('searchInput').addEventListener('keypress', function(e){
    if(e.key === 'Enter') handleSearch();
});


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
        <p><b>CS:</b> ${latest.CS} | <b>Last Seen:</b> ${latest.LastSeen}</p>
        <table style="width:100%; margin:auto; border-collapse: collapse; color: white;">
            <thead>
                <tr>
                    <th style="border-bottom: 1px solid #fff; text-align:left; padding:5px;">Stat</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Current</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last 1 Day</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last 7 Days</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Current Month</th>
                    <th style="border-bottom: 1px solid #fff; text-align:right; padding:5px;">Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    sections.forEach(s=>{
        const current = latest[s] ?? 0;
        const prev = previous[s] ?? 0;
        const diffPrev = current - prev;

        const last7 = playerData.filter(d => new Date(d.CollectedAt) >= date7);
        const first7 = last7[0] ?? latest;
        const last7Value = last7[last7.length-1]?.[s] ?? current;
        const diff7 = last7Value - first7[s];

        const last30 = playerData.filter(d => new Date(d.CollectedAt) >= date30);
        const first30 = last30[0] ?? latest;
        const last30Value = last30[last30.length-1]?.[s] ?? current;
        const diff30 = last30Value - first30[s];

        const lastUpdate = latest.CollectedAt.split(' ')[0];

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
    tableHTML+='</tbody></table>';
    document.getElementById('citizenCard').innerHTML=tableHTML;

    const chartsContainer = document.getElementById('chartsContainer'); chartsContainer.innerHTML='';
    sections.forEach(section=>{
        const wrapper=document.createElement('div'); wrapper.className='chart-wrapper';
        const canvas=document.createElement('canvas'); wrapper.appendChild(canvas);
        chartsContainer.appendChild(wrapper);

        const labels = playerData.map(d=>d.CollectedAt.split(' ')[0]);
        const values = playerData.map(d=>d[section]);

        new Chart(canvas.getContext('2d'),{
            type:'line',
            data:{ labels, datasets:[{ label: section, data: values, borderColor:'rgba(52,82,82,0.11)', backgroundColor:'rgba(75,192,192,0.2)', fill:true, tension:0.1 }]},
            options:{ responsive:true, maintainAspectRatio:false }
        });
    });
}
