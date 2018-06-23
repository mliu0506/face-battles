// Initialize Firebase
var config = {
  apiKey: "AIzaSyAWgWs9T8W_74HeEkg0vCYaj6QDIlf2soM",
  authDomain: "face-battles.firebaseapp.com",
  databaseURL: "https://face-battles.firebaseio.com",
  projectId: "face-battles",
  storageBucket: "",
  messagingSenderId: "170949236558"
};
firebase.initializeApp(config);

//Global variables
//Reminder -  declare the  app.js before your javascript 

// Firebase DB
var database = firebase.database();
var chatRef = database.ref('chats');
var usersRef = database.ref('users/');
var gamesRef = database.ref('games/');
var historyRef = database.ref('history/');
var tempRef = database.ref('temp/');

// Global variable
var gameID = "";
var userKey = "";
var photo ="";
var name = "";


//Goggle Sign In function
function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
  var ID = profile.getId();
  var email = profile.getEmail();
  //store the userID, photo URL & Name in the global variable
  photo = profile.getImageUrl();
  name = profile.getName();
  userKey = ID;
  usersRef.child(userKey).update({uID:ID,name,name,photo:photo,email:email,status:"online",lastdisconnect:""});
  console.log("Sign-in User key :" + userKey);
  $(".user-photo").html("<img class='rounded-circle' src="+ photo +" alt='avatar' />");
  $(".chat-with").text(name);
  setCookie("fbuID", userKey, 30); //save the uID into the cookie
  $("#loginCompleteBtn").show();
  $("#loginCompleteMsg").show();

}
//Google Sign out function
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  var d = new Date();
  var lastdisconnect = d.toUTCString();
  auth2.signOut().then(function () {
    usersRef.child(userKey).update({status:"offline",lastdisconnect:lastdisconnect});
    console.log(userKey + 'User signed out.');
  });
}


function logout() {
    //Log out function
    $("#signout").on("click", function() {
      signOut(); // Google logout
      location.reload(); // refresh
    });
}

//Setup the Game & reset values
function startGame() {

    //Hide the default Game button
    $(".delete-game").hide();
    $(".create-game").show();
    $("#loginCompleteBtn").hide();
    $("#loginCompleteMsg").hide();
    
    // Check to see if there is Cookie
    if (userKey == "") {
     var cookieKey= getCookie("fbuID"); //get the uID from the cookie
     console.log("Cookie Key: " + cookieKey);
     if ((cookieKey == "") || (cookieKey == null)) {
          cookieKey = ""; //if no cookie set Null and go to login page to login first
          $(".chat-header").prepend("<p><strong> Please go to user login page<strong></P>");
     } else {
        //lookup the photo and the name
        usersRef.child(cookieKey).once("value",function(childSnapshot){
          //save into the Golbal variable 
          photo = childSnapshot.val().photo;
          name = childSnapshot.val().name;
        });
        userKey = cookieKey;
        //gameID = userKey;
      }
    }
    
    if (userKey != "") {
    //Reset the Game button
    gamesRef.child(userKey).on('value', function(childSnapshot) {
      if (childSnapshot.val() !=null) {
      var gameStatus = childSnapshot.val().status;
      console.log("Check Game status : " + gameStatus);
      if (gameStatus == "pending") {
        $(".delete-game").show();
        $(".create-game").hide();
      } else {
        $(".create-game").show();
        $(".delete-game").hide();
      }
    }
    });

    //Refresh the message
    chatRef.once("value",function(childSnapshot){
      var message = childSnapshot.val().message;
      var username = childSnapshot.val().name;
      var userID = childSnapshot.val().uID;
      var photo = childSnapshot.val().photo;
      var timestamp = childSnapshot.val().timestamp;
      var d = new Date();
      var n = d.toUTCString();
      if (message != undefined) {
        if (userID == userKey) {
          $('.message-box').prepend('<div><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>'+username+'</span><span class="message-data-time" >'+timestamp+'</span></div><div class="message my-message">'+message+'</div></div>');
      
        } else {
        
          $('.message-box').prepend('<div class="clearfix"><div class="message-data align-right"><span class="message-data-time" >'+timestamp+'</span> &nbsp; &nbsp;<span class="message-data-name" >'+username+'</span> <i class="fa fa-circle me"></i></div><div class="message other-message float-right">'+message+'</div></div>');
        }
      }
    });
  }
}




// Tests to see if /games/<userId> has any data. 
function checkIfGameExists(userId) {
  gamesRef.child(userId).once('value', function(childSnapshot) {
    var status = childSnapshot.val().status;
  });
    console.log("Game exist :"+ userId +" value :" + status);
    if (status === "pending") {
      return "true";
    } else {
      return "false";
    } 

}

function renderChatRoomHeader() {
  // when ever the user DB value is being update, the following function will be trigger
  usersRef.on("child_added", function(childsnapshot) {
    console.log("Chat Room User key :" + userKey);
   if (childsnapshot.key === userKey){
      var photo = childsnapshot.val().photo;
      var name = childsnapshot.val().name;
      console.log("Photo:" + childsnapshot.val().photo);
      console.log("Name:" + childsnapshot.val().name);
      $(".user-photo").html("<img class='rounded-circle' src="+ photo +" alt='avatar' />");
      $(".chat-with").text(name);
   }
    });

  
  }


  function renderUserList() {
    // when ever the user DB value is being update, the following function will be trigger
    usersRef.on("value", function(childsnapshot) {
      console.log("User List :" + userKey);
      $(".list").empty();
      childsnapshot.forEach(function(child) {
          if (child.key !== userKey){
              
              var photo = child.val().photo;
              var name = child.val().name;
              var status = child.val().status; 
              var lastdisconnect = child.val().lastdisconnect;
              console.log("Name:" + child.val().name);
              console.log("Status:" + child.val().status); 
              $(".list").append(" <div class='clearfix'><img class='rounded-circle' src="+ photo +" alt='avatar' /><div class='about'><div class='name'>" + name + "</div><div class='status'><i class='fa fa-circle "+ status + "'></i>" + lastdisconnect+"</div></div></div>");

  
          }
      });
    });
  }
  

  function renderchatRoomMessage() {
    $('.chat-submit').on("click",function(){
      var comment = $('#message-to-send').val().trim();
      var d = new Date();
      var timestamp = d.toUTCString();
      console.log("Message : "+comment);
      if((comment != "") && (userKey != "")) {
        chatRef.push({uID:userKey,name:name,photo:photo,message:comment,timestamp:timestamp});
        $('#message-to-send').val(""); // empty the input text field
      }
    });

    chatRef.on("child_added",function(childSnapshot){
      var message = childSnapshot.val().message;
      var username = childSnapshot.val().name;
      var userID = childSnapshot.val().uID;
      var photo = childSnapshot.val().photo;
      var timestamp = childSnapshot.val().timestamp;
      var d = new Date();
      var n = d.toUTCString();
      if (userID === userKey) {
        $('.message-box').prepend('<div><div class="message-data"><span class="message-data-name"><i class="fa fa-circle online"></i>'+username+'</span><span class="message-data-time" >'+timestamp+'</span></div><div class="message my-message">'+message+'</div></div>');
      
      } else {
        
        $('.message-box').prepend('<div class="clearfix"><div class="message-data align-right"><span class="message-data-time" >'+timestamp+'</span> &nbsp; &nbsp;<span class="message-data-name" >'+username+'</span> <i class="fa fa-circle me"></i></div><div class="message other-message float-right">'+message+'</div></div>');
      }
    });
  
  }

  function createGameRoom() {
    $(".create-game").on("click",function(){
    if (userKey != "") {
      gameID = userKey;
      //tempRef.update({gameID:gameID});
      setCookie("p1gameID", gameID, 30); //save the uID into the cookie
      var d = new Date();
      var timestamp = d.toUTCString();
      console.log("Create Game : "+ gameID);
      if(gameID != ""){
        gamesRef.child(gameID).update({status:'pending',name:name,photo:photo,timestamp:timestamp});
        gamesRef.child(gameID).child("players").child("player1").update({uID:userKey,win:0,lose:0,name:name,status:'pending_player2'});
        $(".delete-game").show();
        $(".create-game").hide();
      }
      //window.open("gamePage.html", '_blank');  //open a new  window
      document.location.href = "gamePage.html";   //open the same window
    }
    });

    $(".delete-game").on("click",function(){
    if (userKey != "") {
      gameID = userKey;
      var d = new Date();
      var timestamp = d.toUTCString();
      console.log("Delete Game : "+gameID);
      if(gameID != ""){
        gamesRef.child(gameID).remove();
        $(".delete-game").hide();
        $(".create-game").show();
      }
    } 
    });
  }




$(document).ready(function(){
  startGame();
  renderChatRoomHeader();
  renderUserList();
  renderchatRoomMessage();
  createGameRoom();
  logout();
});
