
/**
 * Save webgazer data to csv.
 */
function save_to_csv(){
    var data = [];
    data.push(store_data.elapsedTime, store_data.gaze_x,store_data.gaze_y,store_data.object_x,store_data.object_y);
    var csv_content = "data:text/csv;charset=utf-8,";
    data.forEach(function(infoArray, index){
        dataString = infoArray.join(",");
        csv_content += index < data.length ? dataString+ "\n" : dataString;
    });
    el = encodeURI(csv_content);
    el.setAttribute("href", "data:"+data);
    el.setAttribute("download", iframe_link + ".csv");
}

/**
 * Checks if an object collides with a mouse click
 * @param {*} mouse
 * @param {*} object
 */
function collide_mouse(mouse, object) {
    return (mouse.x < object.right && mouse.x > object.left && mouse.y > object.top && mouse.y < object.bottom);
}

/**
 * Handles clicks on canvas
 * @param {*} event
 */
function canvas_on_click(event) {
    var canvas = document.getElementById("canvas-overlay");
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

/************************************
 * IFRAME
 ************************************/
/**
 * iframe containment. Create an iframe to contain another website
 */
function create_iframe_testable(){
    var iframe = document.createElement("iframe");
    iframe.source = iframe_link;
    iframe.id = "iframe";
    var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
    document.appendChild(iframe);
}


/************************************
 * IFRAME PARADIGM
 * If you want to introduce your own paradigms, follow the same structure and extend the design array above.
 ************************************/

/**
 * Create an iframe to contain other websites, and then monitor the usage of the websites
 */
function loop_iframe_paradigm(){
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    collect_data = true;
    webgazer.resume();
    clear_canvas();
    current_task = "iframe";
}

function finish_iframe_paradigm(){
    objects_array = [];
    num_objects_shown = 0;
    store_data.task = iframe_link;
    store_data.description = "success";
    webgazer.pause();
    collect_data = false;
    send_gaze_data_to_database(navigate_tasks);
}



function create_pikachu_img(){
    var img_content = new Image();
    img_content.src = "../assets/images/gif/sprite/infernape.png";
    img_content.onload = function () {
    var img = {
        'content': img_content,    
        'current_frame': 0,
        'total_frames': 133,
        'width': 80,
        'height': 73,
        'x': 0,
        'y': 0,
        'render_rate': 1,
        'render_count': 0
        };
        pikachu_img = img
    }
}

/**
 * el: the html element, most likely a <a> tag, that contains the link to the download file
 */
function download_calibration_data(el) {
    var data = webgazer.getTrainingData();
    data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    el.setAttribute("href", data);
    var date = new Date().toDateString();
    el.setAttribute("download", "calibration_data " + date + ".json");
}
/**
 * Auto fill the survey
 * @param {*} obj - whether the user has filled the form before. yes/no 
 */
function autofill_survey(obj) {
    if (obj.value === "no") return;
    var user_survey_choices = {};
    if (typeof(Storage) !== "undefined") {
        if (localStorage.getItem("user_survey_choices") !== null) {
            user_survey_choices = JSON.parse(localStorage.getItem("user_survey_choices"));
            $("select").each(function () {
                if (user_survey_choices.hasOwnProperty(this.id)) {
                    this.value = user_survey_choices[this.id];
                }
            });
        }
    }
}

/************************************
 * VALIDATION
 ************************************/
function create_validation_instruction() {
    var instruction_guide1 = "There will be a dot appearing on the screen. Please look at it until the score on the dot reaches " + validation_settings.hit_count.toString() + " points. You will have to repeat this procedure " + validation_settings.num_dots + " times. If the score does not reach " + validation_settings.hit_count.toString() + " points in " + (validation_settings.duration / 1000).toString() + " seconds, you will be redirected to the calibration process. </br> Press the button when you're ready.";
    create_general_instruction("Validation(2/5)", instruction_guide1, "start_validation()", "Start");
}

/**
 * Prepares validation process
 */
function start_validation(){
    reset_store_data();
    session_time = (new Date).getTime().toString();
    store_data.task = "validation";
    store_data.description = "begin";
    send_gaze_data_to_database();
    clear_canvas();
    delete_elem("instruction");
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    current_task = 'validation';
    collect_data = true;
    webgazer.resume();
    create_new_dot_validation();
    var gazeDot = document.getElementById("gazeDot");
    gazeDot.style.zIndex = 14;
    gazeDot.style.display = "block";
}

/**
 * Create new dots for validation
 */
function create_new_dot_validation(){
    if (num_objects_shown >= validation_settings.num_dots) {
        finish_validation(true);
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
    store_data.description = (num_objects_shown+1).toString();
    send_gaze_data_to_database();
    draw_dot(context, curr_object, dark_color);
    validation_settings.listener = true;
    time_stamp = new Date().getTime();
    num_objects_shown++;
}

/**
 * Handler for 'watch' procedure.
 * @param {*} data
 */
function validation_event_handler(data) {
    if (validation_settings.listener === false) {return}
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    var dist = distance(data.x,data.y,curr_object.x,curr_object.y);
    if (dist < validation_settings.distance) {
        if (curr_object.hit_count <= validation_settings.hit_count) {
            draw_dot(context, curr_object, dark_color);
            curr_object.hit_count += 1;
        } else {
            create_new_dot_validation();
        }
    }
    else{
        var now = new Date().getTime();
        if (now - time_stamp > validation_settings.duration){
            finish_validation(false);
        }
    }
}

/**
 * Triggered when validation ends
 */
function finish_validation(succeed){
    validation_settings.listener = false;
    var gazeDot = document.getElementById("gazeDot");
    gazeDot.style.display = "none";
    success = (typeof succeed !== "undefined") ? succeed : true;
    objects_array = [];
    num_objects_shown = 0;
    webgazer.pause();
    collect_data = false;
    if (succeed === false) {
        store_data.description = "fail";
        send_gaze_data_to_database();
        reset_store_data(create_validation_fail_screen());
    }
    else{
        store_data.description = "success";
        send_gaze_data_to_database();
        paradigm = "simple";
        heatmap_data_x = store_data.gaze_x.slice(0);
        heatmap_data_y = store_data.gaze_y.slice(0);
        reset_store_data(draw_heatmap("navigate_tasks"));
    }
}

function create_validation_fail_screen() {
    clear_canvas();
    var instruction = document.createElement("div");
    instruction.id = "instruction";
    instruction.className += "overlay-div";
    instruction.style.zIndex = 12;
    instruction.innerHTML += "<header class=\"form__header\">" +
        "<h2 class=\"form__title\"> Validation failed. </br> Returning to calibration. </h2>" +
        "</header>";
    document.body.appendChild(instruction);
    setTimeout(function() {
        create_calibration_instruction();
    }, screen_timeout);
}

/**
 * Save user choices to local storage
 */
function save_user_choices() {
    if (typeof(Storage) !== "undefined") {
        var user_survey_choices = {};
        $("select").each(function () {
            if (this.id !== "experience") {
                user_survey_choices[this.id] = this.value;
            }
        });
        user_survey_choices = JSON.stringify(user_survey_choices);

        localStorage.setItem("user_survey_choices", user_survey_choices);
    }
}


/**
 * @event: the upload event of the html element which triggers this function
 * Upload the calibration file and parse the data. 
 */
function upload_calibration_data(event){
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function(){
        var data = reader.result;
        try{
            webgazer_training_data = JSON.parse(data);
        }
        catch( err){
            webgazer_training_data = undefined;
        }

    };
    reader.readAsText(input.files[0]);
    var label	 = event.currentTarget.nextElementSibling,
        labelVal = label.innerHTML;
    console.log(label);
    var fileName = input.value.split( '\\' ).pop();
    if( fileName )
        label.querySelector( 'span' ).innerHTML = fileName;
    else
        label.innerHTML = labelVal;
}

// function create_img_array () {
//     var width = 0;
//     var width_array = [];
//     var height = 0;
//     var height_array = [];
//     var big_img_width_array = [];
//     var total_frames = 0;
//     var total_frames_array = [];
//     var curr_sprite_array = [];
//     var original_img;
//     var img;
//     var img_content;
//     switch(calibration_settings.current_round) {
//         case 1:
//             curr_sprite_array = calibration_sprite_1;
//             break;
//         case 2:
//             curr_sprite_array = calibration_sprite_2;
//             break;
//         case 3:
//             curr_sprite_array = calibration_sprite_2;
//             break;
//         default:
//             curr_sprite_array = calibration_sprite_1;
//             break;
//     }

//     for (i = 0; i < curr_sprite_array.length; i ++) {
//         original_img = new Image();
//         original_img.src = "../assets/images/gif/" + calibration_current_round.toString() + "/" + curr_sprite_array[num_objects_shown] + ".gif";
//         original_img.onload = function () {
//             img_content = new Image();
//             img_content.src = "../assets/images/gif/sprite/" + curr_sprite_array[num_objects_shown] + ".png";
//             img_content.onload = function () {
//                 img = {
//                     'content': img_content,
//                     'current_frame': 0,
//                     'total_frames': img_content.width/original_img.width,
//                     'width': original_img.width,
//                     'height': original_img.height,
//                     'x': 0,
//                     'y': 0,
//                     'render_rate': 3,
//                     'render_count': 0
//                 };
//                 img_array.push(img);
//             };
//         };
//     }
// }


  sprite_array_1 : ['bulbasaur', 'charmander', 'chikorita', 'chimchar', 'cyndaquil', 'mudkip', 'pikachu', 'piplup', 'squirtle', 'torchic', 'totodile', 'treecko', 'turtwig'],
    sprite_array_2: ['bayleef', 'charmeleon', 'combusken', 'croconaw', 'grotle', 'grovyle', 'ivysaur', 'marshtomp', 'monferno', 'pikachu', 'prinplup', 'quilava', 'wartortle'],
    sprite_array_3: ['blastoise', 'blaziken', 'charizard', 'empoleon', 'feraligatr', 'infernape', 'meganium', 'pikachu', 'sceptile', 'swampert', 'torterra', 'typhlosion', 'venusaur']


function draw_gif(context, img) {
    var time = new Date().getTime();
    var delta = time - time_stamp;
    clear_canvas();
    if (img.render_count === img.render_rate - 1) {
        img.current_frame = (img.current_frame + 1) % img.total_frames;
    }
    img.render_count = (img.render_count + 1) % img.render_rate;
    img.onload = context.drawImage(img.content, img.current_frame * img.width, 0,
        img.width, img.height,
        img.x - img.width / 2, img.y - img.height / 2, img.width, img.height);

    //animation
    request_anim_frame(function () {
        if (delta >= calibration_settings.duration * 1000) {   
            if (num_objects_shown === Math.floor(calibration_settings.num_dots / 3) ||num_objects_shown === Math.floor(calibration_settings.num_dots *2 / 3))  {
                heatmap_data_x = store_data.gaze_x.slice(0);
                heatmap_data_y = store_data.gaze_y.slice(0);
                clear_canvas();
                calibration_current_round += 1;
                draw_heatmap("create_calibration_break_form");
                return;
            }
            else{
                create_new_dot_calibration();
                return;
            }
        }
        draw_gif(context, img);
    });
}

