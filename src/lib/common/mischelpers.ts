export function nestedEvery(callback: (obj: any) => boolean, obj: any, path: string[], current?: number): boolean {
    if (!current) current = 0;
    if (current === path.length) return true;
    console.log(obj, path[current], obj[path[current]], path[current]);
    if (callback(obj[path[current]])) {
        return nestedEvery(callback, obj[path[current]], path, current + 1);
    } else {
        return false;
    }
}

export function ValidateRequiredFields(obj: any, fields: string[]) {
    return fields.reduce<string[]>((acc: string[], field: string) => {
        let isNested = /\./.test(field);
        if (isNested) {
            let path = field.split(".");
            let isValid = nestedEvery((obj) => obj != null, obj, path);
            if (!isValid) {
                acc.push(field)
            }
        } else {
            if (!(field in obj)) {
                acc.push(field)
            }
        }
        return acc;
    }, [])

}