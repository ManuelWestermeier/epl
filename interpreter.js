import fs from "fs";

const data = fs.readFileSync("test.mws").toString("utf-8");

const lines = data.split("\n").map((l) => l.trim());

const operators = [
  ..."+-*/^&|<>",
  "&&",
  "||",
  "==",
  ">=",
  "<=",
  "!=",
  "===",
  "!==",
];

const storage = {};

function getValue(value = [""]) {
  if (value[0] == "s")
    return value
      .slice(1, value.length)
      .map((p) => {
        if (!p.startsWith("@") || !p.endsWith("@")) return p;
        return storage[p.slice(1, p.length - 1)];
      })
      .join(" ");
  if (value[0] == "n") return parseInt(value[1]);
  else return storage[value];
}

function run(index = "") {
  const line = lines[index];
  if (!line) return null;
  if (line.startsWith("//")) return run(index + 1);
  if (line.startsWith("@end")) {
    return storage[line.split(" ")[1]];
  }
  if (line.startsWith("@delete")) {
    delete storage[line.split(" ")[1]];
    return run(index + 1);
  }
  if (line.startsWith("@call")) {
    const [_, fnName, _with, ...args] = line.split(" ");
    if (_with != "with") throw new Error(index);
    call(fnName, args);
    return run(index + 1);
  }
  if (line.startsWith("@set")) {
    const [_, name, _to, ...value] = line.split(" ");
    if (_to != "to") throw new Error(index);
    storage[name] = getValue(value);
    return run(index + 1);
  }
  if (line.startsWith("@strref set")) {
    if (line.split(" ")[3] != "to") throw new Error(index);
    storage[storage[line.split(" ")[2]]] = storage[line.split(" ")[4]];
    return run(index + 1);
  }
  if (line.startsWith("@strref get")) {
    if (line.split(" ")[3] != "in") throw new Error(index);
    storage[line.split(" ")[4]] = storage[storage[line.split(" ")[2]]];
    return run(index + 1);
  }
  if (line.startsWith("@out")) {
    console.log(storage[line.split(" ")[1]]);
    return run(index + 1);
  }
  if (line.startsWith("@operate")) {
    const [_, dest, _to, x1, operator, x2] = line.split(" ");
    if (!operators.includes(operator)) throw new Error(index);
    if (_to != "to") throw new Error(index);
    storage[dest] = eval(`storage[x1] ${operator} storage[x2]`);
    return run(index + 1);
  }
  if (line.startsWith("@soperate")) {
    const [_, dest, _to, operator, x1] = line.split(" ");
    if (!"!~".includes(operator)) throw new Error(index);
    if (_to != "to") throw new Error(index);
    storage[dest] = eval(`${operator} storage[x1]`);
    return run(index + 1);
  }
  if (line.startsWith("@at get")) {
    const [_, dest, _to, container, indexKey] = line.split(" ");
    if (_to !== "to") throw new Error(index);
    storage[dest] = storage?.[container]?.[storage[indexKey]];
    return run(index + 1);
  }
  if (line.startsWith("@at set")) {
    const [_, container, indexKey, _to, valueKey] = line.split(" ");
    if (_to !== "to") throw new Error(index);
    storage[container][storage[indexKey]] = storage[valueKey];
    return run(index + 1);
  }
}

function call(fn = "", args = []) {
  let index = 0;
  for (const line of lines) {
    if (line.startsWith("@fn ")) {
      const parts = line.split(" ");
      if (parts?.[1] == fn) {
        for (let index = 2; index < parts.length; index++) {
          storage["arg::" + parts[index]] = args[index - 2];
        }
        return run(index + 1);
      }
    }
    index++;
  }
  return 0;
}

call("start", []);
console.log(storage);
