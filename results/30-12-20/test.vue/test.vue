<template>
  <div>
    <div style="margin-left: 5px; margin-top: 20px">
      <form @submit.prevent>
        <span>{{ a }}</span> + <span> {{ b }}</span> =
        <span><input class="question" v-model="answer" /></span>
        <button
          class="btn btn-primary"
          style="margin-left: 5px"
          :disabled="!may_check()"
          type="submit"
          @click="check_answer()"
        >
          Check
        </button>
        <button
          class="btn btn-success"
          style="margin-left: 5px"
          disabled="1"
          v-if="right === true"
        >
          Right
        </button>
        <button
          class="btn btn-danger"
          style="margin-left: 5px"
          disabled="1"
          v-if="right === false"
        >
          Wrong
        </button>
        <button
          class="btn btn-info"
          style="margin-left: 5px"
          @click="new_problem()"
        >
          New Problem
        </button>
      </form>
    </div>
    <hr />
    <div style="margin-left: 5px">
      <table>
        <tr>
          <td><strong>Statistics&nbsp;</strong></td>
          <td><span class="badge badge-success">Right</span></td>
          <td><span class="badge badge-danger">Wrong</span></td>
        </tr>
        <tr>
          <td />
          <td>
            <span> {{ count_right }}</span>
          </td>
          <td>
            <span> {{ count_wrong }}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      a: 0,
      b: 0,
      c: 0,
      answer: undefined,
      right: undefined,
      count_right: 0,
      count_wrong: 0,
      topLevel: { otherLevel: 0 },
    };
  },
  created: function () {
    this.add_problem();
  },
  methods: {
    add_problem() {
      let max = 100;
      this.c = Math.floor(Math.random() * (max - 1)) + 1;
      this.a = Math.floor(Math.random() * (this.c - 2)) + 1;
      this.b = this.c - this.a;

      this.answer = undefined;
      this.right = undefined;
    },
    check_answer() {
      this.right = this.c === parseInt(this.answer);
      this.right ? (this.count_right += 1) : (this.count_wrong += 1);
    },
    may_check() {
      // answer non-empty and right undefined
      return (
        !(this.answer === undefined || this.answer === "") &&
        this.right === undefined
      );
    },
    new_problem() {
      this.add_problem();
    },
  },
};
</script>
<style scoped>
.index {
  padding: 0 20px 0 5px;
}

.question {
  font-color: white;
  width: 2em;
  background-color: #3ff;
  margin-left: 5px;
  margin-right: 5px;
}
</style>
