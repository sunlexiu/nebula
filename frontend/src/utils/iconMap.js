// src/utils/iconMap.js
const MAP = {
    connection: 'icon-connection',
    database: 'icon-database',
    schema: 'icon-schema',
    group: 'icon-folder',
    table: 'icon-table',
    view: 'icon-view',
    function: 'icon-function',
    sequence: 'icon-sequence',
    materialized_view: 'icon-mview',
    extension: 'icon-extension',
    publication: 'icon-publication',
    subscription: 'icon-subscription',
    role: 'icon-role',
    user: 'icon-user',
    routine: 'icon-routine',
    trigger: 'icon-trigger',
    event: 'icon-event',
    error: 'icon-error',
    default: 'icon-default'
};

export function toIconClass(iconKey, type) {
    if (iconKey && MAP[iconKey]) return MAP[iconKey];
    if (type && MAP[type]) return MAP[type];
    return MAP.default;
}
