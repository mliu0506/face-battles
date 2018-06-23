function renderHistory() {
 

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



$(document).ready(function(){
  renderHistory()
});