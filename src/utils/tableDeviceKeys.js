export const TABLE_DEVICE_KEYS_STORAGE_KEY = "table_device_keys";

const legacyTableDeviceKey = (tableId) => `table-device:${tableId}`;

export const getStoredTableDeviceKeys = () => {
    try {
        const storedKeys = JSON.parse(
            localStorage.getItem(TABLE_DEVICE_KEYS_STORAGE_KEY) || "{}"
        );

        return storedKeys && typeof storedKeys === "object" && !Array.isArray(storedKeys)
            ? storedKeys
            : {};
    } catch {
        return {};
    }
};

export const getStoredTableDeviceKey = (tableId) => {
    const normalizedTableId = String(tableId || "");
    const storedKeys = getStoredTableDeviceKeys();

    if (storedKeys[normalizedTableId]) return storedKeys[normalizedTableId];

    try {
        const legacyDevice = JSON.parse(
            localStorage.getItem(legacyTableDeviceKey(normalizedTableId)) || "null"
        );

        return (
            legacyDevice?.device_key ??
            legacyDevice?.device?.device_key ??
            legacyDevice?.table_device?.device_key ??
            ""
        );
    } catch {
        return "";
    }
};

export const saveStoredTableDeviceKey = (tableId, deviceKey) => {
    const normalizedTableId = String(tableId || "");

    if (!normalizedTableId || !deviceKey) return;

    const storedKeys = getStoredTableDeviceKeys();
    storedKeys[normalizedTableId] = String(deviceKey);
    localStorage.setItem(TABLE_DEVICE_KEYS_STORAGE_KEY, JSON.stringify(storedKeys));
};

export const removeStoredTableDeviceKey = (tableId) => {
    const normalizedTableId = String(tableId || "");
    const storedKeys = getStoredTableDeviceKeys();

    delete storedKeys[normalizedTableId];
    localStorage.setItem(TABLE_DEVICE_KEYS_STORAGE_KEY, JSON.stringify(storedKeys));
    localStorage.removeItem(legacyTableDeviceKey(normalizedTableId));
};
