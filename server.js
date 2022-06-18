const express = require("express")
const app = express()
const passport = require("passport")
const session = require("express-session")
const { Strategy } = require("passport-discord")
const mongoose = require("mongoose")
const bp = require("body-parser")
const { response } = require("express")
const url = "mongodb+srv://uzayarsiv:uzayarsiv@cluster0.4fajo.mongodb.net/uptime?retryWrites=true&w=majority"
const admin = "670667760577019909"
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

const IsOk = require('status-is-ok')
const isUrlOk = new IsOk();

const strategy = new Strategy(
	{
		clientID: "978690143848378428",
		clientSecret: "7g4X7ukcB6_I8wojjhtsprPBxk-oFBhP",
		callbackURL: "http://localhost:3000/callback",
		scope: ["identify"]
	},
	(_access_token, _refresh_token, user, done) =>
		process.nextTick(() => done(null, user)),
);

passport.use(strategy);

app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: false,
	}),
);
app.use(passport.session());
app.use(passport.initialize());

app.get(
	"/login",
	passport.authenticate("discord", {
		scope: ["identify"],
	}),
);

app.get(
	"/callback",
	passport.authenticate("discord", {
		failureRedirect: "/error",
	}),
	(_req, res) => res.redirect("/")
);

app.get("/logout", (req, res) => {
    req.session.destroy();
    return res.redirect("/");
});

app.get("/", (req, res) => {
  res.render(process.cwd() + "/public/index.ejs", { user: req.user })
})

app.get("/dashboard", (req, res) => {
  if(req.user){
    mongoose.connect(url, function(err, db) {
      const database = db.collection("uptimes")
      database.find({ id: req.user.id }).toArray(function(err, data) {
		res.render(process.cwd() + "/public/dashboard.ejs", { user: req.user, data: data, response: response })
      })
    })
  }else{
    res.redirect("/?error")
  }
})

app.post("/dashboard", (req, res) => {
	if(req.user){
		mongoose.connect(url, function(err, db) {
		  const database = db.collection("uptimes")
		  database.find({ id: req.user.id }).toArray(function(err, data){
			  if(data.length >= 2){
				  res.redirect("/dashboard?error")
			  }else{
				database.insert({ id: req.user.id, link: req.body.link })
				res.redirect("/dashboard")
			  }
		  })
		})
	  }else{
		res.redirect("/dashboard?error")
	  }
})

app.get("/dashboard/remove/:id", (req, res) => {
	if(req.user){
		mongoose.connect(url, function(err, db) {
			const database = db.collection("uptimes")
			database.find({ _id: mongoose.Types.ObjectId(`${req.params.id}`) }).toArray(function(err, result) {
				database.remove({ _id: mongoose.Types.ObjectId(`${req.params.id}`) })
				res.redirect("/dashboard")
			})
		})
	}else{
		res.redirect("/dashboard?error")
	}
})

app.get("/admin", (req, res) => {
	if(req.user){
		if(req.user.id === admin){
			mongoose.connect(url, function(err, db){
				const database = db.collection("uptimes")
				database.find({}).toArray(function(err, data){
					res.render(process.cwd() + "/public/admin.ejs", { data: data, user: req.user })
				})
			})
		}else{
			res.redirect("/?error")
		}
	}else{
		res.redirect("/?error")
	}
})

setInterval(() => {
	
}, 120)

app.listen(8080, () => {
  console.log("site active")
})
