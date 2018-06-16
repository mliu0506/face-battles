/*
    game.js contains the JavaScript to run the main game of Rock Paper Scissor (Happy, Suprise, Neutral)
    Webcam library and Face++ API are called here
*/

//Shorthand for $(document).ready(function(){...});
$(function(){
    //GamePage Global Variables
    var messageList = $("#messageList"); //Variable for local chat messages
    var isPlayer2 = false;
    var camOn = false;
    var imgData;
    //Variables for local game score
    var winScore = 0;
    var loseScore = 0;
    //Variables for total scores
    var totalWin;
    var totalLose;
    var totalGames;
    //Variables for countdown timer
    var intervalID;
    var timer;
    //Gets the GameID from cookie, workaround page refreshs
    var p1gameID = getCookie("p1gameID");
    console.log("gameJS Cookie: " + p1gameID);
    var p2gameID = getCookie("p2gameID");
    console.log("gameJS Cookie: " + p2gameID);
    //Idenfiy the Player 1
    if ((p1gameID !== "") || (p1gameID == undefined)) {
        gameID = p1gameID;
        delCookie("p1gameID");
        //Display player1 name
        gamesRef.child(gameID).child("players").once('value', function(snapshot){
            playerRef = gamesRef.child(gameID).child("players").child("player1");
            $("#playerName").text(snapshot.val().player1.name);
        });
    }else if ((p2gameID !== "") || (p2gameID == undefined)){
        //Idenfiy the player2 
            isPlayer2 = true;
            gameID = p2gameID;
            playerRef = gamesRef.child(gameID).child("players").child("player2");
            delCookie("p2gameID");
            gamesRef.child(gameID).child("players").once('value', function(snapshot){
                var playerRef = database.ref('games/players/player2/');
                $("#playerName").text(snapshot.val().player2.name);
                $("#opponentName").text(snapshot.val().player1.name); 
            });
            console.log("Game Start")
             //Game Start when palyer 2 joined
            gamesRef.child(gameID).update({status:'game_running'});
    }
    
    
    //Firebase Listeners
        //Firebase Listeners
        gamesRef.on('value',function(snapshot){
            if(!(snapshot.child(gameID).exists())){
                //Game got removed or doesn't exist
                console.log("Game does not exist");
                document.location.href = "index.html";
            }
        });


    //Listen event for game status
    gamesRef.child(gameID).on('value', function(snapshot){
        if (snapshot.val().status == "game_running"){
            console.log("Game Running")
            $("#opponentName").text(snapshot.val().players.player2.name);
            makeButton();
        }
        if(!(snapshot.child('players').child('player2').exists())){
            //No player 2 or player 2 left
            console.log("NO PLAYER 2");
            if(camOn){
                //Turns off Camera
                Webcam.reset();
                camOn = false;
            }
            clearInterval(intervalID); //Stops timer in case it was running
            $("#playerImage").empty(); //Clear player side of field
            //Clear opponent side of field
            $("#opponentName").text("Waiting for player 2");
            $("#opponentImage").empty();
            $("#opponentWin").empty();
            $("#opponentLose").empty();
            gamesRef.child(gameID).update({status:'pending'});
        }
    });

    //Listen event for players status
    gamesRef.child(gameID).child('players').on('value', function(playerSnap){
        if (playerSnap.val().player1.status == 'stand_by' && playerSnap.val().player2.status == 'stand_by'){
            startRPS();
        }
        else if (playerSnap.val().player1.status == 'picture_taken' && playerSnap.val().player2.status == 'picture_taken'){
            if (isPlayer2){
                var choice = playerSnap.val().player2.emotion;
                var name = playerSnap.val().player2.name;
                var result = compareFace(choice, playerSnap.val().player1.emotion);
                displayOpponentImage(playerSnap.val().player1.img, playerSnap.val().player1.emotion, playerSnap.val().player1.likely);
            }
            else{
                var choice = playerSnap.val().player1.emotion;
                var name = playerSnap.val().player1.name;
                var result = compareFace(choice, playerSnap.val().player2.emotion);
                displayOpponentImage(playerSnap.val().player2.img, playerSnap.val().player2.emotion, playerSnap.val().player2.likely);
            }
           //update scores
           switch (result){
            case 'win':
                $("#playerImage").append("<p>You Win!</P>");
                $("#opponentImage").append("<p>You Lost!</P>");
                playerRef.update({
                    win: winScore++,
                    status: 'pending_results'
                });
                break;
            case 'lose':
                $("#playerImage").append("<p>You Lost!</P>");
                $("#opponentImage").append("<p>You Win!</P>");
                playerRef.update({
                    lose: loseScore++,
                    status: 'pending_results'
                });
                break;
            default:
                $("#playerImage").append("<p>Draw!</P>");
                $("#opponentImage").append("<p>Draw!</P>");
                playerRef.update({status: 'pending_results'});
        }
             //update in history
             if (result != undefined || result != null){
                console.log("HISTORY");
                var d = new Date();
                var timestamp = d.toUTCString();
                historyRef.push({
                uID: userKey,
                name: name,
                gamephoto: imgData,
                result: result,
                choice: choice,
                timestamp: timestamp
            });
            }
            //makeButton();
        }
        //Display player score
       if (userKey == gameID){
       //     $("#playerName").text(playerSnap.val().player1.name);
            var opponentRef = playerSnap.val().player2;
        }
       else{
       //     $("#playerName").text(playerSnap.val().player2.name);
            var opponentRef = playerSnap.val().player1;
        }
        $("#playerWin").text(winScore);
        $("#playerLose").text(loseScore);
        if(opponentRef != null){
            $("#opponentWin").text(opponentRef.win);
            $("#opponentLose").text(opponentRef.lose);
        }
    });


    
    //FUNCTIONS
    function makeButton(){
        //$("#playerImage").empty();
        var newButton = $("<button>");
        newButton.attr({
            class: "btn btn-success m-2",
            id: "gameReady"
        });
        newButton.text("Take Picture");
        $("#playerImage").append(newButton);
    }

    function startRPS(){
        $("#opponentImage").empty();
        timer = 5;
        clearInterval(intervalID);
        intervalID = setInterval(countdown, 1000);
        setTimeout(take_snapshot, 5000);
    }

    function countdown(){
        timer--;
        $("#playerImage").text(timer);
        if (timer <= 0 ){
            clearInterval(intervalID);
        }
    }

    function take_snapshot(){
        /*Function to snap a picture and passing in a callback function
        image data will be passed as data_uri*/
        clearInterval(intervalID);
        Webcam.snap(function(data_uri){
            detectFace(data_uri);
            console.log("picture taken");
        });
    }

    function detectFace(data_uri){
        /*Function to perform ajax call to Face++ API to detect faces from image
        and returns detected emotions*/
        var queryURL = "https://api-us.faceplusplus.com/facepp/v3/detect";
        //Removes 'data:image/jpeg;base64,' from the uri data to match Face++ parameter image_base64
        var data64 = data_uri.replace("data:image/jpeg;base64,","");
        //Create AJAX call
        $.ajax({
            url: queryURL,
            method: "POST",
            data: {
                api_key: "-5Nmk0fyCtdxK_l0lEvhOpHBMXj8g2Q7",
                api_secret: "QpE4oXV2onpKepQ65Nx0gE99-50Xmwrj",
                return_attributes: "emotion",
                image_base64: data64
            }
        }).then(function(response){
            //DEBUG LOG
            /*console.log(response.faces);
            var json = JSON.stringify(response, null, ' ');
            console.log(json);*/
            if(response.faces[0] == null){
                //Face++ could not detect a face in the given image, retake picture.
                $("#playerImage").text("Take Picture Again");
                setTimeout(startRPS, 2000);
                //DEBUG LOG
                console.log("Take Picture Again");
            }
            else{
                //Face++ detected a face, start analying emotions
                imgData = data_uri;
                var emotions = response.faces[0].attributes.emotion;
                var emotionValue = Math.max(emotions.happiness,emotions.surprise,emotions.neutral);
                var likely = likelyEmotion(emotionValue);
                var emotion;
                //compare most likely emotion
                switch (emotionValue){
                    case emotions.happiness:
                        emotion = "Happy";
                        break;
                    case emotions.surprise:
                        emotion = "Surprise";
                        break;
                    case emotions.neutral:
                        emotion = "Neutral";
                }
                var playerData = {
                    emotion: emotion,
                    likely: likely,
                    img: data_uri,
                    status: 'picture_taken'
                }
                playerRef.update(playerData);
                displayPlayerImage(data_uri, emotion, likely);
                //DEBUG LOG
                /*console.log("face detected");
                console.log(likely);
                console.log("Happiness: " + emotions.happiness);
                console.log("Surprise: " + emotions.surprise);
                console.log("Neutral: " + emotions.neutral);*/
            }
        });
    }

    function likelyEmotion(value){
        //Function takes an int value and returns a string response depending on likely emotion
        if (value >= 70){
            return "Very likely";
        }
        else if (value < 30){
            return "Best match";
        }
        else{
            return "Likely";
        }
    }

    function displayPlayerImage(data_uri, emotion, likely){
        //Function to display player image in the image section
        $("#playerImage").empty();
        $("#my_camera").css({display: 'none'});
        var img = $("<img>");
        img.attr({
            src: data_uri,
            class: 'img-fluid gameImages'
        });
        var emo = $("<p>");
        emo.text("You are " + emotion + " (" + likely +")");
        $("#playerImage").append(img);
        $("#playerImage").append(emo);
    }

    function displayOpponentImage(data_uri, emotion, likely){
        //Function to display opponent image in image section
        $("#opponentImage").empty();
        var img = $("<img>");
        img.attr({
            src: data_uri,
            class: 'img-fluid gameImages'
        });
        var emo = $("<p>");
        emo.text("You are " + emotion + " (" + likely +")");
        $("#opponentImage").append(img);
        $("#opponentImage").append(emo);
    }

    function compareFace(playerChoice, opponentChoice){
        //Function to compare player's choice with opponent's choice, return string: win, lose or draw
        //RPS logic: Happy > Neutral, Neutral > Suprise, Suprise > Happy
        switch(playerChoice){
            case 'Happy':
                switch(opponentChoice){
                    case 'Neutral':
                        return 'win';
                    case 'Suprise':
                        return 'lose';
                }
                break;
            case 'Neutral':
                switch(opponentChoice){
                    case 'Suprise':
                        return 'win';
                    case 'Happy':
                        return 'lose';
                }
                break;
            case 'Suprise':
                switch(opponentChoice){
                    case 'Happy':
                        return 'win';
                    case 'Neutral':
                        return 'lose';
                }
                break;
            default:
                return 'draw';
        }
    }


    //Click event for gameReady button
    $("#playerZone").on("click", $("gameReady"), function(){
        console.log("button clicked");
        $("#playerImage").empty();
        $("#my_camera").css({display: 'block'});
        if (!camOn){
            //Active and attach camera to DOM element
            Webcam.attach('#my_camera');
            camOn = true;
        }
        playerRef.update({status: 'stand_by'});
        //startRPS();
    });



    //TODO//
    //Click event for leaving game
    $("#leaveGame").on("click", function(){
        clearInterval(intervalID); //Stops Timer if it was running
        if(isPlayer2){
            playerRef.remove();
        }
        else{
            //Remove entire game from play
            gamesRef.child(gameID).remove();
        }
        document.location.href = "index.html";
    });
});