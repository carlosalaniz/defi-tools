function nested(callback: (obj: any) => boolean, obj: any, path: string[], current?: number): boolean {
    if (!current) current = 0;
    if (current === path.length) return true;
    console.log(obj, path[current], obj[path[current]], path[current]);
    if (callback(obj[path[current]])) {
        return nested(callback, obj[path[current]], path, current + 1);
    } else {
        return false;
    }
}

let obj = {
    bar: "bar",
    foo: {
        bar: {
            baz: "baz"
        }
    }
}

let path = "foo.bar.baz";
let valid = nested(
    (obj: any) => obj != null,
    obj,
    path.split("."))
console.log(valid);