export function html(strings: TemplateStringsArray, ...values: any[]) {
    const template = document.createElement("template");
    template.innerHTML = strings.join("");
    // 34°50.29'N, 82°14.48'W
    return template.content.firstElementChild as HTMLElement;
}
