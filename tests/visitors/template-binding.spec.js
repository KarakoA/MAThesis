const { ESLinter } = require("../../eslinter");
const { NAME } = require("../../visitors/template-binding");
function template(tags) {
  return `
  <template>
${tags}
  </template>
<script>
export default {
    name: "HelloWorld",
}</script>`;
}

let linter = new ESLinter();
async function parse(tags) {
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
});
describe("Parsing expression", () => {
  test("containing multiple variables", async () => {
    let tag = `<div v-if="VAR1 || VAR2"></div>`;
    let actual = await parse(tag);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR1", target: expect.any(String), isEventBinding: false },
      { source: "VAR2", target: expect.any(String), isEventBinding: false },
    ]);
  });
  test("containing simple expression", async () => {
    let tag = `<div v-if="!VAR1"></div>`;
    let actual = await parse(tag);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR1", target: expect.any(String), isEventBinding: false },
    ]);
  });
  test("containing complex expression", async () => {
    let tag = `<div v-if="!VAR2 === true && false"></div>`;
    let actual = await parse(tag);
    expect(actual.bindings).toStrictEqual([
      { source: "VAR2", target: expect.any(String), isEventBinding: false },
    ]);
  });
});

describe("Parsing object accessors", () => {
  describe("with a depth of 2 should yield correct", () => {
    let tag = `<div> {{VAR.VAR1}} </div>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        {
          source: "VAR.VAR1",
          target: expect.any(String),
          isEventBinding: false,
        },
      ]);
    });

    test("tagsInfo", async () => {
      let actual = await parse(tag);
      expect(actual.tagsInfo).toStrictEqual([
        {
          id: actual.bindings[0].target,
          name: "VAR.VAR1",
          loc: expect.anything(),
        },
      ]);
    });
  });

  describe("with arbitrary depth should yield correct", () => {
    let tag = `<div v-bind:id="VAR.VAR1.VAR2.VAR3.VAR4"/>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        {
          source: "VAR.VAR1.VAR2.VAR3.VAR4",
          target: expect.any(String),
          isEventBinding: false,
        },
      ]);
    });
  });
  describe("for event binding should yield correct", () => {
    let tag = `<div @click="OnVAR.VAR"></div>`;
    test("bindings", async () => {
      let actual = await parse(tag);
      expect(actual.bindings).toStrictEqual([
        {
          source: expect.any(String),
          target: "OnVAR.VAR",
          isEventBinding: true,
        },
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
});
describe("TagsInfo", () => {
  describe("given no binding", () => {
    test("be empty", async () => {
      let tag = `<div> VALUE </div>`;
      let actual = await parse(tag);
      expect(actual.tagsInfo).toHaveLength(0);
    });
  });

  describe("given a binding", () => {
    describe(".name should resolve to", () => {
      test("value if present", async () => {
        let tag = `<div v-if="VAR1"> VALUE </div>`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "VALUE", loc: expect.anything(), id: expect.any(String) },
        ]);
      });
      test("moustache if value not present", async () => {
        let tag = `<div> {{VAR1}} </div>`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "VAR1", loc: expect.anything(), id: expect.any(String) },
        ]);
      });

      test("value if value followed by moustache are present", async () => {
        let tag = `<div> VALUE {{VAR1}} </div>`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "VALUE", loc: expect.anything(), id: expect.any(String) },
        ]);
      });

      test("value if moustache followed by value is present", async () => {
        let tag = `<div> {{VAR1}} VALUE</div>`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "VALUE", loc: expect.anything(), id: expect.any(String) },
        ]);
      });

      test("type if value not present", async () => {
        let tag = `<input v-model="VAR1">  </input>`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "input", loc: expect.anything(), id: expect.any(String) },
        ]);
      });

      test("moustache if not inside tag", async () => {
        let tag = `{{VAR1}}`;
        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          { name: "VAR1", loc: expect.anything(), id: expect.any(String) },
        ]);
      });
    });

    describe(".id should include correct", () => {
      test("location(start and end in line)", async () => {
        let tag = `<div v-if="VAR1"> VALUE </div>`;
        let from = tag.indexOf("<");
        //exclusive
        let to = tag.lastIndexOf(">") + 1;

        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          {
            loc: expect.anything(),
            id: `div_3_${from}_3_${to}`,
            name: expect.any(String),
          },
        ]);
      });

      test("location(start and end in line) if self closing", async () => {
        let tag = `<div v-if="VAR1"/>`;
        let from = tag.indexOf("<");
        let to = tag.lastIndexOf(">") + 1;

        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          {
            loc: expect.anything(),
            id: `div_3_${from}_3_${to}`,
            name: expect.any(String),
          },
        ]);
      });

      test("location(start and end in line) of the most tight one if nested", async () => {
        let tag = `<div v-if="VAR1"> VALUE </div>`;
        let from = tag.indexOf("<") + "<button>".length;
        let to = tag.lastIndexOf(">") + 1 + "<button>".length;
        tag = `<button>${tag}</button>`;
        let actual = await parse(tag);

        expect(actual.tagsInfo).toStrictEqual([
          {
            loc: expect.anything(),
            id: `div_3_${from}_3_${to}`,
            name: expect.any(String),
          },
        ]);
      });

      test("line(start and end)", async () => {
        let tag = `<div v-if="VAR1"> 
        VALUE 
</div>`;

        let actual = await parse(tag);
        expect(actual.tagsInfo).toStrictEqual([
          {
            loc: expect.anything(),
            id: "div_3_0_5_6",
            name: expect.any(String),
          },
        ]);
      });

      test("line(start and end) of the most tight one if nested", async () => {
        let tag = `<button>
<div v-if="VAR1"> VALUE 
</div>
</button>`;
        let actual = await parse(tag);

        expect(actual.tagsInfo).toStrictEqual([
          {
            loc: expect.anything(),
            id: `div_4_0_5_6`,
            name: expect.any(String),
          },
        ]);
      });
    });
  });
});
