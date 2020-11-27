const { ESLinter } = require("../../eslinter");
const { NAME } = require("../../visitors/template-binding");
function template(tags) {
  return `
  <template>${tags}</template>
<script>
export default {
    name: "HelloWorld",
}</script>`;
}

let linter = new ESLinter();
async function parse(tags) {
  linter.lintCode(template(`<div>{{WTF}}</div>`), NAME);
  return await linter.lintCode(template(tags), NAME);
}

// expect(actual.bindings).toHaveLength(1)

//TODO tagInfo test
//    expect(actual.tagsInfo[0].id).toBe(actual.bindings[0].target);
describe("Parsing single", () => {
  test("moustache binding", async () => {
    let actual = await parse(`<div> {{VAR}} </div>`);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR", target: expect.any(String), isEventBinding: false },
    ]);
  }),
    test("v-bind binding", async () => {
      let actual = await parse(`<div v-bind:id="VAR"/>`);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
      ]);
    });

  test("v-if binding", async () => {
    let actual = await parse(`<div v-if="VAR === false"/>`);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR", target: expect.any(String), isEventBinding: false },
    ]);
  });

  test("v-model binding", async () => {
    let actual = await parse(`<input v-model="VAR"/>`);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR", target: expect.any(String), isEventBinding: false },
      { source: expect.any(String), target: "VAR", isEventBinding: false },
    ]);
    expect(actual.bindings[0].source).toBe(actual.bindings[1].target);
    expect(actual.bindings[1].source).toBe(actual.bindings[0].target);
  });

  test("free moustache binding", async () => {
    let actual = await parse(`{{VAR}}`);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR", target: expect.any(String), isEventBinding: false },
    ]);
  });

  test("empty moustache binding", async () => {
    let actual = await parse(`{{}}`);
    expect(actual.bindings).toHaveLength(0);
  });

  test("event binding", async () => {
    let actual = await parse(`<div @click="OnVAR"></div>`);
    expect(actual.bindings).toStrictEqual([
      { source: expect.any(String), target: "OnVAR", isEventBinding: true },
    ]);
  });

  //TODO expressions
  //compound bindings
  //nested tags
  //TODO complex variables not yet supported //topLevel:{otherLevel:0}
});
