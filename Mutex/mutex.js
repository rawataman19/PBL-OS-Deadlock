document.addEventListener('DOMContentLoaded', () => {
    let stage = document.querySelector('#stage');
    let slist = document.querySelector('#slist');
    let mutexes = [];
    let processes = [];
    let atCriticalSection = new Map();
    let intervals = [];

    function initializeSimulation() {
        // Clear previous content
        stage.innerHTML = '<span style="height:35px; width: 100%; display: flex; padding-top: 10px;justify-content: center; font-size: auto; background-color: #a7a4a4;">PROCESS</span>';
        slist.innerHTML = '';
        mutexes = [];
        processes = [];
        atCriticalSection.clear();
        intervals.forEach(clearInterval);
        intervals = [];

        // Get user inputs
        const numProcesses = parseInt(document.querySelector('#numProcesses').value)|"" ;
        const numMutexes = parseInt(document.querySelector('#numMutexes').value) | "";

        // Initialize mutexes
        for (let i = 0; i < numMutexes; i++) {
            mutexes.push(1); // 1 means available, 0 means locked
        }
        updateMutexDisplay();

        // Create processes
        for (let i = 0; i < numProcesses; i++) {
            let process = document.createElement('div');
            process.className = "process";
            process.id = "P" + i;
            process.innerHTML = `<span style="color:white;">P${i}</span>`;
            process.style.animationPlayState = "paused";
            stage.appendChild(process);
            processes.push(process);
            atCriticalSection.set(process.id, false);
        }

        let li = document.createElement('li');
        li.innerHTML = `Number of processes: ${numProcesses}, Number of mutexes: ${numMutexes}`;
        slist.appendChild(li);
    }

    function updateMutexDisplay() {
        document.querySelector('#val').innerHTML = mutexes.map((val, idx) => `M${idx}: ${val}`).join(', ');
    }

    initializeSimulation();

    document.querySelector('#strbtn').addEventListener('click', () => {
        initializeSimulation(); // Reinitialize on start
        processes.forEach((process) => {
            process.style.animationPlayState = "running";

            // Assign a random mutex to each process
            const mutexIndex = Math.floor(Math.random() * mutexes.length);

            process.addEventListener('webkitAnimationEnd', () => {
                mutexes[mutexIndex] = 1;
                updateMutexDisplay();
                let li = document.createElement('li');
                li.innerHTML = `Process ${process.id} -> Completed (Mutex ${mutexIndex})`;
                slist.appendChild(li);
                document.querySelector('#critical').style.backgroundColor = "rgb(39, 46, 46)";
            }, { once: true });

            setTimeout(() => {
                process.style.animationPlayState = "paused";
                atCriticalSection.set(process.id, true);
            }, 3000);

            let interval = setInterval(() => {
                if (atCriticalSection.get(process.id) && mutexes[mutexIndex] === 1) {
                    mutexes[mutexIndex] = 0;
                    updateMutexDisplay();
                    process.style.animationPlayState = "running";
                    document.querySelector('#critical').style.backgroundColor = "red";
                    let li = document.createElement('li');
                    li.innerHTML = `Process ${process.id} -> Critical State (Mutex ${mutexIndex})`;
                    slist.appendChild(li);
                    clearInterval(interval);
                }
            }, 100);
            intervals.push(interval);
        });
    });

    document.querySelector('#stpbtn').addEventListener('click', () => {
        processes.forEach((process) => {
            process.style.animationPlayState = "paused";
        });
        intervals.forEach(clearInterval);
        intervals = [];
        let li = document.createElement('li');
        li.innerHTML = `Simulation stopped`;
        slist.appendChild(li);
    });
});