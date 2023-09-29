const groups = [] as Array<{ name: string, tests: Array<{ name: string, definition: () => void }> }>;
let activeGroupIndex = groups.length - 1;

function describe(group: string, definition: () => void) {
    groups.push({ name: group, tests: [] });
    activeGroupIndex = groups.length - 1;
    definition();
}

function it(name: string, definition: () => void) {
    groups[activeGroupIndex].tests.push({ name, definition });
}

function expect(value: any) {
    return {
        toBe(expected: any) {
            if (value !== expected) {
                throw new Error(`Expected ${value} to be ${expected}`);
            }
        }
    }
}

export function run() {
    groups.forEach(group => {
        console.log(group.name);
        group.tests.forEach(test => {
            console.log(`  ${test.name}`);
            test.definition();
        })
    })
}

describe("tests", () => {
    it("freeze", () => {
        const default_options = {
            minDistance: 10
        }

        type Options = typeof default_options;

        class Breadcrumbs {
            options: Options;

            constructor(options?: Partial<Options>) {
                this.options = Object.freeze(Object.assign({ ...default_options }, options || {}));
            }
        }

        const a = new Breadcrumbs();
        expect(a.options.minDistance).toBe(10);

        const b = new Breadcrumbs({ minDistance: 20 });
        expect(b.options.minDistance).toBe(20);

    })
})


