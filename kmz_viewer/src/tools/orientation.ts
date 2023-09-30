let orientation = { alpha: 0, beta: 0, gamma: 0 };
type Orientation = { alpha: number, beta: number, gamma: number };

const listeners = [] as ((event: Orientation) => void)[];

window.addEventListener("deviceorientationabsolute", (event) => {
    orientation = event as any as { alpha: number, beta: number, gamma: number };
    listeners.forEach(listener => listener(orientation));
}, true);

export function getOrientation() {
    return orientation;
}

export function onOrientation(cb: (event: Orientation) => void) {
    listeners.push(cb);
    cb(orientation)
}