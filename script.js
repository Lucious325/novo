
const sections = [
    'Level','XP','Strength','Rank',
    'TotalDMG','TruePatriotDmg','TrueAllyDmg','TrueRevolutionaryDmg','Ability'
];

const sectionToCardId = {
    Level:'levelCard', XP:'xpCard', Strength:'strengthCard', Rank:'rankCard',
    TotalDMG:'totaldmgCard', TruePatriotDmg:'TruePatriotDmgCard',
    TrueAllyDmg:'TrueAllyDmgCard', TrueRevolutionaryDmg:'TrueRevolutionaryDmgCard',
    Ability:'abilityCard'
};

const countrySumSections = [
    'XP','Strength','TotalDMG','TruePatriotDmg','TrueAllyDmg','TrueRevolutionaryDmg'
];

let allData = [];
let currentViewMode = 'players';
const currentPages = {};

function loadDataForMonth(monthKey) {
    const file = monthKey === "current"
        ? "data/All_Data.json"
        : `data/All_Data_${monthKey}.json`;
    return fetch(file).then(r => r.json());
}

function reloadDashboard() {
    const month = document.getElementById("monthFilter").value;

    loadDataForMonth(month).then(data => {
        allData = data;

        const countryFilter = document.getElementById("countryFilter");
        const selected = countryFilter.value || "Global";
        countryFilter.innerHTML = `<option value="Global">Global</option>`;
        [...new Set(allData.map(d=>d.CS))].sort().forEach(cs => {
            const o = document.createElement("option");
            o.value = cs; o.textContent = cs;
            countryFilter.appendChild(o);
        });
        if([...countryFilter.options].some(o=>o.value===selected)) countryFilter.value = selected;

        renderHomePage();
    });
}

document.getElementById("monthFilter").addEventListener("change", reloadDashboard);
document.getElementById("countryFilter").addEventListener("change", renderHomePage);


function paginate(arr, page, perPage=10){
    return arr.slice((page-1)*perPage, page*perPage);
}

function renderPagination(container, page, totalItems, cb){
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems/10);

    const prev = document.createElement('button');
    prev.textContent = 'Prev'; prev.disabled = page===1;
    prev.onclick = ()=>cb(page-1);

    const next = document.createElement('button');
    next.textContent = 'Next'; next.disabled = page===totalPages;
    next.onclick = ()=>cb(page+1);

    container.append(prev,next);
}

function groupByCountry(data){
    const map = {};

    const dates = data.map(d => new Date(d.CollectedAt));
    const startDate = new Date(Math.min(...dates));
    const endDate   = new Date(Math.max(...dates));

    const playersByCS = {};
    data.forEach(d=>{
        const cd = new Date(d.CollectedAt);
        if(cd < startDate || cd > endDate) return;

        const key = `${d.CS}-${d.ID}`;
        if(!playersByCS[key]) playersByCS[key] = [];
        playersByCS[key].push(d);
    });

    Object.values(playersByCS).forEach(arr=>{
        arr.sort((a,b)=> new Date(a.CollectedAt)-new Date(b.CollectedAt));
        const first = arr[0], last = arr[arr.length-1];

        if(!map[first.CS]) {
            map[first.CS] = { CS:first.CS };
            sections.forEach(s=> map[first.CS][s]=0);
        }

        sections.forEach(s=>{
            map[first.CS][s] += (last[s] || 0) - (first[s] || 0);
        });
    });

    return Object.values(map);
}


function renderHomePage(){
    if(currentViewMode==='countries') {
        renderCountriesView();
        return;
    }

    document.getElementById('homeContainer').style.display='grid';
    document.getElementById('citizenContainer').style.display='none';

    const cs = document.getElementById("countryFilter").value;
    const data = cs==="Global" ? allData : allData.filter(d=>d.CS===cs);

    sections.forEach(section=>{
        if(!currentPages[section]) currentPages[section]=1;
        renderSection(section,data);
    });
}

function renderCountriesView() {
    document.getElementById('homeContainer').style.display = 'grid';
    document.getElementById('citizenContainer').style.display = 'none';

    const groupedAll = groupByCountry(allData);

    const countryFlagMap = {
        "North Macedonia": "North-Macedonia",
        "United Kingdom": "United-Kingdom",
        "Czech Republic": "Czech-Republic",
        "South Korea": "South-Korea",
        "United States of America": "United-States",
        "Bosnia and Herzegovina": "Bosnia-and-Herzegovina",
        "North Korea": "North-Korea",
        "Saudi Arabia": "Saudi-Arabia",
        "United Arab Emirates": "United-Arab-Emirates",
        "Republic of Moldova": "Moldova",
    };

    sections.forEach(section => {
        const cardTitle = `Top by ${section} per Country`;
        const cardList = document.querySelector(`#${sectionToCardId[section]} .card-list`);
        const cardHeader = document.querySelector(`#${sectionToCardId[section]} h2`);
        const pag = document.querySelector(`#${sectionToCardId[section]} .pagination`);

        cardList.innerHTML = '';
        pag.innerHTML = '';
        cardHeader.textContent = cardTitle;

        if (!currentPages[section]) currentPages[section] = 1;
        const page = currentPages[section];

        const sorted = [...groupedAll].sort((a, b) => (b[section] || 0) - (a[section] || 0));
        const pageData = paginate(sorted, page, 10);

        pageData.forEach((c, i) => {
            const flagName = countryFlagMap[c.CS] || c.CS;
            const flagURL = `https://www.edominations.com/public/game/flags/shiny/24/${flagName}.webp`;

            const p = document.createElement('p');
            p.style.display = 'flex';
            p.style.justifyContent = 'space-between';
            p.style.padding = '5px 10px';
            p.style.background = 'rgba(0,0,0,0.2)';
            p.style.borderRadius = '5px';

            p.innerHTML = `
                <span style="flex: 0 0 auto;">${(page-1)*10 + i + 1}.</span>
                <span style="flex: 1; display:flex; align-items:center; gap:8px;">
                    <img 
                        src="${flagURL}" 
                        style="width:26px; height:18px; object-fit:cover; border:1px solid #333;"
                        onerror="this.style.display='none'"
                    >
                    <span>${c.CS}</span>
                </span>
                <span style="flex: 0 0 auto;">${(c[section] || 0).toLocaleString('en-US')}</span>
            `;

            cardList.appendChild(p);
        });

        renderPagination(pag, page, sorted.length, newPage => {
            currentPages[section] = newPage;
            renderCountriesView();
        });
    });
}


function renderSection(section,data){
    const list = document.querySelector(`#${sectionToCardId[section]} .card-list`);
    const cardHeader = document.querySelector(`#${sectionToCardId[section]} h2`);
    const pag = document.querySelector(`#${sectionToCardId[section]} .pagination`);
    list.innerHTML='';
    cardHeader.textContent = `Top Increase by ${section}`;

const dates = data.map(d=>new Date(d.CollectedAt));
const start = new Date(Math.min(...dates));


    const players = {};
    data.forEach(d=>{
        if(new Date(d.CollectedAt)>=start){
            players[d.ID] ??= [];
            players[d.ID].push(d);
        }
    });

    const deltas = Object.values(players).map(arr=>{
        arr.sort((a,b)=>new Date(a.CollectedAt)-new Date(b.CollectedAt));
        return {
            ID: arr[0].ID,
            Name: arr[0].Name,
            diff: (arr.at(-1)[section]||0) - (arr[0][section]||0)
        };
    }).sort((a,b)=>b.diff-a.diff);

    const page = currentPages[section];
    paginate(deltas,page).forEach((p,i)=>{
        const el = document.createElement('p');
        el.style.display='flex'; el.style.justifyContent='space-between';
        el.style.padding='5px 10px'; el.style.background='rgba(0,0,0,0.2)';
        el.style.borderRadius='5px';
        el.style.cursor='pointer';

        const avatarURL = `https://edominations.com/public/upload/citizen/${p.ID}.webp`;

        el.innerHTML = `
            <span class="player-row">
                 <span>${(page-1)*10+i+1}.</span>
                 <img 
                     src="${avatarURL}" 
                     class="avatar"
                      onerror="this.src='default-avatar.jpg'"
                 >
                <span class="player-name" title="${p.Name}">
                   ${p.Name}
                </span>
             </span>

             <span class="player-diff">
                +${p.diff.toLocaleString('en-US')}
            </span>
        `;

        el.onclick = ()=> renderCitizenView(allData.filter(d=>d.ID===p.ID));
        list.appendChild(el);
    });

    renderPagination(pag,page,deltas.length,p=>{
        currentPages[section]=p;
        renderSection(section,data);
    });
}

function renderCitizenView(playerData){
    document.getElementById('homeContainer').style.display='none';
    document.getElementById('citizenContainer').style.display='flex';

    playerData.sort((a,b)=> new Date(a.CollectedAt)-new Date(b.CollectedAt));
    const latest = playerData[playerData.length-1];
    const previous = playerData[playerData.length-2] || latest;



    let avatarURL = `https://edominations.com/public/upload/citizen/${latest.ID}.webp`;
    let flagURL = `https://www.edominations.com/public/game/flags/shiny/24/${latest.CS}.webp`;

    let html = `
        <div style="display:flex; gap:10px; margin-bottom:10px;">
            <img src="${avatarURL}" style="width:100px;height:100px;border-radius:50%;" onerror="this.src='default-avatar.jpg'">
            <div>
                <h2>${latest.Name} (ID: ${latest.ID})</h2>
                <p><b>CS:</b> ${latest.CS} <img src="${flagURL}" style="width:30px;height:25px;" onerror="this.style.display='none'"> | <b>Last Seen:</b> ${latest.LastSeen}</p>
            </div>
        </div>
        <table style="width:100%; color:white; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>Stat</th>
                    <th>Current</th>
                    <th>Last 1 Day</th>
                    <th>Last 7 Days</th>
                    <th>Last 30 Days</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
    `;

    const now = new Date(latest.CollectedAt);
    const date7 = new Date(now); date7.setDate(now.getDate()-7);
    const date30 = new Date(now); date30.setDate(now.getDate()-30);

    sections.forEach(s=>{
        const current = latest[s]||0;
        const prev = previous[s]||0;
        const diffPrev = current-prev;

        const last7 = playerData.filter(d=>new Date(d.CollectedAt)>=date7);
        const diff7 = (last7.at(-1)?.[s]||current) - (last7[0]?.[s]||current);

        const last30 = playerData.filter(d=>new Date(d.CollectedAt)>=date30);
        const diff30 = (last30.at(-1)?.[s]||current) - (last30[0]?.[s]||current);

        html += `<tr>
            <td>${s}</td>
            <td style="text-align:right;">${current.toLocaleString('en-US')}</td>
            <td style="text-align:right; color:${diffPrev>=0?'lightgreen':'red'};">${diffPrev>=0?'+':''}${diffPrev.toLocaleString('en-US')}</td>
            <td style="text-align:right; color:${diff7>=0?'lightgreen':'red'};">${diff7>=0?'+':''}${diff7.toLocaleString('en-US')}</td>
            <td style="text-align:right; color:${diff30>=0?'lightgreen':'red'};">${diff30>=0?'+':''}${diff30.toLocaleString('en-US')}</td>
            <td style="text-align:right;">${latest.CollectedAt.split(' ')[0]}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('citizenCard').innerHTML = html;
}

const toggle = document.getElementById("dataViewToggle");
const label = document.getElementById("dataViewLabel");

if(toggle){
    toggle.onchange = ()=>{
        currentViewMode = toggle.checked ? 'countries' : 'players';
        label.textContent = toggle.checked ? 'Countries' : 'Players';
        renderHomePage();
    };
}

const closeCitizenBtn = document.getElementById('closeCitizenBtn');
if(closeCitizenBtn){
    closeCitizenBtn.addEventListener('click', ()=>{
        document.getElementById('citizenContainer').style.display = 'none';
        document.getElementById('homeContainer').style.display = 'grid';
    });
}

reloadDashboard();
