export function readLocalStorage(name: string) {
    const value = localStorage.getItem(name);
    return value ? JSON.parse(value) : null;
}
export function writeLocalStorage(name: string, value: any) {
    localStorage.setItem(name, JSON.stringify(value));
}
