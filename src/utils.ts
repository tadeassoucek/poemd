export let inspect: (val: any) => string;

if (typeof window === "undefined") {
  const { inspect: _inspect } = require("util");
  inspect = (val: any) =>
    _inspect(val, {
      colors: true,
      depth: 99
    });
} else {
  const escapeString = (s: string) => {
    for (const [key, val] of Object.entries({
      "\\\\": "\\",
      "\0": "0",
      "\n": "n",
      "\t": "t",
      "\r": "r",
      "\v": "v",
      "\f": "f"
    }))
      s = s.replace(new RegExp(key, "g"), `<span class="${classPrefix}special-char">\\${val}</span>`);
    s = s.replace(/[^ -~]/g, function (sub) {
      return (
        '<span class="' +
        classPrefix +
        'special-char">\\x' +
        sub.charCodeAt(0).toString(16).padStart(2, "0") +
        "</span>"
      );
    });
    return s;
  };

  const classPrefix = "poemd-log-";
  const indent = "  ";
  const noSpecialChars = /^[\w_$]+$/;
  const apostrophe = /'/g;

  const _inspect = (val: any, depth: number, objects: object[]) => {
    switch (typeof val) {
      case "undefined":
      case "boolean":
        return `<span class="${classPrefix + typeof val}">${val}</span>`;

      case "number":
      case "bigint":
        return (
          `<span class="${classPrefix + typeof val}" title="0b${val.toString(2)}, 0o${val.toString(
            8
          )}, 0x${val.toString(16)}">` +
          val +
          (typeof val === "bigint" ? "n" : "") +
          "</span>"
        );

      case "string": {
        const q = apostrophe.test(val) ? '"' : "'";
        return (
          `<span class="${classPrefix}string" title="Length: ${val.length}">` +
          q +
          escapeString(val).replace(new RegExp(q, "g"), "\\" + q) +
          q +
          "</span>"
        );
      }

      case "symbol": {
        const v = val.toString();
        return `<span class="${classPrefix}symbol">[${v ? escapeString(v) : "Symbol"}]</span>`;
      }

      case "function": {
        const f = val as Function;
        return `<span class="${classPrefix}function">` + (f.name ? `[Function ${f.name}]` : `[Function]`) + "</span>";
      }

      case "object": {
        if (objects.find((o) => o === val)) return `<span class="${classPrefix}circular">[Circular]</span>`;
        const newObjects = [...objects, val];

        let indentation = indent.repeat(depth);

        if (val === null) return `<span class="${classPrefix}null">null</span>`;
        else if (val instanceof RegExp) return `<span class="${classPrefix}regexp">${val}</span>`;
        else if (Array.isArray(val)) {
          if (!val.length) return "[]";
          let s = "[\n";
          val.forEach(
            (e, i) =>
              (s += indentation + indent + _inspect(e, depth + 1, newObjects) + (i != val.length - 1 ? "," : "") + "\n")
          );
          return s + indentation + "]";
        }

        if (!Object.keys(val).length) return "{}";
        let s = "";
        if (val.constructor)
          s += `<span class="${classPrefix}class-name" title="This object is an instance of the &quot;${val.constructor.name}&quot; class.">${val.constructor.name}</span> `;
        s += "{\n";

        const entries = Object.entries(val);
        // uhhhhh... yeah
        entries.forEach(
          ([k, v], i) =>
            (s +=
              indentation +
              indent +
              (noSpecialChars.test(k)
                ? `<span class="${classPrefix}property">${k}</span>`
                : _inspect(k, depth + 1, newObjects)) +
              ": " +
              _inspect(v, depth + 1, newObjects) +
              (i != entries.length - 1 ? "," : "") +
              "\n")
        );
        return s + indentation + "}";
      }

      default:
        throw new Error(
          `...i have no idea how you managed to do this, but "${typeof val}" is not a valid Javascript type???`
        );
    }
  };

  inspect = (val: any) => _inspect(val, 0, []);
}

export type OneOrMany<T> = T | T[];

/**
 * Creates a deep clone of an object. Preserves prototypes.
 */
export function clone(obj: any): any {
  if (typeof obj === "object" && obj) {
    const newObj = Object.create(Object.getPrototypeOf(obj));
    Object.entries(obj).forEach(([key, value]) => (newObj[key] = clone(value)));
  }
  return obj;
}

/**
 * @param obj The object whose properties we overwrite.
 * @param defaults The object containing default values for properties in `obj`.
 * @returns A new object with those properties from `defaults` which are missing in `obj` replaced.
 */
export function setDefaults(obj: object, defaults: object) {
  if (!obj || Object.keys(obj).length == 0) return clone(defaults);
  else if (!defaults || Object.keys(defaults).length == 0) return clone(obj);

  const res = {};
  for (const key in obj) res[key] = obj[key];
  for (const key in defaults) if (obj[key] === undefined) res[key] = defaults[key];
  return res;
}

export function getMax<T>(arr: T[], key: string): T {
  let max: T;
  for (const val of arr) if (!max || max[key] >= val[key]) max = val;
  return max;
}
