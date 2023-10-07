export class EventManager {
    private events = new Map<string, Array<(data: any) => void>>();

    off() {
        this.events.clear();
    }

    on(event: string, callback: (data: any) => void) {
        const callbacks = this.events.get(event) || [];
        callbacks.push(callback);
        this.events.set(event, callbacks);
        return {
            off: () => {
                const callbacks = this.events.get(event) || [];
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    trigger(event: string, data: any) {
        const callbacks = this.events.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
}
