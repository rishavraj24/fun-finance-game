// --- Wait for the DOM to be fully loaded before running the game ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Game State Variables ---
    const players = [
        { id: 1, name: 'Player 1', money: 1500, position: 0, pieceElement: null },
        { id: 2, name: 'Player 2', money: 1500, position: 0, pieceElement: null }
    ];
    let currentPlayerIndex = 0;

    // --- Board Configuration (Data for each tile) ---
    const boardTiles = [
        { name: "START", type: "start" },
        { name: "Stock Market", type: "asset", cost: 100, income: 10 },
        { name: "Community Chest", type: "chance" },
        { name: "Real Estate", type: "asset", cost: 150, income: 15 },
        { name: "Pay Day", type: "income", amount: 200 },
        { name: "Side Hustle", type: "asset", cost: 50, income: 5 },
        { name: "Unexpected Bill", type: "expense", amount: 75 },
        { name: "Tech Startup", type: "asset", cost: 250, income: 25 },
        { name: "Just Visiting", type: "empty" },
        { name: "Gig Economy", type: "chance" },
        { name: "Crypto", type: "asset", cost: 200, income: 20 },
        { name: "Student Loan", type: "expense", amount: 100 },
        { name: "Freelance Work", type: "income", amount: 150 },
        { name: "Savings Bond", type: "asset", cost: 120, income: 12 },
        { name: "Community Chest", type: "chance" },
        { name: "Small Business", type: "asset", cost: 180, income: 18 },
        { name: "Go To Class", type: "penalty" },
        { name: "Index Fund", type: "asset", cost: 220, income: 22 },
        { name: "Unexpected Bill", type: "expense", amount: 50 },
        { name: "Rental Property", type: "asset", cost: 300, income: 30 },
        { name: "Scholarship", type: "income", amount: 100 },
        { name: "Part-time Job", type: "asset", cost: 80, income: 8 },
        { name: "Community Chest", type: "chance" },
        { name: "401k", type: "asset", cost: 280, income: 28 },
    ];

    // --- DOM Element References ---
    const boardElement = document.getElementById('board');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceDisplay = document.getElementById('dice-display');
    const logElement = document.getElementById('log');
    const turnIndicator = document.getElementById('turn-indicator');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const modalButtons = document.getElementById('modal-buttons');

    // --- Game Initialization ---
    function initGame() {
        createBoard();
        createPlayerPieces();
        updateUI();
        logMessage("Welcome to Fun Finance!");
    }

    // --- Board & Player Piece Creation ---
    function createBoard() {
        boardTiles.forEach((tileData, index) => {
            const tile = document.createElement('div');
            tile.id = `tile-${index}`;
            tile.classList.add('tile');
            
            // Position tiles using grid-area
            const { rowStart, colStart, rowEnd, colEnd } = getGridPosition(index);
            tile.style.gridArea = `${rowStart} / ${colStart} / ${rowEnd} / ${colEnd}`;
            
            if (index === 0 || index === 8 || index === 16 || index === 24) { // Simplified corner check
                 tile.classList.add('corner');
            }

            tile.innerHTML = `<div class="tile-name">${tileData.name}</div>` +
                             (tileData.cost ? `<div class="tile-price">$${tileData.cost}</div>` : '');
            boardElement.appendChild(tile);
        });
    }

    function createPlayerPieces() {
        players.forEach(player => {
            const piece = document.createElement('div');
            piece.id = `player${player.id}-piece`;
            piece.className = 'player-piece';
            player.pieceElement = piece;
            boardElement.appendChild(piece);
            movePlayerPiece(player, 0, true); // Move to start instantly
        });
    }

    // --- UI Update Functions ---
    function updateUI() {
        players.forEach(player => {
            document.getElementById(`player${player.id}-money`).textContent = player.money;
            const infoPanel = document.getElementById(`player${player.id}-info`);
            if (player.id === players[currentPlayerIndex].id) {
                infoPanel.classList.add('active-player');
            } else {
                infoPanel.classList.remove('active-player');
            }
        });
        turnIndicator.textContent = `${players[currentPlayerIndex].name}'s Turn`;
    }

    function logMessage(message) {
        const msgElement = document.createElement('div');
        msgElement.textContent = `- ${message}`;
        logElement.prepend(msgElement);
    }

    // --- Player Movement ---
    function movePlayerPiece(player, newPosition, instant = false) {
        const tileElement = document.getElementById(`tile-${newPosition}`);
        if (!tileElement) return;

        if (instant) player.pieceElement.style.transition = 'none';
        else player.pieceElement.style.transition = 'all 0.5s ease-in-out';

        const tileRect = tileElement.getBoundingClientRect();
        const boardRect = boardElement.getBoundingClientRect();
        
        // Calculate position relative to the board
        let top = tileRect.top - boardRect.top + tileRect.height / 2 - player.pieceElement.offsetHeight / 2;
        let left = tileRect.left - boardRect.left + tileRect.width / 2 - player.pieceElement.offsetWidth / 2;

        // Offset pieces so they don't overlap perfectly
        if (player.id === 2) { left += 5; top -= 5; }

        player.pieceElement.style.transform = `translate(${left}px, ${top}px)`;
    }

    // --- Game Logic ---
    rollDiceBtn.addEventListener('click', () => {
        rollDiceBtn.disabled = true;
        const roll = Math.floor(Math.random() * 6) + 1;
        diceDisplay.textContent = `🎲 ${roll}`;
        logMessage(`${players[currentPlayerIndex].name} rolled a ${roll}.`);

        setTimeout(() => movePlayer(roll), 500);
    });

    function movePlayer(steps) {
        const player = players[currentPlayerIndex];
        const oldPosition = player.position;
        player.position = (player.position + steps) % boardTiles.length;

        if (player.position < oldPosition) {
            player.money += 200;
            logMessage(`${player.name} passed START and collected $200.`);
        }

        movePlayerPiece(player, player.position);
        updateUI();

        setTimeout(() => handleTileAction(player), 600);
    }

    function handleTileAction(player) {
        const tile = boardTiles[player.position];
        logMessage(`${player.name} landed on ${tile.name}.`);

        switch (tile.type) {
            case 'asset':
                if (!tile.owner) {
                    promptBuyAsset(player, tile);
                } else if (tile.owner !== player.id) {
                    payRent(player, tile);
                } else {
                    endTurn();
                }
                break;
            case 'income':
                player.money += tile.amount;
                logMessage(`${player.name} collected $${tile.amount}!`);
                endTurn();
                break;
            case 'expense':
                player.money -= tile.amount;
                logMessage(`${player.name} paid $${tile.amount}.`);
                endTurn();
                break;
            case 'chance':
                drawChanceCard(player);
                break;
            default:
                endTurn();
                break;
        }
    }

    function drawChanceCard(player) {
        const outcomes = [
            { text: "You won a hackathon! Collect $100.", money: 100 },
            { text: "Your bike got a flat tire. Pay $50 for repairs.", money: -50 },
            { text: "Stock dividend! Collect $75.", money: 75 },
            { text: "You forgot your friend's birthday. Pay $25 for a last-minute gift.", money: -25 }
        ];
        const card = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        player.money += card.money;
        logMessage(`Chance: ${card.text}`);
        showModal("Community Chest", card.text, [{ text: "Okay", action: endTurn }]);
    }
    
    function promptBuyAsset(player, tile) {
        const canAfford = player.money >= tile.cost;
        const text = `This asset costs $${tile.cost}. Your balance is $${player.money}.` + 
                     (canAfford ? "" : " You can't afford this.");
        
        const buttons = canAfford ? [
            { text: "Buy", action: () => buyAsset(player, tile), className: 'buy-btn' },
            { text: "Pass", action: endTurn }
        ] : [
            { text: "Okay", action: endTurn }
        ];
        
        showModal(`Buy ${tile.name}?`, text, buttons);
    }

    function buyAsset(player, tile) {
        player.money -= tile.cost;
        tile.owner = player.id;
        logMessage(`${player.name} bought ${tile.name} for $${tile.cost}.`);
        document.getElementById(`tile-${player.position}`).style.borderColor = player.id === 1 ? '#ff5733' : '#33aaff';
        document.getElementById(`tile-${player.position}`).style.borderWidth = '3px';
        endTurn();
    }

    function payRent(player, tile) {
        const owner = players.find(p => p.id === tile.owner);
        player.money -= tile.income;
        owner.money += tile.income;
        logMessage(`${player.name} paid $${tile.income} in rent to ${owner.name}.`);
        endTurn();
    }

    function endTurn() {
        modal.classList.add('hidden');
        updateUI();
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updateUI();
        rollDiceBtn.disabled = false;
    }

    // --- Modal Helper Functions ---
    function showModal(title, text, buttons) {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalButtons.innerHTML = ''; // Clear previous buttons
        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            if (btnInfo.className) button.className = btnInfo.className;
            button.onclick = btnInfo.action;
            modalButtons.appendChild(button);
        });
        modal.classList.remove('hidden');
    }

    // --- Helper for Grid Positioning ---
    function getGridPosition(index) {
        if (index >= 0 && index <= 10) { // Bottom row
            return { rowStart: 11, colStart: 11 - index, rowEnd: 12, colEnd: 12 - index };
        }
        if (index > 10 && index <= 20) { // Left col
             return { rowStart: 11 - (index - 10), colStart: 1, rowEnd: 12 - (index - 10), colEnd: 2 };
        }
         // This is a simplified version. A full version would map all 4 sides.
         // For this example, we'll just map the first few tiles to get started.
         // Defaulting to a safe spot for unmapped tiles.
        return { rowStart: 1, colStart: index + 1, rowEnd: 2, colEnd: index + 2 };
    }

    // --- Start the game ---
    initGame();
});