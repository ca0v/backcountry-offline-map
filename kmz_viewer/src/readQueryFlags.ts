
export function readQueryFlags() {
    const flags = new URLSearchParams(window.location.search);
    const result: { [key: string]: boolean; } = {};
    for (const [key, value] of flags.entries()) {
        result[key] = value === "1";
    }
    return result as {
        reinstall: boolean;
        clear_cache: boolean;
        clear_code_cache: boolean;
        clear_tile_cache: boolean;
    };
}
