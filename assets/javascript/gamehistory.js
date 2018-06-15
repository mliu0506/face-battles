function renderHistory() {
 
//  This is testing function for creating a testing record    
//historyRef.child("TestPicture").once("value",function(childSnapshot) {  
//    var gamephoto = childSnapshot.val().img;
//    $('.slider').prepend("<div class='slide'><img src='"+ gamephoto + "' /><p> testing picture </p></div>");       
//    var name = "Michael Liu";
//    var userID = "108155336031129825356";
//    var result = "win";
//    var choice = "happy";
//    var d = new Date();
//    var timestamp = d.toUTCString();
//    if((userKey !== "")||(userKey!==null)) {
//        historyRef.push({uID:userKey,name:name,gamephoto:gamephoto,result:result,choice:choice,timestamp:timestamp});
//    }    
//});
    
   // when ever the user DB value is being update, the following function will be trigger
   // historyRef.on("child_added",function(childSnapshot){
   // 
   //     var gamephoto = childSnapshot.val().gamephoto;
   //     var username = childSnapshot.val().name;
   //     var userID = childSnapshot.val().uID;
   //     var result = childSnapshot.val().result;
   //     var choice = childSnapshot.val().choice;
   //     var timestamp = childSnapshot.val().timestamp;
   //     $('.slider').prepend("<div class='slide'><img src='"+ gamephoto + "' /><p>" + username +" : " + result + " : " + choice + "</p></div>");       
       
   // });
    historyRef.on("child_added",function(childSnapshot){

        var gamephoto = childSnapshot.val().gamephoto;
        var username = childSnapshot.val().name;
        var userID = childSnapshot.val().uID;
        var result = childSnapshot.val().result;
        var choice = childSnapshot.val().choice;
        var timestamp = childSnapshot.val().timestamp;
        $('.photo-history').prepend("<div class='slide'><img class='img-fluid img-thumbnail' src='"+ gamephoto + "' /><p>" + username +" : " + result + " : " + choice + "</p></div>");       
       
    });

}


function renderProfile() {
    if (userKey == "") { //if user have not login 
        $(".userName").text("GUEST BOOK");
    } else { // if user login
    usersRef.child(userKey).once("value",function(childSnapshot) {
        var name = childSnapshot.val().name;
        $(".userName").text(name);
        if (!childSnapshot.child("totgames").exists()) {  // if totgame not exist
            $(".gameResult").html("Number of Game : <br>Win : <br>Lose : </p>" );
        } else { // if totgame exist
        var totgames = childSnapshot.val().totgames;
        var totwin = childSnapshot.val().totwin;
        var totlose = childSnapshot.val().totlose;
        $(".gameResult").html("Number of Game : " + totgames + "<br>Win : " + totwin + "<br>Lose : "+ totlose +"</p>" );
        }
    
    });
    }
}



$(document).ready(function(){
  renderHistory();
  renderProfile();
});