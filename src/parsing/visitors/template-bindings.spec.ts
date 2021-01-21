import { named, generic, numeric } from "../../common/models/identifier";
import { ESLinter } from "../eslinter";
import { method, property } from "../models/shared";
import { Binding, BindingType } from "../models/template-bindings";

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

const linter = new ESLinter();
async function parse(tags: string): Promise<Binding[]> {
  const result = await linter.lintCode(template(tags));
  return result.bindings.bindings;
}
describe("Bindings", () => {
  describe("parsing bindings", () => {
    describe("single", () => {
      test("moustache binding", async () => {
        const tag = `<div> {{VAR}} </div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("v-bind binding", async () => {
        const tag = `<div v-bind:id="VAR"/>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("v-if binding", async () => {
        const tag = `<div v-if="VAR === false"/>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("v-model binding", async () => {
        const tag = `<input v-model="VAR"/>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR")),
                bindingType: BindingType.TWO_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("unbound moustache binding", async () => {
        const tag = `{{VAR}}`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("empty moustache binding", async () => {
        const tag = `{{}}`;
        const actual = await parse(tag);
        expect(actual).toHaveLength(0);
      });

      test("event binding with method syntax", async () => {
        const tag = `<div @click="OnVAR"></div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: method([named("OnVAR")]),
                bindingType: BindingType.EVENT,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });
      test("event binding", async () => {
        const tag = `<div @click="OnVAR()"></div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: method([named("OnVAR")]),
                bindingType: BindingType.EVENT,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });
    });

    describe("expressions", () => {
      test("containing multiple variables", async () => {
        const tag = `<div v-if="VAR1 || VAR2"></div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR1")),
                bindingType: BindingType.ONE_WAY,
              },
              {
                item: property(named("VAR2")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("containing the same variables multiple times results in only one binding", async () => {
        const tag = `<div v-if="VAR1 || VAR1"> {{VAR1}}</div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR1")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("containing simple expression", async () => {
        const tag = `<div v-if="!VAR1"></div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR1")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("containing complex expression", async () => {
        const tag = `<div v-if="!VAR2 === true && false"></div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR2")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      describe("containing method with arguments", () => {
        test("should not include the arugments as separte binding", async () => {
          const tag = `<div v-if="some_method(problems)"></div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.anything(),
              values: [
                {
                  item: method(
                    [named("some_method")],
                    [property(named("problems"))]
                  ),
                  bindingType: BindingType.ONE_WAY,
                },
              ],
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
        test("include the arugments if also accesed outside of method", async () => {
          const tag = `<div v-if="some_method(problems) == problems == problems"></div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.anything(),
              values: [
                {
                  item: method(
                    [named("some_method")],
                    [property(named("problems"))]
                  ),
                  bindingType: BindingType.ONE_WAY,
                },
                {
                  item: property(named("problems")),
                  bindingType: BindingType.ONE_WAY,
                },
              ],
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
      });
    });

    describe("object accessors", () => {
      test("with a depth of 2", async () => {
        const tag = `<div> {{VAR.VAR1}} </div>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(named("VAR"), named("VAR1")),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("with arbitrary depth and complexity", async () => {
        const tag = `<div v-bind:id="VAR.VAR1[i][j][0].VAR2.VAR3.VAR4[5]"/>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: property(
                  named("VAR"),
                  named("VAR1"),
                  generic("i"),
                  generic("j"),
                  numeric("0"),
                  named("VAR2"),
                  named("VAR3"),
                  named("VAR4"),
                  numeric("5")
                ),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });

      test("with arbitrary depth and complexity methods", async () => {
        const tag = `<div v-bind:id="VAR.VAR1[i][j][0].VAR2.VAR3.VAR4[5].push()"/>`;
        const actual = await parse(tag);
        const expected = [
          {
            tag: expect.anything(),
            values: [
              {
                item: method([
                  named("VAR"),
                  named("VAR1"),
                  generic("i"),
                  generic("j"),
                  numeric("0"),
                  named("VAR2"),
                  named("VAR3"),
                  named("VAR4"),
                  numeric("5"),
                  named("push"),
                ]),
                bindingType: BindingType.ONE_WAY,
              },
            ],
          },
        ];
        expect(actual).toStrictEqual(expected);
      });
    });
  });

  describe("resolving VFor", () => {
    test("simple: (for problem in problems).a => problem[i].a)", async () => {
      const tag = `<ul><li v-for="problem in problems" :key="problem.id">{{problem.a}}</li></ul>`;
      const actual = await parse(tag);
      const expected = [
        {
          tag: expect.objectContaining({
            name: "problems[i].a",
            position: "i",
          }),
          values: [
            {
              item: property(named("problems"), generic("i"), named("a")),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
      ];
      expect(actual).toStrictEqual(expected);
    });
    test("indexed iterator: (for problem in problems[i]).a => problem[i][j].a", async () => {
      const tag = `<ul><li v-for="problem in problems[i]" :key="problem.id">{{problem.a}}</li></ul>`;
      const actual = await parse(tag);
      const expected = [
        {
          tag: expect.objectContaining({
            name: "problems[i][j].a",
            position: "i",
          }),
          values: [
            {
              item: property(
                named("problems"),
                generic("i"),
                generic("j"),
                named("a")
              ),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
      ];
      expect(actual).toStrictEqual(expected);
    });

    test("indexed inside: (for problem in problems)[i].a => problem[i][j].a", async () => {
      const tag = `<ul><li v-for="problem in problems" :key="problem.id">{{problem[i].a}}</li></ul>`;
      const actual = await parse(tag);
      const expected = [
        {
          tag: expect.objectContaining({
            name: "problems[i][j].a",
            position: "i",
          }),
          values: [
            {
              item: property(
                named("problems"),
                generic("i"),
                generic("j"),
                named("a")
              ),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
      ];
      expect(actual).toStrictEqual(expected);
    });

    test("simple nested: (for classroom in (for school in schools )).capacity => schools[i][j].capacity", async () => {
      const tag = `<ul>
       <li v-for="school in schools" :key="school.id">
            <ul>
              <li v-for="classroom in school" :key="problem.id">
                 {{classroom.capacity}}
              </li>
            </ul>
       </li>
      </ul>`;
      const actual = await parse(tag);
      const expected = expect.arrayContaining([
        {
          tag: expect.objectContaining({
            name: "schools[i][j].capacity",
            position: "i",
          }),
          values: [
            {
              item: property(
                named("schools"),
                generic("i"),
                generic("j"),
                named("capacity")
              ),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
      ]);
      expect(actual).toStrictEqual(expected);
    });

    test("complex nested: (for school.problems in (for school in schools )).name => schools[i].problems[i].name", async () => {
      const tag = `<ul>
          <li v-for="school in schools" :key="school.id">
            <div>{{school[0].name}}</div>
            <ul>
              <li v-for="problem in school.problems" :key="problem.id">
              <p>{{problem.a}}</p>

              </li>
            </ul>
          </li>
       </ul>`;
      const actual = await parse(tag);
      const expected = expect.arrayContaining([
        {
          tag: expect.objectContaining({
            name: "schools[i][0].name",
            position: "i",
          }),
          values: [
            {
              item: property(
                named("schools"),
                generic("i"),
                numeric("0"),
                named("name")
              ),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
        {
          tag: expect.objectContaining({
            name: "schools[i].problems[i].a",
            //TODO check do I need the j here or not?
            position: "i",
          }),
          values: [
            {
              item: property(
                named("schools"),
                generic("i"),
                named("problems"),
                generic("i"),
                named("a")
              ),
              bindingType: BindingType.ONE_WAY,
            },
          ],
        },
      ]);
      expect(actual).toMatchObject(expected);
    });
  });

  describe("parsing tag", () => {
    describe("given no binding", () => {
      test("be empty", async () => {
        const tag = `<div> VALUE </div>`;
        const actual = await parse(tag);
        expect(actual).toHaveLength(0);
      });
    });

    describe("given a binding", () => {
      describe(".name should resolve to", () => {
        test("value if present", async () => {
          const tag = `<div v-if="VAR1"> VALUE </div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VALUE" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
        test("moustache if value not present", async () => {
          const tag = `<div> {{VAR1}} </div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VAR1" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
        test("nested moustache if value not present", async () => {
          const tag = `<div> {{VAR1.VAR2}} </div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VAR1.VAR2" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("value if value followed by moustache are present", async () => {
          const tag = `<div> VALUE {{VAR1}} </div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VALUE" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("value if moustache followed by value is present", async () => {
          const tag = `<div> {{VAR1}} VALUE</div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VALUE" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("moustache if not inside tag", async () => {
          const tag = `{{VAR1}}`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ name: "VAR1" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
      });

      describe(".id should include correct", () => {
        test("location(start and end in line)", async () => {
          const tag = `<div v-if="VAR1"> VALUE </div>`;
          const from = tag.indexOf("<");
          //exclusive
          const to = tag.lastIndexOf(">") + 1;

          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ id: `div_3_${from}_3_${to}` }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("location(start and end in line) if self closing", async () => {
          const tag = `<div v-if="VAR1"/>`;
          const from = tag.indexOf("<");
          const to = tag.lastIndexOf(">") + 1;

          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ id: `div_3_${from}_3_${to}` }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("location(start and end in line) of the most tight one if nested", async () => {
          let tag = `<div v-if="VAR1"> VALUE </div>`;
          const from = tag.indexOf("<") + "<button>".length;
          const to = tag.lastIndexOf(">") + 1 + "<button>".length;
          tag = `<button>${tag}</button>`;
          const actual = await parse(tag);

          const expected = [
            {
              tag: expect.objectContaining({ id: `div_3_${from}_3_${to}` }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("line(start and end)", async () => {
          const tag = `<div v-if="VAR1"> 
        VALUE 
</div>`;
          const actual = await parse(tag);
          const expected = [
            {
              tag: expect.objectContaining({ id: "div_3_0_5_6" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });

        test("line(start and end) of the most tight one if nested", async () => {
          const tag = `<button>
<div v-if="VAR1"> VALUE 
</div>
</button>`;
          const actual = await parse(tag);

          const expected = [
            {
              tag: expect.objectContaining({ id: "div_4_0_5_6" }),
              values: expect.anything(),
            },
          ];
          expect(actual).toStrictEqual(expected);
        });
      });
    });
  });
});
