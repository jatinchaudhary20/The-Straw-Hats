var username
var password
var temp=0;
const express=require("express");
const bodyParser=require("body-parser");
const request=require("request");
const https=require("https");
const mongoose=require("mongoose"); 
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app=express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');
mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema={
    Name:{
        type:String,
        unique:true,
        required:true
    },
    Password:{
        type:String,
        required:true
    }
}
const recordSchema={
    Transaction:Number
}

const userrecordschem={
    Name:String,
    Password:String,
    Transactionprice:[recordSchema]
}
const expenseSchema={
    Name:String,
    CategoryName:String,
    Price:[recordSchema]
}
const itemSchema={
    Name:String
}
const graphSchema={
    Name:String,
    CatName:[itemSchema],
    Sumprice:[recordSchema]
}
const User=mongoose.model("User",userSchema);
const Record=mongoose.model("Record",recordSchema);
const Userrecord=mongoose.model("userrecord",userrecordschem);
const Userexpense=mongoose.model("Userexpense",expenseSchema);
const Graph=mongoose.model("Graph",graphSchema);
const Item=mongoose.model("Item",itemSchema);
const record=new Record({
    Transaction:0
  });
 // record.save();
  const fixed=[record];
app.get("/",function(req,res){
res.render("LOGIN",{Login:"LogIN"});
});
app.post("/login",function(req,res){
   username=req.body.username;
    password=req.body.password;
   
   User.findOne({Name:username,Password:password},false).then(function(founduser){
   
        if(founduser){

            
            Userrecord.findOne({Name:username,Password:password},false).then(function(foundrecord){
              if(!foundrecord){
               
                const userrecord1= new Userrecord({
                    Name:username,
                    Password:password,
                    Transactionprice:[record]
                   });
                   userrecord1.save();
        }
    });
        res.redirect("/main");
            }else{
                     res.redirect("/failure");
               }
   });
});
app.post("/signuppage",function(req,res){
    res.render("signup",{Err:"Enter Information"});
});
app.post("/signup",function(req,res){
var newname=req.body.newname;
var pass1=req.body.password1;
var pass2=req.body.password2;
User.findOne({Name:newname},false).then(function(oldname){
    if(oldname){
        res.render("LOGIN",{Login:"User Name exist! Login Again"});
    }else{
        if(pass1===pass2){
            const user=new User({
                Name:newname,
                Password:pass1
            });
             user.save();
             res.sendFile(__dirname+"/LOGIN.html");
        }else{
            res.render("signup",{Err:"Password Not matched"});
        }
    }
});


});
app.get("/failure",function(req,res){
    res.sendFile(__dirname +"/failure.html");
});
app.post( "/againLogin",function(req,res){
res.redirect("/");
});

app.post("/dataentry",function(req,res){
    var transaction=req.body.transaction;
    
    const record1=new Record({
        Transaction:transaction
      });
      record1.save();
      Userrecord.findOne({Name:username,Password:password},false).then(function(foundrecord){
        
        foundrecord.Transactionprice.push(record1);
       foundrecord.save();
    });
   
       res.redirect("/main");
    
});
app.get("/main",function(req,res){
    var Dsum=0;
    Userrecord.findOne({Name:username,Password:password},false).then(function(foundrecord){
            for(var i=0;i<foundrecord.Transactionprice.length;i++){
          Dsum=Dsum+foundrecord.Transactionprice[i].Transaction;
            }
        res.render("main", {Uname:foundrecord.Name, item:foundrecord.Transactionprice, Cname:temp,Sname:Dsum});
    });
});
app.post("/delete",function(req,res){
     var eleID=req.body.checkbox;
     console.log(eleID);
     Userrecord.findOneAndUpdate({Name:username,Password:password},{ $pull:{Transactionprice:{_id:eleID}}}).then(function(deletedata){
        if(deletedata){
            res.redirect("/main");
        }
     })
         
});
app.post("/logout",function(req,res){
      username=null;
      password=null;
      res.render("LOGIN",{Login:"LogIN"});
});
app.post("/currency",function(req,res){
    var name=req.body.Currency;
    name=name.toUpperCase();
    const url="https://api.currencyapi.com/v3/latest?apikey=cur_live_WLAtwWncgqQLFTTKVnihFbBBgUtWs27p9SorNtK7&currencies="+name;

    https.get(url,function(response){
    console.log(response.statusCode);
    response.on("data",function(data){
    const currencyData=JSON.parse(data); 
    temp=JSON.stringify(currencyData.data);
   res.redirect("/main");
});
});
});
app.post("/addmore",function(req,res){
var categoryname=req.body.category;
categoryname=categoryname.toUpperCase();
  Userexpense.findOne({Name:username,CategoryName:categoryname},false).then(function(foundexpense){
if(foundexpense){
res.redirect("/main");
}else{
const userexpense1=new Userexpense({
Name:username,
CategoryName:categoryname,
Price:fixed
});
userexpense1.save();
res.redirect("/main");
}
});
});

app.post("/show",function(req,res){
 Userexpense.find({Name:username}).then(function(found){
    
 res.render("expense",{Category:username,category:found});
   });
});
var ctname;


app.get("/Goto",function(req,res){
    var catsum=0;
    Userexpense.findOne({Name:username,CategoryName:ctname}).then(function(found){
         for(var i=0;i<found.Price.length;i++){
       catsum=catsum+found.Price[i].Transaction;
         }
        res.render("Category", {Uname:found.CategoryName, item:found.Price, Cname:temp,Sname:catsum});
    });
});
app.post("/Goto",function(req,res){
    ctname=req.body.checkbox;
res.redirect("/Goto");
});

app.post("/main",function(req,res){
    res.redirect("/main");
});
app.post("/addexpense",function(req,res){
      var item=req.body.transaction;
      var itemname=req.body.categoryname;
      const record2=new Record({
        Transaction:item
      });
      record2.save();
      Userexpense.findOne({Name:username,CategoryName:itemname}).then(function(found){
         found.Price.push(record2);
         found.save();
       res.redirect("/Goto");
      });   
});
app.post("/deleteexpense",function(req,res){
    var ID=req.body.checkboxdata;
    var IDname=req.body.itemname;
    Userexpense.findOneAndUpdate({Name:username,CategoryName:IDname},{ $pull:{Price:{_id:ID}}}).then(function(founditem){ 
    if(founditem){
    founditem.save();
    res.redirect("/Goto");
    }
    });
});
app.post("/Graph",function(req,res){
 Userexpense.find({Name:username}).then(function(foundexpense){
        var arr1=[];
        var arr2=[]; 
         for(var i=0;i<foundexpense.length;i++){
             var expensename;
             var sum=0;
          expensename=foundexpense[i].CategoryName;
          for(var j=0;j<foundexpense[i].Price.length;j++){
             sum=sum+foundexpense[i].Price[j].Transaction;
          }
          arr1.push(expensename);
          arr2.push(sum);
         } 
          console.log(arr1);
          console.log(arr2);
        res.render("graph",{x:arr1,y:arr2});
});
        });
        
app.listen(3000, function(){
    console.log("Server 3000 is running");
});