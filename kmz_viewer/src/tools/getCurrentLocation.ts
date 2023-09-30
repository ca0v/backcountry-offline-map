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

