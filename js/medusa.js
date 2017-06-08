
//global var



/************************************
* POSITION ARRAYS FOR TASKS
* these positions are relative to the window
************************************/
simple_paradigm_settings = {
    position_array:[[0.5,0.2],[0.8,0.2],[0.2,0.5],[0.8,0.5],[0.2,0.8],[0.5,0.8],[0.8,0.8]],
    num_trials: 5,
    dot_show_time: 2000,     // amount of time dot will appear on screen with each trial. in mls
    target_show_time: 1500 // amount of time target will appear on screen with each trial. in mls
};

pursuit_paradigm_settings = {
    position_array:[
        {x: "20%", y: "20%", tx: "80%", ty: "20%"},
        {x: "20%", y: "20%", tx: "20%", ty: "80%"},
        {x: "20%", y: "20%", tx: "80%", ty: "80%"},

        {x: "80%", y: "20%", tx: "20%", ty: "20%"},
        {x: "80%", y: "20%", tx: "20%", ty: "80%"},
        {x: "80%", y: "20%", tx: "80%", ty: "80%"},

        {x: "20%", y: "80%", tx: "20%", ty: "20%"},
        {x: "20%", y: "80%", tx: "80%", ty: "20%"},
        {x: "20%", y: "80%", tx: "80%", ty: "80%"},

        {x: "80%", y: "80%", tx: "20%", ty: "20%"},
        {x: "80%", y: "80%", tx: "80%", ty: "20%"},
        {x: "80%", y: "80%", tx: "20%", ty: "80%"}
    ],
    num_trials: 5,
    dot_show_time: 2000,
    target_show_time: 1500
}

/************************************
* VARIABLES
************************************/
const tableName = "Gazers"; // name of table in database
var gazer_id = "";  // id of user
var cur_url = "";   // url of website
var time = "";  // time of current webgazer session
var x_array = [];
var y_array = [];
var current_task = "calibration";    // current running task.
var curr_object = null;     // current object on screen. Can be anything. Used to check collision
var objects_array = [];    //array of dots
var num_objects_shown = 0; //number of objects shown

/************************************
* CALIBRATION PARAMETERS
************************************/
var calibration_settings = {
    method: "watch",    // calibration method, either watch or click.
    duration: 20,  // duration of a a singe position sampled
    num_dots: 10,  // the number of dots used for calibration
    position_array: [[0.2,0.2],[0.8,0.2],[0.2,0.5],[0.5,0.5],[0.8,0.5],[0.2,0.8],[0.5,0.8],[0.8,0.8],[0.35,0.35],[0.65,0.35],[0.35,0.65],[0.65,0.65],[0.5,0.2]],  // array of possible positions
};

/************************************
* VALIDATION PARAMETERS
************************************/
var validation_settings = {
    method: "watch",    // validation method, either watch or click.
    duration: 20,  // duration of a a singe position sampled
    num_dots: 10,  // the number of dots used for validation
    position_array: [],    // array of possible positions
    distance: 100
};

/************************************
* SETTING UP AWS
************************************/
AWS.config.region = 'us-east-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
IdentityPoolId: IdentityPoolId ,
RoleArn: RoleArn
});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();


/************************************
* COMMON FUNCTIONS
************************************/
/**
 * Shuffles array in place.
 * @param array items The array containing the items.
 * @author http://stackoverflow.com/a/2450976/4175553
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

/**
 * create the overlay over the website
 */
function create_overlay(){
    var canvas = document.createElement('canvas');
    canvas.id     = "canvas-overlay";
    canvas.addEventListener("mousedown", canvas_on_click, false);
    // style the newly created canvas
    canvas.style.zIndex   = 10;
    canvas.style.position = "fixed";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.backgroundColor = "#1c1d21";
    // add the canvas to web page
    document.body.appendChild(canvas);
}

/**
 * clear all the canvas
 */
function clear_canvas () {
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Get html element from a point
 * @param {*} x - x_coordinate of point
 * @param {*} y - y_coordinate of point
 */
function get_elements_seen(x,y){
    var element = document.elementFromPoint(x, y);
    if (element in elem_array ){
        elem_array[element] = elem_array[element] + 1
    }
    else{
        elem_array[element] = 1
       
    }
}

/**
 * Delete an element with id
 * @param {*} id - id the of element
 */
function delete_elem(id) {
    var elem = document.getElementById(id);
    elem.parentNode.removeChild(elem);
}

/**
 * Dot object
 * @param {*} x - x_coordinate of the center
 * @param {*} y - y_coordinate of the center
 * @param {*} r - radius
 */
var Dot = function (x, y, r) {
    r = (typeof data !== "undefined") ? r : 10;
    this.x = x;
    this.y = y;
    this.r = r;
    this.left = x - r;
    this.top = y - r;
    this.right = x + r;
    this.bottom = y + r;
    this.hit_count = 0;
};

/**
 * Create an array of dots from an array of positions, then shuffle it
 * @param {*} pos_array - array of positions
 * @param {*} radius - the radius of the dots
 * @return{*} dot_array - the array of dots
 */
function create_dot_array(pos_array, radius){
    radius = (typeof data !== "undefined") ? radius : 10;
    var dot_array = [];
    for (var dot_pos in pos_array){
        if (pos_array.hasOwnProperty(dot_pos)) {
            dot_array.push(new Dot(canvas.width * dot_pos[0], canvas.height * dot_pos[1], radius));
        }
    }
    dot_array = shuffle(dot_array);
    return dot_array;
}

/**
 * Draw the a dot
 * @param {*} context - context of canvas
 * @param {*} dot - the Dot object
 * @param {*} color - color of the dot
 */
function draw_dot(context, dot, color) {
    context.beginPath();
    context.arc(dot.x, dot.y, dot.r, 0, 2*Math.PI);
    context.fillStyle = color;
    context.fill();
}

/**
 * Check if an object collides with a mouse
 * @param {*} mouse 
 * @param {*} object 
 */
function collide_mouse(mouse, object) {
    return (mouse.x < object.right && mouse.x > object.left && mouse.y > object.top && mouse.y < object.bottom);
}

/**
 * Action when the mouse is clicked on canvas
 * @param {*} event 
 */
function canvas_on_click(event) {
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    var x = event.x;
    var y = event.y;
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;
    var mouse = {x:x,y:y};
    if (collide_mouse(mouse, curr_object) === false) return;
    switch(current_task) {
    case "calibration":
        if (calibration_settings.method === 'click'){
            create_new_dot_calibration();
        }
        break;
    case "validation":
        if (validation_settings.method === 'click'){
            create_new_dot_validation();
        }
        break;
    }
}

/**
 * A backward compatiblity version of request animation frame
 * @author http://www.html5canvastutorials.com/advanced/html5-canvas-animation-stage/
 */
window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
      })();

function show_target(){
}
/************************************
* MAIN FUNCTIONS
************************************/

/**
 * record gaze location into x and y arrays. Used to control sample rate
 * otherwise, collect_data() will collect data at maximum sample rate
 */
function record_gaze_location(){
    var prediction = webgazer.getCurrentPrediction();
    if (prediction) {
        x_array.push(prediction.x);
        y_array.push(prediction.y);
    }
}

/**
 * Create unique ID from time + RNG. Load the ID from local storage if it's already there.
 */
function createID() {
    // check if there is a gazer_id already stored
    if (typeof(Storage) !== "undefined") {
        console.log(localStorage.getItem("gazer_id"));
        if (localStorage.getItem("gazer_id") !== null){
            gazer_id = localStorage.getItem("gazer_id");
        }
        else{
            gazer_id = "id-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
            localStorage.setItem("gazer_id", gazer_id);
        }
    } 
    else{
        gazer_id = "id-"+((new Date).getTime().toString(16)+Math.floor(1E7*Math.random()).toString(16));
    }
}

/**
 * Load Webgazer. Once loaded, start the collect data procedure
 * @author 
 */
function load_webgazer() {
    $.getScript( "js/webgazer.js" )
        .done(function( script, textStatus ) {
            initiate_webgazer();
        })
        .fail(function( jqxhr, settings, exception ) {
            $( "div.log" ).text( "Triggered ajaxError handler." );
        });
}

/**
 * start WebGazer and collect data
 */
function initiate_webgazer(){
    createID();
    cur_url = window.location.href;
    time = (new Date).getTime().toString();
    webgazer.clearData()
        .setRegression('ridge') 
  	    .setTracker('clmtrackr')
        .setGazeListener(function(data, elapsedTime) {
            if (data === null) {
                return;
            }
            if (current_task === "validation") {
                validation_event_handler(data);
            }
            x_array.push(data.x);
            y_array.push(data.y);
            get_elements_seen(data.x,data.y);
        })
    	.begin()
        .showPredictionPoints(false); /* shows a square every 100 milliseconds where current prediction is */
    // setInterval(function(){ record_gaze_location() }, 1000);
    check_webgazer_status();
}

/**
 * Check if webgazer successfully initiated.
 */
function check_webgazer_status() {
    if (webgazer.isReady()) {
        console.log('webgazer is ready.');
        // Create database
        create_gazer_database_table();
    } else {
        setTimeout(check_webgazer_status, 100);
    }
}

/**
 * Create data table in the database if haven't already exists
 */
function create_gazer_database_table() {
    var params = {
        TableName : tableName,
        KeySchema: [
            { AttributeName: "gazer_id", KeyType: "HASH"},
            { AttributeName: "time_collected", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "gazer_id", AttributeType: "S" },              
            { AttributeName: "time_collected", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };
    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.log("Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2));
        } else {
            console.log("Created table: " + "\n" + JSON.stringify(data, undefined, 2));
        }
    });
}

/**
 * send data to server
 * @param {*} data - the type of data to be sent to server. 
 */
function send_data_to_database(data){
    data = (typeof data !== "undefined") ? data : {"url": cur_url, "gaze_x": x_array, "gaze_y":y_array};
    var params = {
        TableName :tableName,
        Item: {
            "gazer_id": gazer_id,
            "time_collected":time,
            "info":data
        }
    };
    docClient.put(params, function(err, data) {
        if (err) {
            console.log("Unable to add item: " + "\n" + JSON.stringify(err, undefined, 2));
        } else {
            console.log("PutItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2));
        }
    });
}

/**
 * clean up webgazer and send data to server. Must call once the validation ends
 */
function end_experiment(){
    // end web gazer 
    // webgazer.end(); 
    // send data to server
    sendGazerToServer();
}

/**
 * Navigate to a specific task. Task is selected with the task variable. 
 */
function task_navigation(){
    if (task === 1){
        prepare_calibration();
    }
}

/************************************
* CALIBRATION AND VALIDATION
************************************/
/**
 * show the consent form before doing calibration
 */
function create_consent_form() {
    // hide the background and create canvas
    create_overlay();
    var form = document.createElement("div");
    form.id = "consent_form";
    form.className += "overlay-div";
    form.innerHTML +=
                            "<header class=\"form__header\">" +
                                "<h2 class=\"form__title\">Are you cool with us using your webcam to collect data about your eye movement?</h2>" +
                            "</header>" +

                            "<form>" +
                                "<fieldset class=\"form__options\">" +
                                    "<p class=\"form__answer\">" +
                                        "<input name=\"consent\" type=\"radio\" id=\"consent-yes\" value=\"yes\">" +
                                        "<label for=\"consent-yes\"> Yeah sure. </br>" +
                                                                    "I'm cool with that."+
                                        "</label>" +
                                    "</p>" +

                                    "<p class=\"form__answer\">" +
                                        "<input name=\"consent\" type=\"radio\" id=\"consent-no\" value=\"no\">" +
                                        "<label for=\"consent-no\">No thanks. </br>" +
                                                                "That sounds creepy..." +
                                        "</label>" +
                                    "</p>" +
                                "</fieldset>" +

                                "<button class=\"form__button\" type=\"button\" onclick=\"create_calibration_instruction() \">Next ></button>" +
                            "</form>";
    form.style.zIndex = 11;
    document.body.appendChild(form);
}

/**
 * show the calibration instruction  form
 */
function create_calibration_instruction() {
    var instruction = document.createElement("div");
    delete_elem("consent_form");
    instruction.id = "instruction";
    instruction.className += "overlay-div";
    instruction.style.zIndex = 12;
    instruction.innerHTML += "<header class=\"form__header\">" +
                                "<h2 class=\"form__title\">Thank you for participating. </br> Please click at the dots while looking at them.</h2>" +
                             "</header>" +
                             "<button class=\"form__button\" type=\"button\" onclick=\"start_calibration()\">Start ></button>";
    document.body.appendChild(instruction);
}

/**
 * Prepare the calibration 
 */
function start_calibration() {
    if ($("#consent-yes").is(':checked')) {
        var canvas = document.getElementById("canvas-overlay");
        var context = canvas.getContext("2d");
        clear_canvas();
        delete_elem("instruction");
        current_task = 'calibration';
        if (objects_array.length === 0) {
            objects_array = create_dot_array(calibration_settings.position_array);
        }
        curr_object = objects_array.pop();
        draw_dot(context, curr_object, "#EEEFF7");
        num_objects_shown ++;
    }
}

/**
 * function to call when click event is triggered during calibration
 */
function create_new_dot_calibration(){
    if (num_objects_shown > calibration_settings.num_dots) {
        finish_calibration();
        return;
    }
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    // if run out of dots, create a new dots array
    if (objects_array.length === 0) {
        objects_array = create_dot_array(calibration_settings.position_array);
    }
    curr_object = objects_array.pop();
    draw_dot(context, curr_object, "#EEEFF7");
    num_objects_shown++;
}

/**
 * When finish calibration
 */
function finish_calibration(){
    objects_array = [];
    num_objects_shown = 0;
    start_validation();
}

/**
 * prepare for the calidation process
 */
function start_validation(){
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    current_task = 'validation';
    if (objects_array.length === 0) {
        objects_array = create_dot_array(validation_settings.position_array);
    }
    curr_object = objects_array.pop();
    draw_dot(context, curr_object, "#EEEFF7");
    num_objects_shown ++;
}

/**
 * function to call when click event is triggered during validation
 */
function create_new_dot_validation(){
    if (num_objects_shown > validation_settings.num_dots) {
        finish_validation();
        return;
    }
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    // if run out of dots, create a new dots array
    if (objects_array.length === 0) {
        objects_array = create_dot_array(validation_settings.position_array);
    }
    curr_object = objects_array.pop();
    draw_dot(context, curr_object, "#EEEFF7");
    num_objects_shown++;
}

function validation_event_handler(data) {
    var dist = parseInt(Math.sqrt(((data.x - curr_object.x) * (d.x - curr_object.x)) + ((data.y - curr_object.y) * (data.y - curr_object.y))));
    if (dist < validation_settings.distance) {
        if (curr_object.hit_count < validation_settings.duration) {
            curr_object.hit_count += 1;
        } else {
            create_new_dot_validation();
        }
    }
}

function finish_validation(){
    objects_array = [];
    num_objects_shown = 0;
}

/************************************
 * SIMPLE DOT VIEWING PARADIGM
 * If you want to introduce your own paradigms, follow the same structure and extend the design array above.
 ************************************/
function start_simple_paradigm() {
    // if we don't have dot-positions any more, refill the array
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    current_task = 'simple_paradigm';
     if (objects_array.length == 0) {
        objects_array = create_dot_array(simple_paradigm_settings.position_array);
    }
    curr_object = objects_array.pop();
    num_objects_shown ++;
    if (num_objects_shown > simple_paradigm_settings.num_trials) {
        end_simple_paradigm();
    }
    else{
        show_target();
        setTimeout(function(){clear_canvas(); draw_dot(context, curr_object, "#EEEFF7");},simple_paradigm_settings.target_show_time);
        setTimeout("start_simple_paradigm();",simple_paradigm_settings.dot_show_time);
    }
}
function end_simple_paradigm(){
    //TODO: finish this function
}

/************************************
 * SMOOTH PURSUIT PARADIGM
 ************************************/
function start_pursuit_paradigm() {
    // if we don't have dot-positions any more, refill the array
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    current_task = 'pursuit_paradigm';
     if (objects_array.length == 0) {
        objects_array = shuffle(pursuit_paradigm_settings.position_array);
    }
    curr_object = objects_array.pop();
    num_objects_shown ++;
    if (num_objects_shown > pursuit_paradigm_settings.num_trials) {
        end_pursuit_paradigm();
    }
}

function draw_moving_dot(){
    draw_dot(context, curr_object, "#EEEFF7");
}

function end_pursuit_paradigm(){

}

/************************************
 * FREE VIEWING PARADIGM
 ************************************/
var tFreeview = {};
tFreeview.stimuli = [];
function freeviewStart() {
    if (tFreeview.stimuli.length == 0) {
        for (var k = 1; k <= 30; k++) {
            if (k < 10) {
                tFreeview.stimuli.push("stimuli/tolcam_face_0" + k + ".png");
            } else {
                tFreeview.stimuli.push("stimuli/tolcam_face_" + k + ".png");
            }
        }
        tFreeview.stimuli = shuffle(tFreeview.stimuli);
    }
    var img = tFreeview.stimuli.pop();
    $('#stimuli_fixation').css({
        'top': '50%',
        'left': '50%'
    });
    var type = Math.random() >= 0.5 ? "left" : "right";

    $('#stimuli_img').css({
        "left": type == "left" ? "25%" : "75%",
        "width": "50%",
        "background-image": "url("+img+")"
    });


    data_current.task = 'freeviewing';
    data_current.x = $('#stimuli_img').css('left');
    data_current.y = "0%";
    data_current.condition = 'view_' + img + '_' + type;


    cam.recording = 1;
    setTimeout("$('#stimuli_fixation').hide(); status = 'fixation_offset';", 1000);
    setTimeout("freeviewShow();", 1500);
}

function freeviewShow() {
    status = 'stimulus_onset';
    $('#stimuli_img').show();
    setTimeout("status = 'stimulus_offset'; endTrial();", 3000);
}
