<template>
  <div style="margin-left: 20px">
  <div>Menu</div>
    <ul>
      <li v-for="meal in meals" :key="meal.id">
        <div style="margin-left: 5px; margin-top: 20px">
          <div> {{meal.name}}</div> 
          <div> Price: {{meal.price}} Euro </div>
        </div>
      </li>
    </ul>
    <div>
</div>
<div>Meal of the day - {{mealOfTheDay.name}}</div>
<div style="margin-top: 20px"/>
<div>Best steak in town - {{meals[2].price}} Euro !</div>
<div style="margin-top: 20px"/>
<label>Store manager commands:</label>
<div>
<button v-on:click="new_day">New Day</button>
<button v-on:click="discount_all">Discount all</button>
</div>
</div>
</template>

<script>
export default {
  name: "HelloWorld",
  data() {
    return {
      answers: [],
      mealOfTheDay: undefined,
      isFriday: false
    };
  },
  created: function () {
    this.init();
  },
  methods: {
    init() {
      this.meals = [
        {name:"Soup",  id:0, price: 2 },
        {name:"Salad", id:1, price: 2 },
        {name:"Steak", id:2, price: 7 },
      ]
      this.mealOfTheDay = this.meals[0]
    },
    new_day:function(){
      this.isFriday = !this.isFriday
      this.mealOfTheDay = this.isFriday? this.meals[0] : this.meals[1]
    },
    discount_all:function(){
    for (var i = 0; i < this.meals.length; i++) {
      this.meals[i].price = this.meals[i].price - 0.20 
    } 
    }
  },
};
</script>