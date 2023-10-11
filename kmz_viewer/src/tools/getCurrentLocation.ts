const isDebug = location.search.indexOf("debug") >= 0;

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


if (!isDebug) {

    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            currentLocation = { lat: latitude, lng: longitude };
            listeners.forEach(listener => listener(currentLocation));
        },
        (error) => {
            console.error(error);
        },
        { enableHighAccuracy: false, maximumAge: 1000 * 5, timeout: 1000 * 1 }
    );
} else {
    setInterval(() => {
        if (!currentLocation.lat) {
            const lat = 37.7749;
            const lng = -122.4194;
            currentLocation = { lat, lng };
        }
        currentLocation = {
            lat: currentLocation.lat + (Math.random() - 0.2) * 0.0001,
            lng: currentLocation.lng + (Math.random() - 0.2) * 0.0001,
        };
        listeners.forEach(listener => listener(currentLocation));
    }, 1000);
}

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