let processes = [];

function resetFields() {
  document.getElementById("processName").value = "";
  document.getElementById("allocated").value = "";
  document.getElementById("requested").value = "";
}

function addProcess() {
  const pid = document.getElementById("processName").value.trim();
  const allocated = document.getElementById("allocated").value.trim().split(',').map(r => r.trim()).filter(Boolean);
  const requested = document.getElementById("requested").value.trim().split(',').map(r => r.trim()).filter(Boolean);

  if (!pid || allocated.length === 0 || requested.length === 0) {
    alert("All fields are required.");
    return;
  }

  processes.push({ pid, allocated, requested });

  const list = document.getElementById("processList");
  const li = document.createElement("li");
  li.textContent = `${pid} - Allocated: [${allocated.join(", ")}] | Requested: [${requested.join(", ")}]`;
  list.appendChild(li);

  resetFields();

  // Check deadlock status after adding a process
  checkDeadlock();
}

function buildGraph() {
  const graph = {};

  processes.forEach(p => {
    const processNode = `P_${p.pid}`;
    graph[processNode] = graph[processNode] || [];

    p.requested.forEach(r => {
      graph[processNode].push(`R_${r}`);
    });

    p.allocated.forEach(r => {
      const resNode = `R_${r}`;
      graph[resNode] = graph[resNode] || [];
      graph[resNode].push(processNode);
    });
  });

  return graph;
}

function detectCycle(graph) {
  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && dfs(neighbor)) return true;
        else if (recStack.has(neighbor)) return true;
      }
    }
    recStack.delete(node);
    return false;
  }

  for (const node in graph) {
    if (dfs(node)) return true;
  }

  return false;
}

function checkDeadlock() {
  const output = document.getElementById("output");
  const graph = buildGraph();
  const hasCycle = detectCycle(graph);

  output.innerHTML = hasCycle
    ? `<span style='color:red'>Deadlock detected! Select a condition to break.</span>`
    : `<span style='color:limegreen'>No Deadlock Detected.</span>`;

  visualizeConditions();
}

function preventDeadlock() {
  const selected = document.getElementById("conditionSelect").value;
  const output = document.getElementById("output");

  const graphBefore = buildGraph();
  const deadlockBefore = detectCycle(graphBefore);

  switch (selected) {
    case "hold-and-wait":
      processes = processes.map(p => ({
        ...p,
        requested: [...p.allocated, ...p.requested],
        allocated: []
      }));
      const graphAfterHW = buildGraph();
      const deadlockAfterHW = detectCycle(graphAfterHW);
      output.innerHTML = deadlockAfterHW
        ? "<span style='color:red'>Tried breaking Hold and Wait, but deadlock still exists.</span>"
        : "<span style='color:orange'>Deadlock prevented by breaking Hold and Wait condition.</span>";
      break;

    case "no-preemption":
      processes = processes.map(p => ({
        ...p,
        allocated: []
      }));
      const graphAfterNP = buildGraph();
      const deadlockAfterNP = detectCycle(graphAfterNP);
      output.innerHTML = deadlockAfterNP
        ? "<span style='color:red'>Tried breaking No Preemption, but deadlock still exists.</span>"
        : "<span style='color:orange'>Deadlock prevented by breaking No Preemption condition.</span>";
      break;

   case "circular-wait":
  // Enforce a strict global resource order: A < B < C < ...
  const resourceOrder = (r) => r.charCodeAt(0); // Simple ASCII order

  const isValidOrder = (proc) => {
    const allResources = [...proc.allocated, ...proc.requested];
    const orderValues = allResources.map(resourceOrder);
    for (let i = 1; i < orderValues.length; i++) {
      if (orderValues[i] < orderValues[i - 1]) return false;
    }
    return true;
  };

  const valid = processes.every(isValidOrder);

  const graphAfterCW = buildGraph();
  const deadlockAfterCW = detectCycle(graphAfterCW);
  output.innerHTML = (deadlockBefore && !deadlockAfterCW && valid)
    ? "<span style='color:lightblue'>Deadlock removed by breaking Circular Wait through global ordering.</span>"
    : "<span style='color:red'>Deadlock could not be removed by breaking Circular Wait. Reordering is not sufficient.</span>";
  break;


    case "mutual-exclusion":
      output.innerHTML = "<span style='color:red'>Mutual Exclusion cannot be broken. Deadlock persists due to exclusive resource needs.</span>";
      break;

    default:
      output.innerHTML = "<span style='color:gray'>Please select a valid condition.</span>";
  }

  visualizeConditions();
  //checkDeadlock();
}

function visualizeConditions() {
  const area = document.getElementById("visualization");
  area.innerHTML = "";

  if (processes.length === 0) return;

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.innerHTML = `<tr>
    <th style="border:1px solid #ddd; padding:8px;">Process</th>
    <th style="border:1px solid #ddd; padding:8px;">Allocated</th>
    <th style="border:1px solid #ddd; padding:8px;">Requested</th>
  </tr>`;

  processes.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="border:1px solid #ddd; padding:8px;">${p.pid}</td>
      <td style="border:1px solid #ddd; padding:8px;">${p.allocated.join(", ")}</td>
      <td style="border:1px solid #ddd; padding:8px;">${p.requested.join(", ")}</td>
    `;
    table.appendChild(row);
  });

  area.appendChild(table);
}

function clearProcesses() {
  processes = [];
  document.getElementById("processList").innerHTML = "";
  document.getElementById("output").innerHTML = "";
  document.getElementById("visualization").innerHTML = "";
}
