// Runs a page script with a stub DOM and prints the HTML it renders.
// Usage: node tests/render_page_script.js <script.js> <selector>
const fs = require("fs");
const vm = require("vm");
const [file, selector] = process.argv.slice(2);
const target = { innerHTML: "" };
const listeners = [];
const sandbox = {
  AOS: { init() {} },
  document: {
    querySelector: (sel) => (sel === selector ? target : null),
    addEventListener: (ev, fn) => ev === "DOMContentLoaded" && listeners.push(fn),
  },
};
vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
listeners.forEach((fn) => fn());
process.stdout.write(target.innerHTML);
