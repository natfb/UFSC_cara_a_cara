
const mongoose = require("mongoose");

const dbUrl = "mongodb://localhost:27017/feira-ciencias";
const conncetionParams = {
useNewUrlParser: true,
useUnifiedTopology: true,
};
mongoose
.connect(dbUrl, conncetionParams)
.then(() => {
    console.log("connected to database");
})
.catch((e) => {
    console.log(e);
});
