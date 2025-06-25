document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Element Selectors ---
    // Get references to the essential parts of the UI we need to manipulate.
    const stage = document.querySelector('#stage');
    const slist = document.querySelector('#slist');
    const criticalSectionDiv = document.querySelector('#critical-section');
    const numProcessesInput = document.querySelector('#numProcesses');
    const numMutexesInput = document.querySelector('#numMutexes');
    const mutexValueSpan = document.querySelector('#val');
    const startButton = document.querySelector('#strbtn');
    const stopButton = document.querySelector('#stpbtn');

    // --- 2. Simulation State Variables ---
    // These arrays and variables will hold the state of our simulation.
    let mutexes = [];     // Array to track the state of each mutex (1 = free, 0 = locked)
    let processes = [];   // Array to hold the DOM elements for each process
    let intervals = [];   // Array to keep track of all running setIntervals so we can stop them

    /**
     * @function initializeSimulation
     * Resets the simulation to its starting state. Clears all processes,
     * mutexes, logs, and intervals from the previous run. It then reads the
     * user's input and sets up the new simulation.
     */
    function initializeSimulation() {
        // Clear previous state
        stage.innerHTML = '';
        slist.innerHTML = '';
        intervals.forEach(clearInterval); // Stop all previously running timers
        intervals = [];
        mutexes = [];
        processes = [];
        criticalSectionDiv.style.backgroundColor = ""; // Reset CS color

        // Get user inputs, defaulting to 0 if empty
        const numProcesses = parseInt(numProcessesInput.value) || 0;
        const numMutexes = parseInt(numMutexesInput.value) || 0;

        // Validate input
        if (numProcesses === 0 || numMutexes === 0) {
            let li = document.createElement('li');
            li.innerHTML = `Please set a valid number of processes and mutexes.`;
            slist.appendChild(li);
            return; // Exit if input is invalid
        }

        // Initialize mutexes array (all are free initially)
        for (let i = 0; i < numMutexes; i++) {
            mutexes.push(1); // 1 means the mutex is available
        }
        updateMutexDisplay();

        // Create and display process elements
        for (let i = 0; i < numProcesses; i++) {
            let process = document.createElement('div');
            process.className = "process";
            process.id = "P" + i;
            process.textContent = `P${i}`;
            process.style.animationPlayState = "paused"; // Animation is paused by default
            stage.appendChild(process);
            processes.push(process);
        }

        // Log the start of the simulation
        let li = document.createElement('li');
        li.innerHTML = `Simulation started with ${numProcesses} processes and ${numMutexes} mutexes.`;
        slist.appendChild(li);
    }

    /**
     * @function updateMutexDisplay
     * Updates the UI to show the current status (Free/Locked) of all mutexes.
     */
    function updateMutexDisplay() {
        mutexValueSpan.innerHTML = mutexes.map((status, index) =>
            `M${index}: ${status === 1 ? 'Free' : 'Locked'}`
        ).join(' | ');
    }

    // --- 3. Event Listeners ---

    /**
     * @event 'click' on Start Button
     * This is the main trigger for the simulation. It initializes the environment
     * and then starts the lifecycle for each process.
     */
    startButton.addEventListener('click', () => {
        initializeSimulation();
        if (processes.length === 0) return; // Don't run if initialization failed

        processes.forEach((process) => {
            // Start the CSS animation for the process circle
            process.style.animationPlayState = "running";

            // --- A. Process Completion Logic ---
            // This event fires when the CSS animation for a process finishes.
            process.addEventListener('animationend', () => {
                const mutexIndex = process.dataset.mutexIndex;
                // If the process had acquired a mutex, release it now.
                if (mutexIndex !== undefined) {
                    mutexes[parseInt(mutexIndex)] = 1; // Release by setting state to 1
                    updateMutexDisplay();
                }
                let li = document.createElement('li');
                li.innerHTML = `✅ Process ${process.id} has completed its task.`;
                slist.appendChild(li);
            }, { once: true }); // 'once: true' ensures this listener runs only one time

            // --- B. Process Entry & Mutex Acquisition Logic ---
            // Simulate the time it takes for the process to travel to the entry section.
            setTimeout(() => {
                // Pause the animation to simulate waiting for a mutex.
                process.style.animationPlayState = "paused";
                let li = document.createElement('li');
                li.innerHTML = `⏳ Process ${process.id} is waiting to enter the critical section...`;
                slist.appendChild(li);

                // Start an interval timer to repeatedly check for a free mutex.
                let interval = setInterval(() => {
                    // Check only if the process is still in the "paused" (waiting) state.
                    if (process.style.animationPlayState === "paused") {
                        // **CRITICAL LOGIC**: Find the index of the first available mutex.
                        const availableMutexIndex = mutexes.findIndex(status => status === 1);

                        // If an available mutex was found (findIndex returns > -1)
                        if (availableMutexIndex > -1) {
                            // 1. Acquire the Mutex
                            mutexes[availableMutexIndex] = 0; // Lock it by setting state to 0
                            process.dataset.mutexIndex = availableMutexIndex; // Store which mutex this process took
                            updateMutexDisplay();

                            // 2. Resume the Process
                            process.style.animationPlayState = "running";
                            criticalSectionDiv.style.backgroundColor = "#cf6679"; // Visually highlight the CS
                            
                            let li = document.createElement('li');
                            li.innerHTML = `🔴 Process ${process.id} acquired Mutex ${availableMutexIndex} and entered Critical Section.`;
                            slist.appendChild(li);
                            
                            // 3. Stop checking for a mutex, as we've found one.
                            clearInterval(interval);
                        }
                    } else {
                        // If the process is no longer paused, we don't need to check anymore.
                        clearInterval(interval);
                    }
                }, 100); // Check for a free mutex every 100 milliseconds.
                intervals.push(interval); // Store interval to be able to stop it globally.
            }, 3000); // 3-second (3000ms) travel time to the entry section gate.
        });
    });

    /**
     * @event 'click' on Stop Button
     * Pauses all animations and clears all running timers to halt the simulation.
     */
    stopButton.addEventListener('click', () => {
        processes.forEach((process) => {
            process.style.animationPlayState = "paused";
        });
        intervals.forEach(clearInterval); // Stop all pending mutex checks
        let li = document.createElement('li');
        li.innerHTML = `🛑 Simulation stopped by user.`;
        slist.appendChild(li);
    });

    // --- 4. Initial Run ---
    // Call initializeSimulation once when the page loads to set up the initial UI.
    initializeSimulation();
});