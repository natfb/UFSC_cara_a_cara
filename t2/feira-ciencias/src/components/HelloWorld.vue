<template>
  <div class="hello">
    projeto: <p v-if="fact">{{ fact }}</p>
    <button @click="fetchData">Click Me!</button>
  </div>
</template>

<script>
// teste buscando um id estatico = project1
export default {
  props: {
    msg: String,
  },
  data() {
    return {
      fact: "",
    };
  },
  methods: {
    fetchData() {
      fetch('http://localhost:8081/projeto/project1', {
        method: "GET",
        headers: {
          
        },
      })
        .then((response) => {
          response.json().then((data) => {
            this.fact = data;
            console.log(data)
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
