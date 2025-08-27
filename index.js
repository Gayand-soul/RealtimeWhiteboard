

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCiF3qTlQvYX3rCiSjlqAsUZLsd8Q6UWvg",
  authDomain: "realtime-whiteboard-5be19.firebaseapp.com",
  projectId: "realtime-whiteboard-5be19",
  storageBucket: "realtime-whiteboard-5be19.firebasestorage.app",
  messagingSenderId: "881235709305",
  appId: "1:881235709305:web:1bd84d07fc4309c5adf3a8",
  measurementId: "G-EZ262QFK2N"
};

 // Initiera Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Whiteboard funktionalitet
        document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.getElementById('whiteboard');
            const ctx = canvas.getContext('2d');
            const toolButtons = document.querySelectorAll('.tool-btn');
            const colorOptions = document.querySelectorAll('.color-option');
            const sizeSlider = document.getElementById('size-slider');
            const sizeValue = document.getElementById('size-value');
            const currentToolName = document.getElementById('current-tool-name');
            const currentToolIndicator = document.getElementById('current-tool-indicator');
            const userCountElement = document.getElementById('user-count');
            const userListElement = document.getElementById('user-list');
            const clearButton = document.getElementById('clear-btn');  

            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;
            let selectedTool = 'pencil';
            let selectedColor = '#000000';
            let selectedSize = 5;
            
            // Användar-ID för att identifiera ritningar
            const userId = Math.floor(Math.random() * 1000000);
            const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
            let users = {};

            // Anpassa canvas-storlek
            function resizeCanvas() {
                const container = canvas.parentElement;
                canvas.width = container.clientWidth - 40;
                canvas.height = 600;
                clearCanvas();
                
                // Ladda om ritningen från Firebase när canvas ändrar storlek
                loadDrawingFromFirebase();
            }
            
            // Rensa canvas lokalt
            function clearCanvas() {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Initiera canvas
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Rita en linje på canvas
            function drawLine(x1, y1, x2, y2, color, tool, size, userId, shouldSync = true) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
                ctx.lineWidth = tool === 'eraser' ? size * 3 : size;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                // Synkronisera till Firebase om det behövs
                if (shouldSync) {
                    const drawingData = {
                        x1, y1, x2, y2, 
                        color: tool === 'eraser' ? '#FFFFFF' : color,
                        size: tool === 'eraser' ? size * 3 : size,
                        tool,
                        userId,
                        timestamp: Date.now()
                    };
                    
                    // Skicka till Firebase
                    database.ref('drawings').push(drawingData);
                }
            }
             // Händelsehanterare för mus/tryck
            function startDrawing(e) {
                isDrawing = true;
                const pos = getPosition(e);
                [lastX, lastY] = [pos.x, pos.y];
                
                // Rita en punkt om användaren bara klickar
                drawLine(lastX, lastY, lastX, lastY, selectedColor, selectedTool, selectedSize, userId);
            }
            
            function draw(e) {
                if (!isDrawing) return;
                
                const pos = getPosition(e);
                const currentX = pos.x;
                const currentY = pos.y;
                
                drawLine(lastX, lastY, currentX, currentY, selectedColor, selectedTool, selectedSize, userId);
                
                [lastX, lastY] = [currentX, currentY];
            }
            
            function stopDrawing() {
                isDrawing = false;
            }
            
            function getPosition(e) {
                let x, y;
                
                if (e.type.includes('touch')) {
                    x = e.touches[0].clientX - canvas.getBoundingClientRect().left;
                    y = e.touches[0].clientY - canvas.getBoundingClientRect().top;
                } else {
                    x = e.offsetX;
                    y = e.offsetY;
                }
                
                return { x, y };
            }
             // Ladda ritning från Firebase
            function loadDrawingFromFirebase() {
                database.ref('drawings').once('value', (snapshot) => {
                    const drawings = snapshot.val();
                    if (drawings) {
                        clearCanvas();
                        Object.values(drawings).forEach(drawing => {
                            drawLine(
                                drawing.x1, drawing.y1, 
                                drawing.x2, drawing.y2, 
                                drawing.color, 
                                drawing.tool, 
                                drawing.size,
                                drawing.userId,
                                false
                            );
                        });
                    }
                });
            }
              // Välj verktyg
            toolButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    toolButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedTool = btn.dataset.tool;
                    
                    currentToolName.textContent = selectedTool === 'pencil' ? 'Penna' : 'Suddgummi';
                    
                    if (selectedTool === 'pencil') {
                        currentToolIndicator.style.backgroundColor = selectedColor;
                        currentToolIndicator.style.border = 'none';
                    } else {
                        currentToolIndicator.style.backgroundColor = '#f44336';
                        currentToolIndicator.style.border = '2px solid #fff';
                    }
                });
            });
            
             // Välj färg
            colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    colorOptions.forEach(o => o.classList.remove('active'));
                    option.classList.add('active');
                    selectedColor = option.dataset.color;
                    
                    // Byt tillbaka till penna om färg väljs
                    if (selectedTool === 'eraser') {
                        document.querySelector('[data-tool="pencil"]').click();
                    }
                    currentToolIndicator.style.backgroundColor = selectedColor;
                });
            });
            
            // Uppdatera storlek
            sizeSlider.addEventListener('input', () => {
                selectedSize = sizeSlider.value;
                sizeValue.textContent = `${selectedSize}px`;
            });

             // Rensa whiteboard
            clearButton.addEventListener('click', () => {
                if (confirm('Är du säker på att du vill rensa hela whiteboarden för alla användare?')) {
                    // Ta bort alla ritningar från Firebase
                    database.ref('drawings').remove();
                    clearCanvas();
                }
            });
            
            // Firebase listeners för ritningar
            database.ref('drawings').on('child_added', (snapshot) => {
                const drawing = snapshot.val();
                
                // Rita bara om det inte är från den aktuella användaren
                // (dessa ritningar har redan ritats lokalt)
                if (drawing.userId !== userId) {
                    drawLine(
                        drawing.x1, drawing.y1, 
                        drawing.x2, drawing.y2, 
                        drawing.color, 
                        drawing.tool, 
                        drawing.size,
                        drawing.userId,
                        false
                    );
                }
            });

            // Hantera användare
            const userRef = database.ref('users/' + userId);
            
            // Ange att användaren är online
            userRef.set({
                online: true,
                lastActive: Date.now(),
                color: userColor,
                name: 'Användare ' + Math.floor(Math.random() * 1000)
            });
            
            // När användaren lämnar, ta bort från online-listan
            window.addEventListener('beforeunload', () => {
                userRef.remove();
            });

             // Övervaka användare
            database.ref('users').on('value', (snapshot) => {
                const users = snapshot.val() || {};
                const userCount = Object.keys(users).length;
                userCountElement.textContent = userCount;
                
                // Uppdatera användarlistan
                userListElement.innerHTML = '';
                Object.entries(users).forEach(([id, user]) => {
                    const userElement = document.createElement('div');
                    userElement.className = 'user';
                    userElement.innerHTML = `
                        <div class="user-color" style="background-color: ${user.color};"></div>
                        <span>${user.name}</span>
                    `;
                    userListElement.appendChild(userElement);
                });
            });
             // Mus- och pekskärmsehändelser
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            canvas.addEventListener('touchstart', startDrawing);
            canvas.addEventListener('touchmove', draw);
            canvas.addEventListener('touchend', stopDrawing);
            
            // Förhindra scroll på pekskärm
            canvas.addEventListener('touchmove', e => {
                if (e.target === canvas) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            // Ladda befintlig ritning vid start
            loadDrawingFromFirebase();
        });