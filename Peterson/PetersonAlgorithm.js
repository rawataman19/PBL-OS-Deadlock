document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const readyQueue = document.getElementById('ready-queue');
    const criticalSection = document.getElementById('critical-section');
    const finishedQueue = document.getElementById('finished-queue');
    const logList = document.getElementById('log-list');

    // --- State Variables ---
    const NUM_PROCESSES = 2;
    let turn; // 0 or 1
    let flags = [false, false];
    let simulationInterval;

    // --- Functions ---

    /**
     * Appends a message to the activity log.
     * @param {string} message - The message to log.
     */
    const log = (message) => {
        const li = document.createElement('li');
        li.textContent = message;
        logList.prepend(li); // Add new logs to the top
    };

    /**
     * Initializes the simulation to its starting state.
     */
    const initialize = () => {
        // Clear containers and logs
        readyQueue.innerHTML = '';
        criticalSection.innerHTML = '';
        finishedQueue.innerHTML = '';
        logList.innerHTML = '';
        
        // Stop any ongoing simulation
        if (simulationInterval) {
            clearInterval(simulationInterval);
        }

        // Reset state
        flags = [false, false];
        turn = 0; // P0 gets the first turn
        startButton.disabled = false;

        // Create process elements
        for (let i = 0; i < NUM_PROCESSES; i++) {
            const process = document.createElement('div');
            process.id = `P${i}`;
            process.className = `process process-${i}`;
            process.textContent = `P${i}`;
            readyQueue.appendChild(process);
        }

        log('Simulation reset and ready.');
    };

    /**
     * Moves a process element from a source container to a destination container.
     * @param {number} processId - The ID of the process (0 or 1).
     * @param {HTMLElement} from - The source container.
     * @param {HTMLElement} to - The destination container.
     */
    const moveProcess = (processId, from, to) => {
        const processElement = document.getElementById(`P${processId}`);
        if (processElement) {
            from.removeChild(processElement);
            to.appendChild(processElement);
        }
    };
    
    /**
     * Simulates one step of the algorithm for a given process.
     * @param {number} processId - The ID of the process to run (0 or 1).
     */
    const simulateStep = (processId) => {
        const otherProcessId = 1 - processId;
        const processElement = document.getElementById(`P${processId}`);

        // If process is already finished, do nothing
        if (finishedQueue.contains(processElement)) {
            return;
        }

        // --- Entry Section ---
        // If process wants to enter, set its flag
        if (readyQueue.contains(processElement)) {
            flags[processId] = true;
            log(`P${processId} sets flag to true.`);
            turn = otherProcessId;
            log(`P${processId} sets turn to ${otherProcessId}.`);
        }

        // --- Critical Section Check ---
        // Check if the process can enter the critical section
        if (flags[processId] && (flags[otherProcessId] === false || turn === processId)) {
            if (!criticalSection.hasChildNodes()) {
                log(`P${processId} enters Critical Section!`);
                moveProcess(processId, readyQueue, criticalSection);
                processElement.classList.add('critical');

                // Simulate work in the critical section, then exit
                setTimeout(() => {
                    // --- Exit Section ---
                    log(`P${processId} exits Critical Section.`);
                    flags[processId] = false;
                    log(`P${processId} sets flag to false.`);
                    processElement.classList.remove('critical');
                    moveProcess(processId, criticalSection, finishedQueue);
                    
                    // Check if simulation is complete
                    if (finishedQueue.children.length === NUM_PROCESSES) {
                        log('All processes finished. Simulation complete.');
                        clearInterval(simulationInterval);
                        startButton.disabled = false;
                    }
                }, 3000); // Time spent in critical section
            }
        } else {
             log(`P${processId} is waiting.`);
        }
    };
    
    /**
     * Starts the main simulation loop.
     */
    const startSimulation = () => {
        startButton.disabled = true;
        log('Simulation started...');
        
        // Alternate turns between processes every second
        let currentProcess = 0;
        simulationInterval = setInterval(() => {
            simulateStep(currentProcess);
            currentProcess = 1 - currentProcess; // Switch to the other process
        }, 1500); // Time between process attempts
    };

    // --- Event Listeners ---
    startButton.addEventListener('click', startSimulation);
    resetButton.addEventListener('click', initialize);

    // --- Initial Call ---
    initialize();
});