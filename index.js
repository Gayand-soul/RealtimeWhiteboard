
// index.js - KORRIGERAD KOD
document.addEventListener('DOMContentLoaded', function() {
    // ✅ INITIERA FIREBASE FÖRST!
    if (typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
    } else {
        console.error('firebaseConfig is not defined');
        return;
    }

    // ✅ AUTO-SHOW LOGIN ON GITHUB PAGES
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Auto-login endast på localhost
        firebase.auth().signInWithEmailAndPassword("testtim@example.com", "test1234")
            .then((userCredential) => {
                console.log("Auto-inloggad som testanvändare");
                initWhiteboard();
            })
            .catch((error) => {
                console.log("Auto-inloggning misslyckades", error);
                showLoginButton();
            });
    } else {
        // På GitHub Pages: visa alltid login-knapp direkt
        showLoginButton();
    }
});

// ✅ GÖR FUNKTIONERNA GLOBALA SÅ DE KAN ANROPAS FRÅN HTML
window.showLoginButton = function() {
    // Ta bort eventuell befintlig login-knapp först
    const existingBtn = document.querySelector('#login-btn');
    if (existingBtn) existingBtn.remove();
    
    const loginBtn = document.createElement('button');
    loginBtn.id = 'login-btn';
    loginBtn.textContent = 'Logga in som Testanvändare';
    loginBtn.style.cssText = `
        padding: 15px 30px;
        font-size: 18px;
        margin: 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
    `;
    loginBtn.onclick = function() {
        firebase.auth().signInWithEmailAndPassword("testtim@example.com", "test1234")
            .then(() => {
                loginBtn.remove();
                initWhiteboard();
            })
            .catch(error => {
                console.error("Inloggningsfel:", error);
                alert("Inloggning misslyckades: " + error.message);
            });
    };
    document.body.appendChild(loginBtn);
};

function showLoginForm() {
    const formHTML = `
        <div id="login-form" style="padding: 20px; background: #f5f5f5; border-radius: 10px; margin: 20px;">
            <h3>Logga in</h3>
            <input type="email" id="email" placeholder="Email" style="padding: 10px; margin: 5px; width: 200px;">
            <input type="password" id="password" placeholder="Lösenord" style="padding: 10px; margin: 5px; width: 200px;">
            <button onclick="manualLogin()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Logga in
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', formHTML);
}
window.manualLogin = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert("Vänligen fyll i både email och lösenord");
        return;
    }
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            const loginForm = document.getElementById('login-form');
            if (loginForm) loginForm.remove();
            initWhiteboard();
        })
        .catch(error => {
            console.error("Inloggningsfel:", error);
            alert("Inloggning misslyckades: " + error.message);
        });
};

//initera whiteboard
function initWhiteboard() {
  // Här startar du din whiteboard funktionalitet
  console.log("Whiteboard redo!");

    // ✅ FORCE LOGIN CHECK - NY KOD
    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Du måste logga in för att rita med andra!");
        showLoginButton();
        return; // Stoppa whiteboard tills användaren loggar in
    }

    // ✅ INITIERA FIREBASE DATABASE
    const database = firebase.database();
    const drawingsRef = database.ref('drawings');
    
    // 🎨 Lyssna på nya ritningar från andra
    drawingsRef.on('child_added', (snapshot) => {
        const drawing = snapshot.val();
        drawRemoteLine(drawing);
    });
     // ✏️ När användaren ritar - skicka till Firebase
    const originalDraw = draw;
    draw = function(e) {
        if (!isDrawing) return;
        
        // Rita lokalt först
        originalDraw(e);
        
        // Skicka till Firebase
        const drawingData = {
            x1: lastX,
            y1: lastY,
            x2: e.offsetX,
            y2: e.offsetY,
            color: currentColor,
            tool: currentTool,
            size: currentSize,
            timestamp: Date.now(),
            userId: firebase.auth().currentUser.uid // 👈 Lägg till user ID
        };

        database.ref('drawings').push(drawingData);
        
        drawingsRef.push(drawingData);
        [lastX, lastY] = [e.offsetX, e.offsetY];
    };
    
    // 🧹 Rensa även från Firebase
    const originalClear = document.getElementById('clear-btn').onclick;
    document.getElementById('clear-btn').onclick = () => {
        // Rensa lokalt
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Rensa Firebase
        drawingsRef.remove();
        
        // Behåll originalfunktionen om den finns
        if (originalClear) originalClear();
    };
}

// 🎨 Funktion för att rita linjer från Firebase
function drawRemoteLine(drawing) {
    drawLine(
        drawing.x1, 
        drawing.y1, 
        drawing.x2, 
        drawing.y2, 
        drawing.color, 
        drawing.tool, 
        drawing.size
    );
}


// Hämta canvas-elementet
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

// Ange canvas-storlek
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Fyll canvas med vit bakgrund
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Variabler för att hålla reda på ritläge
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pencil';
let currentColor = '#000000';
let currentSize = 5; // Standardtjocklek

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

// Storleksreglage
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');

// Uppdatera storleken när reglaget ändras
sizeSlider.addEventListener('input', function() {
    currentSize = parseInt(this.value);
    sizeValue.textContent = currentSize + 'px';
});

// Initiera visa storlek vid start
sizeValue.textContent = currentSize + 'px';

// Rita en linje på canvas
function drawLine(x1, y1, x2, y2, color, tool, size) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    
    // Använd currentSize för pennan och gör suddgummit 3x större
    ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
    
    ctx.lineCap = 'round';
    ctx.stroke();
}

// Lyssna på musklick
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Lyssna på touch-events för mobila enheter
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    
    // Rita lokalt
    drawLine(lastX, lastY, e.offsetX, e.offsetY, currentColor, currentTool, currentSize);
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

// Rensa whiteboard-funktion
document.getElementById('clear-btn').addEventListener('click', () => {
    // Rensa canvas genom att fylla med vit färg
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// Initiera appen när allt är laddat
document.addEventListener('DOMContentLoaded', function() {
    console.log('Whiteboard app laddad utan inloggning');
});