
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function animationDelay(count: number) {
    return new Promise<void>((resolve) => {
        const decrement = () => {
            count--;
            if (count > 0)
                requestAnimationFrame(decrement);
            else
                resolve();
        }
        decrement();
    });
}