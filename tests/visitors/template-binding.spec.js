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

describe("Parsing single", () => {
  describe("moustache binding should yield correct", () => {
    let tag = `<div> {{VAR}} </div>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
      ]);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        { id: actual.bindings[0].target, name: "VAR", loc: expect.anything() },
      ]);
    });
  });

  describe("v-bind binding should yield correct", () => {
    let tag = `<div v-bind:id="VAR"/>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
      ]);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        { id: actual.bindings[0].target, name: "div", loc: expect.anything() },
      ]);
    });
  });

  describe("v-if binding should yield correct", () => {
    let tag = `<div v-if="VAR === false"/>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
      ]);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        {
          id: actual.bindings[0].target,
          name: "div",
          loc: expect.anything(),
        },
      ]);
    });
  });

  describe("v-model binding should yield correct", () => {
    let tag = `<input v-model="VAR"/>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
        { source: expect.any(String), target: "VAR", isEventBinding: false },
      ]);
      expect(actual.bindings[0].source).toBe(actual.bindings[1].target);
      expect(actual.bindings[1].source).toBe(actual.bindings[0].target);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        {
          id: actual.bindings[0].target,
          name: "input",
          loc: expect.anything(),
        },
      ]);
    });
  });

  describe("unbound moustache binding should yield correct", () => {
    let tag = `{{VAR}}`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: "VAR", target: expect.any(String), isEventBinding: false },
      ]);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        { id: actual.bindings[0].target, name: "VAR", loc: expect.anything() },
      ]);
    });
  });

  describe("empty moustache binding should yield correct", () => {
    let tag = `{{}}`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toHaveLength(0);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toHaveLength(0);
    });
  });

  describe("event binding should yield correct", () => {
    let tag = `<div @click="OnVAR"></div>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        { source: expect.any(String), target: "OnVAR", isEventBinding: true },
      ]);
    });
    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        {
          id: actual.bindings[0].source,
          name: "div",
          loc: expect.anything(),
        },
      ]);
    });
  });

  //TODO tag info different names, check resolutions 

  //TODO expressions (v-if= "not EmptyName")
  //compound bindings (v-if="VAR || VAR2")
  //nested tags (<div><div>{ASDF}</div></div>) 
  //check the tags that are being bound to 
  //TODO complex variables not yet supported //topLevel:{otherLevel:0}
});
