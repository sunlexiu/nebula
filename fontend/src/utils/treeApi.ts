// src/utils/treeApi.js
export async function fetchChildren(connectionId, nodeKey) {
    const resp = await fetch('/api/tree/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, nodeKey })
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${txt}`);
    }
    const json = await resp.json();
    if (json.code !== 0) {
        throw new Error(json.message || 'tree api error');
    }
    return Array.isArray(json.data) ? json.data : [];
}

// =========================================