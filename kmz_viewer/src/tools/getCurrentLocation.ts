let currentLocation = { lat: 0, lng: 0 };

export type GeoLocation = { lat: number; lng: number; }

const listeners = [] as ((event: GeoLocation) => void)[];

export function onLocation(cb: (location: GeoLocation) => void) {
    listeners.push(cb);
    cb(currentLocation);
    return {
        off: () => { listeners.splice(listeners.indexOf(cb), 1); }
    }
}

navigator.geolocation.watchPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        listeners.forEach(listener => listener({ lat: latitude, lng: longitude }));
    },
    (error) => {
        console.error(error);
    },
    { enableHighAccuracy: false, maximumAge: 1000 * 5, timeout: 1000 * 1 }
);


export async function getCurrentLocation() {
    return await new Promise<{ lat: number; lng: number; }>(
        (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lng: longitude });
                },
                (error) => {
                    reject(error);
                }
            );
        }
    );
}

currentLocation = await getCurrentLocation();