let coinsData = [];
let currentTheme = 'dark';
let activeSymbol = 'BTC';

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    if (body.classList.contains('dark-theme')) {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.innerText = '☀️';
        currentTheme = 'light';
    } else {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.innerText = '🌙';
        currentTheme = 'dark';
    }
    if (document.getElementById('market-view').style.display !== 'none') {
        loadChart(activeSymbol);
    }
}

function showSection(section) {
    const home = document.getElementById('home-view');
    const market = document.getElementById('market-view');
    if (section === 'market') {
        home.style.display = 'none';
        market.style.display = 'flex';
        if (coinsData.length === 0) fetchCoins();
    } else {
        home.style.display = 'flex';
        market.style.display = 'none';
    }
}

async function fetchCoins() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1');
        const allData = await response.json();
        const binanceRes = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const binanceData = await binanceRes.json();
        const binanceSymbols = new Set(binanceData.symbols.map(s => s.baseAsset.toLowerCase()));

        coinsData = allData.filter(coin => binanceSymbols.has(coin.symbol.toLowerCase())).slice(0, 100);
        renderList(coinsData);
        updateHomePrices();
        document.getElementById('verified-count').innerText = coinsData.length + "+";

        if (coinsData.length > 0) {
            const first = coinsData[0];
            selectCoin(first.id, first.symbol.toUpperCase(), first.name, first.current_price, first.market_cap);
        }
    } catch (error) {
        document.getElementById('coin-list').innerHTML = `<div style="padding:20px; color:orange">Eroare conexiune.</div>`;
    }
}

function updateHomePrices() {
    const btc = coinsData.find(c => c.symbol.toLowerCase() === 'btc');
    const eth = coinsData.find(c => c.symbol.toLowerCase() === 'eth');
    if (btc) document.getElementById('home-btc').innerText = `$${btc.current_price.toLocaleString()}`;
    if (eth) document.getElementById('home-eth').innerText = `$${eth.current_price.toLocaleString()}`;
}

function renderList(data) {
    const container = document.getElementById('coin-list');
    container.innerHTML = data.map(coin => `
        <div class="coin-row" onclick="selectCoin('${coin.id}', '${coin.symbol.toUpperCase()}', '${coin.name}', '${coin.current_price}', '${coin.market_cap}')">
            <div>
                <b>${coin.symbol.toUpperCase()}</b>
                <small style="color: var(--text-dim); display:block; font-size:0.7rem">${coin.name}</small>
            </div>
            <div style="text-align:right">
                <span style="display:block; font-weight:700;">$${coin.current_price.toLocaleString()}</span>
                <span style="color: ${coin.price_change_percentage_24h >= 0 ? '#0ecb81' : '#ff4d4d'}; font-size:0.7rem">
                    ${coin.price_change_percentage_24h?.toFixed(2)}%
                </span>
            </div>
        </div>
    `).join('');
}

function selectCoin(id, symbol, name, price, mcap) {
    activeSymbol = symbol;
    document.getElementById('active-coin-name').innerText = name;
    document.getElementById('active-coin-symbol').innerText = `${symbol}/USDT`;
    document.getElementById('active-price').innerText = `$${parseFloat(price).toLocaleString()}`;
    document.getElementById('active-mcap').innerText = `$${(mcap / 1000000000).toFixed(1)}B`;
    loadChart(symbol);

    // Scroll la grafic pe mobil
    if (window.innerWidth < 1024) {
        document.querySelector('.analysis-zone').scrollIntoView({ behavior: 'smooth' });
    }
}

function loadChart(symbol) {
    document.getElementById('tradingview_widget').innerHTML = '';
    new TradingView.widget({
        "autosize": true,
        "symbol": `BINANCE:${symbol}USDT`,
        "interval": "D",
        "theme": currentTheme,
        "style": "1",
        "locale": "ro",
        "container_id": "tradingview_widget"
    });
}

function filterCoins() {
    const query = document.getElementById('coinSearch').value.toLowerCase();
    const filtered = coinsData.filter(c => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query));
    renderList(filtered);
}

fetchCoins();