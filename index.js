// Hämta canvas-elementet
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

// Ange canvas-storlek
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Variabler för att hålla reda på ritläge
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pencil';
let currentColor = '#000000';

// Uppdatera verktygsindikatorn
function updateToolIndicator() {
    const toolNameElement = document.getElementById('current-tool-name');
    const toolIndicator = document.getElementById('current-tool-indicator');
    
    // Uppdatera texten
    toolNameElement.textContent = currentTool === 'pencil' ? 'Penna' : 'Suddgummi';
    
    // Uppdatera färgindikatorn
    if (currentTool === 'pencil') {
        toolIndicator.style.backgroundColor = currentColor;
        toolIndicator.style.border = 'none';
    } else {
        toolIndicator.style.backgroundColor = '#FFFFFF';
        toolIndicator.style.border = '1px solid #000';
    }
}

// Rita en linje på canvas
function drawLine(x1, y1, x2, y2, color, tool) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
}

// Lyssna på musklick
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    
    // Rita lokalt
    drawLine(lastX, lastY, e.offsetX, e.offsetY, currentColor, currentTool);
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

// Välja verktyg
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        
        // Uppdatera verktygsindikatorn
        updateToolIndicator();
    });
});

// Välja färg
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentColor = option.dataset.color;
        
        // Uppdatera verktygsindikatorn OM vi använder pennverktyget
        if (currentTool === 'pencil') {
            updateToolIndicator();
        }
    });
});

// Uppdatera indikatorn vid start
updateToolIndicator();