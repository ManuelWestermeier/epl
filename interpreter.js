import fs from "fs";

const data = fs.readFileSync("test.mws").toString("utf-8");

const lines = data.split("\n").map((l) => l.trim());

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
}

function run(index = "") {
  const line = lines[index];
  if (!line) return;
  if (line.startsWith("@end")) {
    return storage[line.split(" ")[1]];
  }
  if (line.startsWith("@delete")) {
    delete storage[line.split(" ")[1]];
    return run(index + 1);
  }
  if (line.startsWith("@call")) {
    const [_, fnName, _with, ...args] = line.split(" ");
    if (_with != "with") throw index;
    call(fnName, args);
    return run(index + 1);
  }
  if (line.startsWith("@set")) {
    const [_, name, _to, ...value] = line.split(" ");
    if (_to != "to") throw index;
    storage[name] = getValue(value);
    return run(index + 1);
  }
  if (line.startsWith("@strref set")) {
    if (line.split(" ")[3] != "to") throw index;
    storage[storage[line.split(" ")[2]]] = storage[line.split(" ")[4]];
    return run(index + 1);
  }
  if (line.startsWith("@strref get")) {
    if (line.split(" ")[3] != "in") throw index;
    storage[line.split(" ")[4]] = storage[storage[line.split(" ")[2]]];
    return run(index + 1);
  }
  if (line.startsWith("@out")) {
    console.log(storage[line.split(" ")[1]]);
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
