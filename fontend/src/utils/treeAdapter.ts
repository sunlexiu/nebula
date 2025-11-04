// src/utils/treeAdapter.js
import { toIconClass } from './iconMap';

export function adaptChildren(yamlNodes, connectionId) {
    return yamlNodes.map(n => adaptNode(n, connectionId));
}

export function adaptNode(n, connectionId) {
    const meta = n.meta || {};
    const id = n.key || `${n.type}:${n.label}:${Math.random().toString(36).slice(2, 8)}`;

    const out = {
        id,
        key: id,
        type: n.type,
        name: n.label,
        hasChildren: n.hasChildren,

        icon: toIconClass(n.icon, n.type),

        _ctx: {
            connectionId,
            database: meta.database,
            schema: meta.schema,
            catalog: meta.catalog
        },

        actions: Array.isArray(n.actions) ? n.actions.map(adaptAction) : [],
        badges: Array.isArray(n.badges) ? n.badges : [],
        database: undefined as string | undefined,
        schema: undefined as string | undefined
    };

    if (n.type === 'database') out.database = n.label;
    if (n.type === 'schema') {
        out.database = meta.database;
        out.schema = n.label;
    }
    return out;
}

function adaptAction(a) {
    return {
        id: a.id,
        label: a.label,
        iconClass: toIconClass(a.icon, 'action'),
        kind: a.kind || 'custom',
        confirm: !!a.confirm,
        danger: !!a.danger,
        payloadTemplate: a.payloadTemplate || null,
        extra: a.extra || null
    };
}

