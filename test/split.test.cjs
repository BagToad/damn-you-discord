/* Simple Node test harness for splitText */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "src", "main.ts"),
  "utf8"
);

function extractSplitFunction(source) {
  const match = source.match(
    /export function splitText[\s\S]*?return chunks;\n}/
  );
  if (!match) throw new Error("splitText function not found");
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${match[0]}; return splitText;`);
  return fn();
}

const splitText = extractSplitFunction(src);

function runTests() {
  {
    const chunks = splitText("");
    assert.strictEqual(chunks.length, 0, "Empty string yields no chunks");
  }

  {
    const msg = "a".repeat(1999);
    const chunks = splitText(msg);
    assert.strictEqual(chunks.length, 1, "1999 chars should be one chunk");
    assert.strictEqual(chunks[0].length, 1999);
  }

  {
    const msg = "a".repeat(2001);
    const chunks = splitText(msg);
    assert.ok(chunks.length >= 1, "Should split long message");
    chunks.forEach((c) => {
      assert.ok(c.length <= 2000, "Chunk should be <= 2000 chars");
    });
  }

  console.log("All splitText tests passed.");
}

runTests();
