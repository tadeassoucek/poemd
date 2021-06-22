import { inspect } from "./utils";

type WriteFunc = (data: string | any[], prefixKey?: keyof typeof prefixes) => void;
type WriteTableFunc = (rows: string[][], headers?: string[]) => void;

export const exampleCLIWriteFunction: WriteFunc = (data, prefixKey?) => {
  const prefix = prefixes[prefixKey] || "";
  const prefixStr = typeof prefix === "object" && "value" in prefix ? prefix.value : prefix;
  const prefixPlaceholder = "...".padEnd(prefix.length + 2);
  const message = (Array.isArray(data)
    ? data.map((e) => (typeof e === "string" ? e : inspect(e))).join(" ")
    : data
  ).replace(/\n/g, "\n" + prefixPlaceholder);
  console.error((prefixStr ? prefixStr + "  " : "") + message);
};

export const exampleCLIWriteTableFunction: WriteTableFunc = (rows, headers) => {
  if (headers) {
    const headerLine = headers.join("\t");
    console.error(headerLine);
    console.error(headerLine.replace(/[^\t]/g, "-"));
  }

  rows.forEach((row) => {
    console.error(row.join("\t"));
  });
};

export let write: WriteFunc = () => {};
export let writeTable: WriteTableFunc = () => {};

type Prefix =
  | string
  | {
      value: string;
      length: number;
    };

export let prefixes: {
  debug: Prefix;
  warn: Prefix;
  err: Prefix;
} = {
  debug: "DBUG",
  warn: "WARN",
  err: "ERR!"
};

export function debug(...data: any[]) {
  write(data, "debug");
}

export function warn(...data: any[]) {
  write(data, "warn");
}

export function err(...data: any[]) {
  write(data, "err");
}
