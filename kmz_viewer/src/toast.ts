
export function toast(message: string) {
    const toast = document.createElement("div");
    toast.innerHTML = message;
    toast.style.position = "absolute";
    toast.style.top = "10px";
    toast.style.right = "10px";
    toast.style.padding = "10px";
    toast.style.backgroundColor = "white";
    toast.style.border = "1px solid black";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "1000";
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 1000);
}
