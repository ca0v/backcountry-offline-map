export function html(strings: TemplateStringsArray, ...values: any[]) {
    const template = document.createElement("template");
    // insert values between strings
    const value = strings.reduce((acc, string, index) => {
        return acc + string + (values[index] || "");
    }, "");
    template.innerHTML = value;
    return template.content.firstElementChild as HTMLElement;
}
