//jshint esversion:6
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
//const encrypt=require("mongoose-encryption");
//const md5=require("md5");
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");


const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));


app.use(passport.initialize());
app.use(passport.session());


//mongodb://localhost:27017
mongoose.connect("mongodb+srv://admin-soumya:soumya26@cluster0.y3wrv.mongodb.net/userDB",{useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);

const userSchema=new mongoose.Schema({
  email:String,
  password:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);

//const secret=process.env.SECRET;
//userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User=new mongoose.model("User",userSchema);





passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){

  res.render("register");
});

app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    }
  });


});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;

  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });

});


app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){
  // const newUser=new User({
  //   email:req.body.username,
  //   password:md5(req.body.password)
  // });
  //
  // newUser.save(function(err){
  //   if(err)
  //   {
  //     console.log(err);
  //   }else{
  //     res.render("secrets");
  //   }
  // });
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });


});

app.post("/login",function(req,res){
  // const username=req.body.username;
  // const password=md5(req.body.password);
  //
  // User.findOne({email:username},function(err,foundUser){
  //   if(err)
  //   {
  //     console.log(err);
  //   }else{
  //     if(foundUser){
  //       if(foundUser.password===password)
  //       {
  //         res.render("secrets");
  //       }
  //     }
  //   }
  // });

  const user=new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});



app.listen(3000,function(){
  console.log("Server started on port 3000");
});
