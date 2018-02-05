/************************************
 * CONSTANTS
 ************************************/
const TABLE_NAME = "GAZE_DATA"; // name of data table of gaze data
const USER_TABLE_NAME = "USERS"; // name of data table of users
const DEFAULT_DOT_RADIUS = 25;
const SAMPLING_RATE = 60; // number of call to function once webgazer got data per second
const DATA_COLLECTION_RATE = 60; // number of data collected per second.

/************************************
 * VARIABLES
 ************************************/
var gazer_id = ""; // id of user
var session_time = ""; // time of current webgazer session
var isChrome = true;
// data variable. Used as a template for the type of data we send to the database. May add other attributes
var store_data = {
  task: "", // the current performing task
  description: "", // a description of the task. Depends on the type of task
  elapsedTime: [], // time since webgazer.begin() is called
  object_x: [], // x position of whatever object the current task is using
  object_y: [], // y position of whatever object the current task is using
  gaze_x: [], // x position of gaze
  gaze_y: [] // y position of gaze
};

// store all of information of the users which we will send to the database
var user = {
  gender: "", // the gender of the user
  age: "", // age of the user
  main_country: "", // country where the user spends the most time in
  current_country: "", // the current country the user is living in
  education_level: "", // the education level of the user
  main_hand: "", // the main hand (left, right or ambidextrous) of the user
  eye_sight: "", // the eye sight of the user. either near-sight, far-sight or normal
  performance: "", // the performance of webgazer
  comment: "" // the comment of the user
};

var collect_data = true;
var face_tracker;
var webgazer_training_data;
var time_stamp; // current time. For functions that requires time delta for animation or controlling sampling rate.
var webgazer_time_stamp; // time stamp. Used specifically to control the sampling rate of webgazer
var elem_array = []; // array of elements gazed
var current_task = "instruction"; // current running task.
var curr_object = null; // current object on screen. Can be anything. Used to check collision
var objects_array = []; //array of dots
var num_objects_shown = 0; //number of objects shown
var paradigm = "simple"; // the paradigm to use for the test
var possible_paradigm = ["simple", "pursuit", "heatmap", "massvis"];
var screen_timeout = 30;
var cam_width = 320;
var cam_height = 240;
var heatmap_data_x = [];
var heatmap_data_y = [];
var calibration_current_round = 1;
var calibration_sprite_1 = [];
var calibration_sprite_2 = [];
var calibration_sprite_3 = [];

/************************************
 * CALIBRATION PARAMETERS
 ************************************/
var calibration_settings = {
  duration: 4, // duration of a a singe position sampled
  method: "watch", // calibration method, either watch or click.
  num_dots: 3, // the number of dots used for calibration
  distance: 200, // radius of acceptable gaze data around calibration dot
  position_array: [
    [0.2, 0.2],
    [0.8, 0.2],
    [0.2, 0.5],
    [0.5, 0.5],
    [0.8, 0.5],
    [0.2, 0.8],
    [0.5, 0.8],
    [0.8, 0.8],
    [0.35, 0.35],
    [0.65, 0.35],
    [0.35, 0.65],
    [0.65, 0.65],
    [0.5, 0.2]
  ] // array of possible positions
};

/************************************
 * SIMPLE_PARADIGM PARAMETERS
 ************************************/
var simple_paradigm_settings = {
  position_array: [
    [0.2, 0.2],
    [0.5, 0.2],
    [0.8, 0.2],
    [0.2, 0.5],
    [0.8, 0.5],
    [0.2, 0.8],
    [0.5, 0.8],
    [0.8, 0.8]
  ],
  // num_trials: 8,
    num_trials: 1,
  fixation_rest_time: 1500, // amount of time 'target' will appear on screen with each trial, in ms
  dot_show_time: 5000 // amount of time dot will appear on screen with each trial, in ms
};

/************************************
 * PURSUIT_PARADIGM PARAMETERS
 ************************************/
var pursuit_paradigm_settings = {
  position_array: [
    { x: 0.2, y: 0.2, tx: 0.8, ty: 0.2 },
    { x: 0.2, y: 0.2, tx: 0.2, ty: 0.8 },
    { x: 0.2, y: 0.2, tx: 0.8, ty: 0.8 },

    { x: 0.8, y: 0.2, tx: 0.2, ty: 0.2 },
    { x: 0.8, y: 0.2, tx: 0.2, ty: 0.8 },
    { x: 0.8, y: 0.2, tx: 0.8, ty: 0.8 },

    { x: 0.2, y: 0.8, tx: 0.2, ty: 0.2 },
    { x: 0.2, y: 0.8, tx: 0.8, ty: 0.2 },
    { x: 0.2, y: 0.8, tx: 0.8, ty: 0.8 },

    { x: 0.8, y: 0.8, tx: 0.2, ty: 0.2 },
    { x: 0.8, y: 0.8, tx: 0.8, ty: 0.2 },
    { x: 0.8, y: 0.8, tx: 0.2, ty: 0.8 }
  ],
  // num_trials: 12, 
    num_trials: 1,
  dot_show_time: 3500,
  fixation_rest_time: 1500
};

/************************************
 * MASSVIS_PARADIGM PARAMETERS
 ************************************/
var massvis_paradigm_settings = {
  image_array: [
    "../assets/images/vis/economist_daily_chart_103.png",
    "../assets/images/vis/economist_daily_chart_106.png",
    "../assets/images/vis/economist_daily_chart_110.png",
    "../assets/images/vis/economist_daily_chart_116.png",
    "../assets/images/vis/economist_daily_chart_124.png",
    "../assets/images/vis/economist_daily_chart_129.png",
    "../assets/images/vis/economist_daily_chart_153.png",
    "../assets/images/vis/economist_daily_chart_165.png",
    "../assets/images/vis/economist_daily_chart_167.png",
    "../assets/images/vis/economist_daily_chart_18.png",
    "../assets/images/vis/economist_daily_chart_187.png",
    "../assets/images/vis/economist_daily_chart_202.png",
    "../assets/images/vis/economist_daily_chart_215.png",
    "../assets/images/vis/economist_daily_chart_219.png",
    "../assets/images/vis/economist_daily_chart_240.png",
    "../assets/images/vis/economist_daily_chart_242.png",
    "../assets/images/vis/economist_daily_chart_258.png",
    "../assets/images/vis/economist_daily_chart_268.png",
    "../assets/images/vis/economist_daily_chart_310.png",
    "../assets/images/vis/economist_daily_chart_317.png",
    "../assets/images/vis/economist_daily_chart_324.png",
    "../assets/images/vis/economist_daily_chart_35.png",
    "../assets/images/vis/economist_daily_chart_380.png",
    "../assets/images/vis/economist_daily_chart_390.png",
    "../assets/images/vis/economist_daily_chart_392.png",
    "../assets/images/vis/economist_daily_chart_4.png",
    "../assets/images/vis/economist_daily_chart_406.png",
    "../assets/images/vis/economist_daily_chart_416.png",
    "../assets/images/vis/economist_daily_chart_430.png",
    "../assets/images/vis/economist_daily_chart_439.png",
    "../assets/images/vis/economist_daily_chart_449.png",
    "../assets/images/vis/economist_daily_chart_45.png",
    "../assets/images/vis/economist_daily_chart_453.png",
    "../assets/images/vis/economist_daily_chart_454.png",
    "../assets/images/vis/economist_daily_chart_46.png",
    "../assets/images/vis/economist_daily_chart_475.png",
    "../assets/images/vis/economist_daily_chart_48.png",
    "../assets/images/vis/economist_daily_chart_490.png",
    "../assets/images/vis/economist_daily_chart_491.png",
    "../assets/images/vis/economist_daily_chart_493.png",
    "../assets/images/vis/economist_daily_chart_5.png",
    "../assets/images/vis/economist_daily_chart_516.png",
    "../assets/images/vis/economist_daily_chart_520.png",
    "../assets/images/vis/economist_daily_chart_521.png",
    "../assets/images/vis/economist_daily_chart_529.png",
    "../assets/images/vis/economist_daily_chart_53.png",
    "../assets/images/vis/economist_daily_chart_54.png",
    "../assets/images/vis/economist_daily_chart_66.png",
    "../assets/images/vis/economist_daily_chart_69.png",
    "../assets/images/vis/economist_daily_chart_75.png",
    "../assets/images/vis/economist_daily_chart_85.png",
    "../assets/images/vis/economist_daily_chart_89.png",
    "../assets/images/vis/economist_daily_chart_99.png",
    "../assets/images/vis/np_21.png",
    "../assets/images/vis/np_48.png",
    "../assets/images/vis/np_7.png",
    "../assets/images/vis/treasuryA10.png",
    "../assets/images/vis/treasuryB04.png",
    "../assets/images/vis/treasuryB10.png",
    "../assets/images/vis/treasuryB15.png",
    "../assets/images/vis/treasuryD04_3.png",
    "../assets/images/vis/treasuryD05_1.png",
    "../assets/images/vis/treasuryD08.png",
    "../assets/images/vis/treasuryG01_2.png",
    "../assets/images/vis/treasuryG02_2.png",
    "../assets/images/vis/treasuryG05_1.png",
    "../assets/images/vis/treasuryG06_2.png",
    "../assets/images/vis/treasuryG07_2.png",
    "../assets/images/vis/treasuryI01_2.png",
    "../assets/images/vis/treasuryI02_1.png",
    "../assets/images/vis/treasuryK01.png",
    "../assets/images/vis/treasuryK03_2.png",
    "../assets/images/vis/treasuryK03_3.png",
    "../assets/images/vis/treasuryK05_1.png",
    "../assets/images/vis/treasuryK06.png",
    "../assets/images/vis/treasuryL03_2.png",
    "../assets/images/vis/treasuryL04_1.png",
    "../assets/images/vis/treasuryL10_1.png",
    "../assets/images/vis/treasuryL11_2.png",
    "../assets/images/vis/treasuryL13.png",
    "../assets/images/vis/treasuryL16.png",
    "../assets/images/vis/v482_n7386_5_f5.png",
    "../assets/images/vis/v482_n7386_7_f2.png",
    "../assets/images/vis/v483_n7387_20_f2.png",
    "../assets/images/vis/v483_n7387_5_f1.png",
    "../assets/images/vis/v483_n7387_7_f4.png",
    "../assets/images/vis/v483_n7388_11_f2.png",
    "../assets/images/vis/v483_n7388_14_f3.png",
    "../assets/images/vis/v483_n7389_24_f3.png",
    "../assets/images/vis/v483_n7390_14_f2.png",
    "../assets/images/vis/v483_n7390_21_f4.png",
    "../assets/images/vis/v483_n7390_8_f1.png",
    "../assets/images/vis/v483_n7391_1_f1.png",
    "../assets/images/vis/v483_n7391_3_f5.png",
    "../assets/images/vis/v483_n7391_8_f1.png",
    "../assets/images/vis/v484_n7392_14_f3.png",
    "../assets/images/vis/v484_n7393_20_f1.png",
    "../assets/images/vis/v484_n7393_6_f4.png",
    "../assets/images/vis/v484_n7394_10_f4.png",
    "../assets/images/vis/v484_n7394_5_f2.png",
    "../assets/images/vis/v484_n7394_5_f5.png",
    "../assets/images/vis/v484_n7394_8_f2.png",
    "../assets/images/vis/v484_n7394_8_f4.png",
    "../assets/images/vis/v484_n7395_11_f1.png",
    "../assets/images/vis/v485_n7397_14_f3.png",
    "../assets/images/vis/v485_n7397_15_f1.png",
    "../assets/images/vis/v485_n7397_6_f4.png",
    "../assets/images/vis/v485_n7399_13_f4.png",
    "../assets/images/vis/v485_n7399_9_f2.png",
    "../assets/images/vis/v485_n7400_14_f1.png",
    "../assets/images/vis/v485_n7400_14_f2.png",
    "../assets/images/vis/v485_n7400_15_f2.png",
    "../assets/images/vis/v486_n7401_8_f1.png",
    "../assets/images/vis/v486_n7401_8_f2.png",
    "../assets/images/vis/v486_n7403_19_f2.png",
    "../assets/images/vis/v486_n7403_1_f8.png",
    "../assets/images/vis/v486_n7404_1_f2.png",
    "../assets/images/vis/v486_n7404_20_f6.png",
    "../assets/images/vis/v486_n7404_6_f1.png",
    "../assets/images/vis/v486_n7404_9_f2.png",
    "../assets/images/vis/v487_n7405_21_f2.png",
    "../assets/images/vis/v487_n7405_22_f1.png",
    "../assets/images/vis/v487_n7405_6_f4.png",
    "../assets/images/vis/v487_n7405_7_f1.png",
    "../assets/images/vis/v487_n7406_13_f2.png",
    "../assets/images/vis/v487_n7406_13_f5.png",
    "../assets/images/vis/v487_n7407_15_f3.png",
    "../assets/images/vis/v487_n7407_22_f2.png",
    "../assets/images/vis/v487_n7407_22_f4.png",
    "../assets/images/vis/v487_n7408_15_f3.png",
    "../assets/images/vis/v488_n7410_13_f4.png",
    "../assets/images/vis/v488_n7410_15_f3.png",
    "../assets/images/vis/v488_n7411_6_f4.png",
    "../assets/images/vis/v488_n7411_9_f1.png",
    "../assets/images/vis/v488_n7412_1_f3.png",
    "../assets/images/vis/v488_n7412_1_f4.png",
    "../assets/images/vis/v488_n7412_4_f1.png",
    "../assets/images/vis/v488_n7412_7_f1.png",
    "../assets/images/vis/v488_n7412_8_f1.png",
    "../assets/images/vis/v488_n7412_9_f1.png",
    "../assets/images/vis/v488_n7413_3_f2.png",
    "../assets/images/vis/v489_n7414_20_f1.png",
    "../assets/images/vis/v489_n7414_25_f2.png",
    "../assets/images/vis/v489_n7415_12_f5.png",
    "../assets/images/vis/v489_n7415_7_f2.png",
    "../assets/images/vis/v489_n7416_15_f2.png",
    "../assets/images/vis/v489_n7416_19_f3.png",
    "../assets/images/vis/v489_n7416_3_f4.png",
    "../assets/images/vis/v489_n7416_4_f6.png",
    "../assets/images/vis/v490_n7418_12_f1.png",
    "../assets/images/vis/v490_n7418_14_f2.png",
    "../assets/images/vis/v490_n7418_1_f2.png",
    "../assets/images/vis/v490_n7418_6_f3.png",
    "../assets/images/vis/v490_n7419_11_f1.png",
    "../assets/images/vis/v490_n7419_20_f3.png",
    "../assets/images/vis/v490_n7419_2_f1.png",
    "../assets/images/vis/v490_n7419_2_f2.png",
    "../assets/images/vis/v490_n7419_7_f4.png",
    "../assets/images/vis/v490_n7420_13_f4.png",
    "../assets/images/vis/v490_n7420_23_f5.png",
    "../assets/images/vis/vis109.png",
    "../assets/images/vis/vis230.png",
    "../assets/images/vis/vis250.png",
    "../assets/images/vis/vis278.png",
    "../assets/images/vis/vis286.png",
    "../assets/images/vis/vis288.png",
    "../assets/images/vis/vis328.png",
    "../assets/images/vis/vis386.png",
    "../assets/images/vis/vis399.png",
    "../assets/images/vis/vis409.png",
    "../assets/images/vis/vis416.png",
    "../assets/images/vis/vis417.png",
    "../assets/images/vis/vis428.png",
    "../assets/images/vis/vis499.png",
    "../assets/images/vis/vis512.png",
    "../assets/images/vis/vis564.png",
    "../assets/images/vis/vis586.png",
    "../assets/images/vis/vis618.png",
    "../assets/images/vis/vis625.png",
    "../assets/images/vis/vis630.png",
    "../assets/images/vis/vis652.png",
    "../assets/images/vis/vis67.png",
    "../assets/images/vis/vis673.png",
    "../assets/images/vis/vis678.png",
    "../assets/images/vis/vis684.png",
    "../assets/images/vis/vis697.png",
    "../assets/images/vis/vis708.png",
    "../assets/images/vis/vis729.png",
    "../assets/images/vis/vis734.png",
    "../assets/images/vis/vis768.png",
    "../assets/images/vis/vis826.png",
    "../assets/images/vis/vis831.png",
    "../assets/images/vis/vis850.png",
    "../assets/images/vis/vis853.png",
    "../assets/images/vis/vis859.png",
    "../assets/images/vis/vis87.png",
    "../assets/images/vis/vis881.png",
    "../assets/images/vis/visMost108.png",
    "../assets/images/vis/visMost132.png",
    "../assets/images/vis/visMost143.png",
    "../assets/images/vis/visMost147.png",
    "../assets/images/vis/visMost187.png",
    "../assets/images/vis/visMost190.png",
    "../assets/images/vis/visMost215.png",
    "../assets/images/vis/visMost217.png",
    "../assets/images/vis/visMost227.png",
    "../assets/images/vis/visMost232.png",
    "../assets/images/vis/visMost240.png",
    "../assets/images/vis/visMost244.png",
    "../assets/images/vis/visMost248.png",
    "../assets/images/vis/visMost255.png",
    "../assets/images/vis/visMost261.png",
    "../assets/images/vis/visMost267.png",
    "../assets/images/vis/visMost271.png",
    "../assets/images/vis/visMost274.png",
    "../assets/images/vis/visMost282.png",
    "../assets/images/vis/visMost357.png",
    "../assets/images/vis/visMost362.png",
    "../assets/images/vis/visMost374.png",
    "../assets/images/vis/visMost376.png",
    "../assets/images/vis/visMost378.png",
    "../assets/images/vis/visMost387.png",
    "../assets/images/vis/visMost420.png",
    "../assets/images/vis/visMost451.png",
    "../assets/images/vis/visMost456.png",
    "../assets/images/vis/visMost468.png",
    "../assets/images/vis/visMost496.png",
    "../assets/images/vis/visMost505.png",
    "../assets/images/vis/visMost52.png",
    "../assets/images/vis/visMost523.png",
    "../assets/images/vis/visMost526.png",
    "../assets/images/vis/visMost537.png",
    "../assets/images/vis/visMost54.png",
    "../assets/images/vis/visMost545.png",
    "../assets/images/vis/visMost55.png",
    "../assets/images/vis/visMost575.png",
    "../assets/images/vis/visMost601.png",
    "../assets/images/vis/visMost623.png",
    "../assets/images/vis/visMost635.png",
    "../assets/images/vis/visMost645.png",
    "../assets/images/vis/visMost657.png",
    "../assets/images/vis/visMost673.png",
    "../assets/images/vis/visMost705.png",
    "../assets/images/vis/visMost735.png",
    "../assets/images/vis/visMost745.png",
    "../assets/images/vis/visMost755.png",
    "../assets/images/vis/visMost758.png",
    "../assets/images/vis/visMost77.png",
    "../assets/images/vis/visMost82.png",
    "../assets/images/vis/visMost83.png",
    "../assets/images/vis/visMost92.png",
    "../assets/images/vis/visMost93.png",
    "../assets/images/vis/whoB03_1.png",
    "../assets/images/vis/whoB05_1.png",
    "../assets/images/vis/whoB13_2.png",
    "../assets/images/vis/whoB15_1.png",
    "../assets/images/vis/whoB19_1.png",
    "../assets/images/vis/whoB20_1.png",
    "../assets/images/vis/whoB22_1.png",
    "../assets/images/vis/whoB24_1.png",
    "../assets/images/vis/whoB25_2.png",
    "../assets/images/vis/whoB32_1.png",
    "../assets/images/vis/whoI11_1.png",
    "../assets/images/vis/whoI11_2.png",
    "../assets/images/vis/whoI12_2.png",
    "../assets/images/vis/whoI14.png",
    "../assets/images/vis/whoI19.png",
    "../assets/images/vis/whoI22.png",
    "../assets/images/vis/whoJ15_1.png",
    "../assets/images/vis/whoJ15_2.png",
    "../assets/images/vis/whoJ23.png",
    "../assets/images/vis/whoJ32.png",
    "../assets/images/vis/whoJ33.png",
    "../assets/images/vis/whoJ36_1.png",
    "../assets/images/vis/whoJ36_2.png",
    "../assets/images/vis/whoJ40_1.png",
    "../assets/images/vis/whoJ40_2.png",
    "../assets/images/vis/whoJ43_2.png",
    "../assets/images/vis/whoJ44.png",
    "../assets/images/vis/whoJ48_2.png",
    "../assets/images/vis/whoK04_2.png",
    "../assets/images/vis/whoK06_2.png",
    "../assets/images/vis/whoK07_2.png",
    "../assets/images/vis/whoK08.png",
    "../assets/images/vis/whoK12_2.png",
    "../assets/images/vis/whoK17_1.png",
    "../assets/images/vis/whoK19_1.png",
    "../assets/images/vis/whoK23_2.png",
    "../assets/images/vis/whoK31.png",
    "../assets/images/vis/whoL03.png",
    "../assets/images/vis/whoL06.png",
    "../assets/images/vis/whoL09.png",
    "../assets/images/vis/whoL10.png",
    "../assets/images/vis/whoL11.png",
    "../assets/images/vis/whoL12.png",
    "../assets/images/vis/whoL14.png",
    "../assets/images/vis/whoM05.png",
    "../assets/images/vis/whoN05.png",
    "../assets/images/vis/whoN08.png",
    "../assets/images/vis/whoN10.png",
    "../assets/images/vis/whoN16_1.png",
    "../assets/images/vis/whoN18.png",
    "../assets/images/vis/whoN21_1.png",
    "../assets/images/vis/whoN22.png",
    "../assets/images/vis/whoN23_2.png",
    "../assets/images/vis/whoN32_2.png",
    "../assets/images/vis/whoN33.png",
    "../assets/images/vis/whoO06_2.png",
    "../assets/images/vis/whoO12.png",
    "../assets/images/vis/whoP13.png",
    "../assets/images/vis/whoP16.png",
    "../assets/images/vis/whoQ06_2.png",
    "../assets/images/vis/whoQ09_2.png",
    "../assets/images/vis/whoQ11_1.png",
    "../assets/images/vis/whoQ14_2.png",
    "../assets/images/vis/whoQ15_1.png",
    "../assets/images/vis/whoQ18_3.png",
    "../assets/images/vis/whoQ26.png",
    "../assets/images/vis/whoQ32_2.png",
    "../assets/images/vis/whoQ41_1.png",
    "../assets/images/vis/whoQ42_1.png",
    "../assets/images/vis/whoQ44_4.png",
    "../assets/images/vis/whoQ48_4.png",
    "../assets/images/vis/whoQ48_5.png",
    "../assets/images/vis/whoQ50_2.png",
    "../assets/images/vis/whoQ51_2.png",
    "../assets/images/vis/whoQ52_4.png",
    "../assets/images/vis/wsj10.png",
    "../assets/images/vis/wsj104.png",
    "../assets/images/vis/wsj108.png",
    "../assets/images/vis/wsj11.png",
    "../assets/images/vis/wsj116.png",
    "../assets/images/vis/wsj129.png",
    "../assets/images/vis/wsj135.png",
    "../assets/images/vis/wsj144.png",
    "../assets/images/vis/wsj147.png",
    "../assets/images/vis/wsj162.png",
    "../assets/images/vis/wsj167.png",
    "../assets/images/vis/wsj170.png",
    "../assets/images/vis/wsj172.png",
    "../assets/images/vis/wsj176.png",
    "../assets/images/vis/wsj184.png",
    "../assets/images/vis/wsj20.png",
    "../assets/images/vis/wsj21.png",
    "../assets/images/vis/wsj214.png",
    "../assets/images/vis/wsj220.png",
    "../assets/images/vis/wsj226.png",
    "../assets/images/vis/wsj233.png",
    "../assets/images/vis/wsj240.png",
    "../assets/images/vis/wsj259.png",
    "../assets/images/vis/wsj262.png",
    "../assets/images/vis/wsj264.png",
    "../assets/images/vis/wsj270.png",
    "../assets/images/vis/wsj271.png",
    "../assets/images/vis/wsj277.png",
    "../assets/images/vis/wsj28.png",
    "../assets/images/vis/wsj286.png",
    "../assets/images/vis/wsj292.png",
    "../assets/images/vis/wsj294.png",
    "../assets/images/vis/wsj297.png",
    "../assets/images/vis/wsj299.png",
    "../assets/images/vis/wsj308.png",
    "../assets/images/vis/wsj316.png",
    "../assets/images/vis/wsj340.png",
    "../assets/images/vis/wsj359.png",
    "../assets/images/vis/wsj360.png",
    "../assets/images/vis/wsj392.png",
    "../assets/images/vis/wsj395.png",
    "../assets/images/vis/wsj405.png",
    "../assets/images/vis/wsj441.png",
    "../assets/images/vis/wsj459.png",
    "../assets/images/vis/wsj462.png",
    "../assets/images/vis/wsj474.png",
    "../assets/images/vis/wsj481.png",
    "../assets/images/vis/wsj505.png",
    "../assets/images/vis/wsj508.png",
    "../assets/images/vis/wsj511.png",
    "../assets/images/vis/wsj52.png",
    "../assets/images/vis/wsj521.png",
    "../assets/images/vis/wsj529.png",
    "../assets/images/vis/wsj533.png",
    "../assets/images/vis/wsj536.png",
    "../assets/images/vis/wsj54.png",
    "../assets/images/vis/wsj540.png",
    "../assets/images/vis/wsj55.png",
    "../assets/images/vis/wsj553.png",
    "../assets/images/vis/wsj557.png",
    "../assets/images/vis/wsj561.png",
    "../assets/images/vis/wsj593.png",
    "../assets/images/vis/wsj612.png",
    "../assets/images/vis/wsj79.png",
    "../assets/images/vis/wsj9.png",
    "../assets/images/vis/wsj99.png"
  ],
  spacing: 10,
  num_trials: 1,
  fixation_rest_time: 1500, // amount of time fixation cross will appear on screen with each trial, in ms
  image_show_time: 10000 // amount of time the image will appear on screen with each trial, in ms
};

/************************************
 * BONUS ROUND PARAMETERS
 ************************************/
var bonus_round_settings = {
  image_show_time: 10000, // duration of a a singe position sampled
  num_trials: 1,
  image_array: ["../assets/images/bonus/panda 1.jpg"],
  fixation_rest_time: 1500
};

/************************************
 * SETTING UP AWS
 ************************************/
AWS.config.region = "us-east-2"; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: IdentityPoolId,
  RoleArn: RoleArn
});
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

/************************************
 * COMMON FUNCTIONS
 ************************************/

/**
 * Shuffles an array in place.
 * @array: the input array to be shuffled.
 * @author http://stackoverflow.com/a/2450976/4175553
 * @return: the array after shuffled. Since the shufle is in-place, the array passed
 * to this function will be shuffled as well.
 */
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

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
 * Get the distance between two points with position (x1,y1) and (x2,y2)
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 */
function distance(x1, y1, x2, y2) {
  var a = x1 - x2;
  var b = y1 - y2;
  return parseInt(Math.sqrt(a * a + b * b));
}

/**
 * Toggle the stylesheets of the websites so that we can override the attributes and styling
 * of the webpage. Used to keep the style and attributes of our system in check.
 */
function toggle_stylesheets() {
  for (i = 0; i < document.styleSheets.length; i++) {
    document.styleSheets[i].disabled = !document.styleSheets[i].disabled;
  }
}
/**
 * Enable the stylesheet of our system.
 */
function enable_medusa_stylesheet() {
  document.styleSheets[document.styleSheets.length - 1].disabled = false;
}

/**
 * create the overlay over the website
 */
function create_overlay() {
  toggle_stylesheets();
  enable_medusa_stylesheet();
  var canvas = document.createElement("canvas");
  canvas.id = "canvas-overlay";
  // canvas.addEventListener("mousedown", canvas_on_click, false);
  // style the newly created canvas
  canvas.style.zIndex = 10;
  canvas.style.position = "fixed";
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.backgroundColor = background_color;
  // add the canvas to web page
  window.addEventListener("resize", function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  document.body.appendChild(canvas);
}

/**
 * Clear content of canvas
 */
function clear_canvas() {
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Gets html element from a point
 * @param {*} x - x_coordinate of point
 * @param {*} y - y_coordinate of point
 */
function get_elements_seen(x, y) {
  var element = document.elementFromPoint(x, y);
  if (element in elem_array) {
    elem_array[element] = elem_array[element] + 1;
  } else {
    elem_array[element] = 1;
  }
}

/**
 * Deletes an element with id
 * @param {*} id - id of the element
 */
function delete_elem(id) {
  var elem = document.getElementById(id);
  if (elem) {
    elem.parentNode.removeChild(elem);
  }
}

/**
 * Dot object
 * @param {*} x - x_coordinate of the center
 * @param {*} y - y_coordinate of the center
 * @param {*} r - radius
 */
var Dot = function(x, y, r) {
  r = typeof r !== "undefined" ? r : DEFAULT_DOT_RADIUS;
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
 * Creates an array of dots from an array of positions, then shuffles it
 * @param {*} pos_array - array of positions
 * @param {*} radius - the radius of the dots
 * @return{*} dot_array - the array of dots
 */
function create_dot_array(pos_array, radius) {
  var canvas = document.getElementById("canvas-overlay");
  radius = typeof radius !== "undefined" ? radius : DEFAULT_DOT_RADIUS;
  var dot_array = [];
  for (var dot_pos in pos_array) {
    dot_array.push(
      new Dot(
        canvas.width * pos_array[dot_pos][0],
        canvas.height * pos_array[dot_pos][1],
        radius
      )
    );
  }
  dot_array = shuffle(dot_array);
  return dot_array;
}

/**
 * Draws a dot
 * @param {*} context - context of canvas
 * @param {*} dot - the Dot object
 * @param {*} color - color of the dot
 */
function draw_dot(context, dot, color, settings) {
  time_stamp = new Date().getTime();
  draw_dot_countdown(context, dot, color, settings);

  // if (current_task === "calibration") {
  // }

  // } else {
  //   context.beginPath();
  //   context.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
  //   context.strokeStyle = color;
  //   context.fillStyle = color;
  //   context.fill();
  // }
}

/**
 * Draw the track around a dot
 * @param {*} context - context of the canvas to draw
 * @param {*} dot - the Dot object
 * @param {*} color  - the color of the track
 */
function draw_track(context, dot, color) {
  context.beginPath();
  context.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.stroke();
}


/**
 * Draw a dot with count-down number inside. Used for calibration
 * @param {*} context
 * @param {*} dot
 * @param {*} color
 */
function draw_dot_countdown(context, dot, color,settings) {
  var time = new Date().getTime();
  var delta = time - time_stamp;
  var arc_len = delta * Math.PI * 2 / (1000 * settings.duration);
  clear_canvas();
  //base circle
  draw_track(context, dot, color);
  //animated circle
  context.lineWidth = 7;
  context.beginPath();
  context.strokeStyle = color;
  context.arc(
    dot.x,
    dot.y,
    dot.r,
    Math.PI / -2,
    Math.PI * 3 / 2 - arc_len,
    false
  );
  context.stroke();

  //draw countdown number
  context.font = "20px Source Sans Pro";
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    settings.num_dots - num_objects_shown,
    dot.x,
    dot.y
  );
  //animation
  request_anim_frame(function() {
    if (delta >= settings.duration * 1000) {
      if (
        num_objects_shown === Math.floor(settings.num_dots / 3) ||
        num_objects_shown === Math.floor(settings.num_dots * 2 / 3)
      ) {
        heatmap_data_x = store_data.gaze_x.slice(0);
        heatmap_data_y = store_data.gaze_y.slice(0);
        clear_canvas();
        draw_heatmap("create_calibration_break_form");
        return;
      } else {
        create_new_dot_calibration();
        return;
      }
    }
    draw_dot_countdown(context, dot, color);
  });
}

/**
 * reset the store_data variable.
 */
function reset_store_data(callback) {
  store_data = {
    task: "", // the current performing task
    description: "", // a description of the task. Depends on the type of task
    elapsedTime: [], // time since webgazer.begin() is called
    object_x: [], // x position of whatever object the current task is using
    object_y: [], // y position of whatever object the current task is using
    gaze_x: [], // x position of gaze
    gaze_y: [] // y position of gaze
  };
  if (callback !== undefined) callback();
}

/**
 * A backward compatibility version of request animation frame
 * @author http://www.html5canvastutorials.com/advanced/html5-canvas-animation-stage/
 */
window.request_anim_frame = (function(callback) {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 30);
    }
  );
})();

/**
 * draw the fixation cross on the middle of the screen
 */
function draw_fixation_cross(midX, midY, canvas_object) {
  clear_canvas();
  var context = canvas_object.getContext("2d");
  context.strokeStyle = font_color;
  context.lineWidth = 5;
  //draw horizontal line
  context.beginPath();
  context.moveTo(midX - 15, midY);
  context.lineTo(midX + 15, midY);
  context.stroke();
  //draw vertical line
  context.beginPath();
  context.moveTo(midX, midY - 15);
  context.lineTo(midX, midY + 15);
  context.stroke();
}

function draw_heatmap(function_name) {
  webgazer.pause();
  collect_data = false;
  clear_canvas();

  var instruction = document.createElement("div");
  instruction.id = "instruction";
  instruction.className += "overlay-div";
  instruction.style.zIndex = 99;
  instruction.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title"> Here is a heatmap of where we think you were looking. <br> Press the NEXT button when you are done.</h2>' +
    "</header>";
  document.body.appendChild(instruction);

  setTimeout(function() {
    delete_elem("instruction");
    var canvas = document.createElement("canvas");
    canvas.id = "heatmap-overlay";
    // canvas.addEventListener("mousedown", canvas_on_click, false);
    // style the newly created canvas
    canvas.style.zIndex = 11;
    canvas.style.position = "fixed";
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var button = document.createElement("button");
    button.className += "form__button";
    button.id = "heatmap-button";
    button.style.opacity = 0.5;
    button.style.right = "1em";
    button.style.bottom = "2em";
    button.innerHTML = "Next";
    button.style.position = "absolute";
    button.style.zIndex = 99;
    button.addEventListener("click", function() {
      window[function_name]();
      delete_elem("heatmap-button");
      delete_elem("heatmap-overlay");
    });
    button.onmouseover = function() {
      button.style.opacity = 1;
    };
    button.onmouseout = function() {
      button.style.opacity = 0.5;
    };
    document.body.appendChild(button);

    var context = canvas.getContext("2d");
    var heat = simpleheat(canvas);
    var points = [];
    for (i = 0; i < heatmap_data_x.length; i++) {
      var point = [heatmap_data_x[i], heatmap_data_y[i], 0.1];
      points.push(point);
    }

    heat.data(points);
    heat.draw();

    if (current_task === "simple_paradigm") {
      for (i = 0; i < simple_paradigm_settings.position_array.length; i++) {
        var midX = simple_paradigm_settings.position_array[i][0] * canvas.width;
        var midY =
          simple_paradigm_settings.position_array[i][1] * canvas.height;
        draw_fixation_cross(midX, midY, canvas);
      }
    } else if (current_task === "pursuit_end") {
      draw_fixation_cross(canvas.width * 0.2, canvas.height * 0.2, canvas);
      draw_fixation_cross(canvas.width * 0.8, canvas.height * 0.2, canvas);
      draw_fixation_cross(canvas.width * 0.2, canvas.height * 0.8, canvas);
      draw_fixation_cross(canvas.width * 0.8, canvas.height * 0.8, canvas);
      // for (i = 0; i < pursuit_paradigm_settings.position_array.length; i++) {
      //     draw_dashed_line(canvas.width * pursuit_paradigm_settings.position_array[i].x,
      //                     canvas.height * pursuit_paradigm_settings.position_array[i].y,
      //                     canvas.width * pursuit_paradigm_settings.position_array[i].ty,
      //                     canvas.height * pursuit_paradigm_settings.position_array[i].y,
      //                     context);
      // }
    } else if (
      current_task === "calibration" ||
      current_task === "validation"
    ) {
      for (i = 0; i < calibration_settings.position_array.length; i++) {
        midX = calibration_settings.position_array[i][0] * canvas.width;
        midY = calibration_settings.position_array[i][1] * canvas.height;
        draw_fixation_cross(midX, midY, canvas);
      }
      draw_fixation_cross(canvas.width * 0.5, canvas.height * 0.5, canvas);
    } else if (
      current_task === "bonus" ||
      current_task === "massvis_paradigm"
    ) {
      if (current_task === "bonus") {
        var prev_height = curr_object.height;
        var prev_width = curr_object.width;
        var src =
          curr_object.src.slice(0, curr_object.src.length - 4) + " answer.jpg";
        curr_object = new Image();
        curr_object.src = src;
        curr_object.height = prev_height;
        curr_object.width = prev_width;
      }
      canvas = document.getElementById("canvas-overlay");
      context = canvas.getContext("2d");
      curr_object.onload = function() {
        context.drawImage(
          curr_object,
          canvas.width / 2 - curr_object.width / 2,
          canvas.height / 2 - curr_object.height / 2,
          curr_object.width,
          curr_object.height
        );
      };
    }
  }, screen_timeout);
}

function draw_dashed_line(x, y, tx, ty, ctx) {
  ctx.beginPath();
  ctx.setLineDash([5, 15]);
  ctx.moveTo(x, y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
}

/**
 * Sends gaze data to database and then clear out the store_data variable. Called after each step
 */
function send_gaze_data_to_database(callback) {
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  var temp_store_data = {
    task: "", // the current performing task
    url: "", // url of website
    canvasWidth: "", // the width of the canvas
    canvasHeight: "", // the height of the canvas
    description: "", // a description of the task. Depends on the type of task
    elapsedTime: [], // time since webgazer.begin() is called
    object_x: [], // x position of whatever object the current task is using
    object_y: [], // y position of whatever object the current task is using
    gaze_x: [], // x position of gaze
    gaze_y: [] // y position of gaze
  };
  temp_store_data.url = window.location.href;
  temp_store_data.canvasHeight = canvas.height;
  temp_store_data.canvasWidth = canvas.width;
  temp_store_data.task = store_data.task;
  temp_store_data.description = store_data.description;
  if (current_task === "calibration") {
    temp_store_data.gaze_x = [0];
    temp_store_data.gaze_y = [0];
    temp_store_data.object_x = [0];
    temp_store_data.object_y = [0];
    temp_store_data.elapsedTime = [0];
  } else {
    temp_store_data.gaze_x = store_data.gaze_x;
    temp_store_data.gaze_y = store_data.gaze_y;
    temp_store_data.object_x = store_data.object_x;
    temp_store_data.object_y = store_data.object_y;
    temp_store_data.elapsedTime = store_data.elapsedTime;
  }
  var params = {
    TableName: TABLE_NAME,
    Item: {
      gazer_id: gazer_id,
      time_collected: session_time,
      info: temp_store_data
    }
  };
  docClient.put(params, function(err, data) {
    if (err) {
      console.log(
        "Unable to add item: " + "\n" + JSON.stringify(err, undefined, 2)
      );
    } else {
      console.log(
        "PutItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2)
      );
      callback;
    }
  });
}

/**
 * Sends user data to the database. Only called at the end of the experiment.
 */
function send_user_data_to_database(callback) {
  session_time = new Date().getTime().toString();
  var empty_count = 0;
  $("select").each(function(i) {
    if (this.value === "") {
      empty_count += 1;
      this.style.boxShadow = "0 0 5px 1px var(--submit-color-darker)";
      this.onfocus = function() {
        this.style.boxShadow = "none";
      };
    }
  });
  if (empty_count === 1) {
    document.getElementById("survey_info").innerHTML =
      "There is only one more thing you need to fill out";
    return;
  } else if (empty_count > 1) {
    document.getElementById("survey_info").innerHTML =
      "There are " +
      empty_count.toString() +
      " more things you need to fill out.";
    return;
  }
  user.age = document.getElementById("age").value;
  user.gender = document.getElementById("gender").value;
  user.current_country = document.getElementById("current_country").value;
  user.main_country = document.getElementById("main_country").value;
  user.main_hand = document.getElementById("handedness").value;
  user.education_level = document.getElementById("education_level").value;
  user.eye_sight = document.getElementById("vision").value;
  user.performance = document.getElementById("performance").value;
  user.comment = document.getElementById("comment").value;

  var params = {
    TableName: USER_TABLE_NAME,
    Item: {
      gazer_id: gazer_id,
      time_collected: session_time,
      info: user
    }
  };
  save_user_choices();
  toggle_stylesheets();
  docClient.put(params, function(err, data) {
    if (err) {
      console.log(
        "Unable to add item: " + "\n" + JSON.stringify(err, undefined, 2)
      );
    } else {
      console.log(
        "PutItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2)
      );
      window.location.href = "../index.html";
    }
  });
}

/**
 * Show the video feed
 */
function show_video_feed() {
  webgazer.resume();
  hide_face_tracker();
  var video = document.getElementById("webgazerVideoFeed");
  video.style.display = "block";
  video.style.position = "fixed";
  video.style.top = "65%";
  video.style.left = "calc(50% - " + (cam_width / 2).toString() + "px)";
  video.width = cam_width;
  video.height = cam_height;
  video.style.margin = "0px";
  video.style.zIndex = 13;

  webgazer.params.imgWidth = cam_width;
  webgazer.params.imgHeight = cam_height;

  var overlay = document.createElement("canvas");
  overlay.id = "face_tracker";
  overlay.style.position = "fixed";
  overlay.width = cam_width;
  overlay.height = cam_height;
  overlay.style.top = "65%";
  overlay.style.left = "calc(50% - " + (cam_width / 2).toString() + "px)";
  overlay.style.margin = "0px";
  overlay.style.zIndex = 14;
  document.body.appendChild(overlay);
  face_tracker = requestAnimFrame(draw_face_tracker);
}

/**
 * Draw the face tracker on the screen
 */
function draw_face_tracker() {
  face_tracker = requestAnimFrame(draw_face_tracker);
  var overlay = document.getElementById("face_tracker");
  var cl = webgazer.getTracker().clm;
  overlay.getContext("2d").clearRect(0, 0, cam_width, cam_height);
  if (cl.getCurrentPosition()) {
    cl.draw(overlay);
  }
}

/**
 * Hide the face tracker from the user
 */
function hide_face_tracker() {
  delete_elem("face_tracker");
  var video = document.getElementById("webgazerVideoFeed");
  video.style.display = "None";
  cancelAnimationFrame(face_tracker);
}

/************************************
 * MAIN FUNCTIONS
 ************************************/
/**
 * The only function needed to call when deploy. Simple call this function when you want to start up the program
 */
function start_medusa(parad) {
  paradigm = typeof parad !== "undefined" ? parad : "simple";
  if (!paradigm in possible_paradigm) {
    paradigm = "simple";
  }
  create_consent_form();
}

/**
 * Create the consent form
 */
function create_consent_form() {
  // hide the background and create canvas
  create_overlay();
  var form = document.createElement("div");
  form.id = "consent_form";
  form.className += "overlay-div";
  form.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title">Consent form</h2>' +
    "<div style='overflow-y: scroll; max-height: 30vh;'>" +
    "<p class='information'><b>Why we are doing this research:</b> We are trying to examine the feasibility of using consumer-grade webcams to conduct eye-tracking experiments to replace traditional eye-tracking method.</p>" +
    "<p class='information'><b>What you will have to do:</b> You will be presented with a series of tasks that involves looking at some dots and data visualizations .</p>" +
    "<p class='information'><b>Privacy and Data collection:</b> We will not ask you for your name. We will not store any videos or images from the webcam. The only data from your webcam that we are collecting is predicted coordinates of your gaze made by webgazer. All data will be stored in a secure server.</p>" +
    "<p class='information'><b>Duration:</b> Approximately 15 minutes.</p>" +
    "<p class='information'><b>Taking part is voluntary:</b> You are free to leave the experiment at any time. If you refuse to be in the experiment or stop participating, there will no penalty or loss of benefits to which you are otherwise entitled.</p>" +
    "<p class='information'><b>If you have questions:</b> You may contact Professor Evan Peck at <a href='mailto:evan.peck@bucknell.edu'>evan.peck@bucknell.edu</a>. If you have questions about your rights as a research participant, please contact Matthew Slater, Bucknell University's IRB Chair at 570.577.2767 or at <a href='mailto:matthew.slater@bucknell.edu'>matthew.slater@bucknell.edu</a></p>" +
    "</div>" +
    "</header>" +
    "<form>" +
    '<fieldset class="form__options">' +
    '<p class="form__answer">' +
    '<input name="consent" type="radio" id="consent-yes" value="yes">' +
    "<label class='form__label' for=\"consent-yes\"> I have read the above information, and have received answers to any questions I asked. </br>" +
    "I affirm that I am at least 18 years old. <br>" +
    "I consent to take part in the study." +
    "</label>" +
    "</p>" +
    '<p class="form__answer">' +
    '<input name="consent" type="radio" id="consent-no" value="no">' +
    "<label class='form__label' for=\"consent-no\"> I decide not to take part in the study. <br> <br> <br> <br> </label>" +
    "</p>" +
    "</fieldset>" +
    "<p class='information' id='webcam-info' style='color: red'></p>" +
    '<button class="form__button" type="button" onclick="consent_form_navigation()">Next</button>' +
    "</form>";
  form.style.zIndex = 11;
  document.body.appendChild(form);
  var ua = navigator.userAgent.match(
      /(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i
    ),
    browser;
  if (
    navigator.userAgent.match(/Edge/i) ||
    navigator.userAgent.match(/Trident.*rv[ :]*11\./i)
  ) {
    browser = "msie";
  } else {
    browser = ua[1].toLowerCase();
  }
  if (browser !== "chrome") {
    isChrome = false;
    document.getElementById("webcam-info").innerHTML = "";
    document.getElementById("webcam-info").innerHTML += "Please use Chrome!";
  }
}

function consent_form_navigation() {
  if (isChrome === true) {
    if ($("#consent-yes").is(":checked")) {
      load_webgazer();
    } else if ($("#consent-no").is(":checked")) {
      window.location.href = "../index.html";
    } else {
      document.getElementById("webcam-info").innerHTML = "";
      document.getElementById("webcam-info").innerHTML +=
        "Please select one of the two options given.";
    }
  }
}

/**
 * Loads Webgazer. Once loaded, starts the collect data procedure
 */
function load_webgazer() {
  $.getScript("../assets/js/webgazer.js").done(function(script, textStatus) {
    initiate_webgazer();
  });
  // navigator.getUserMedia({video: true}, function() {
  //     $.getScript("../assets/js/webgazer.js")
  //         .done(function( script, textStatus ) {
  //             initiate_webgazer();
  //         })
  //         .fail(function( jqxhr, settings, exception ) {
  //             $( "div.log" ).text( "Triggered ajaxError handler." );
  //         });
  // }, function() {
  //     document.getElementById("webcam-info").innerHTML = "";
  //     document.getElementById("webcam-info").innerHTML += "No webcam found."
  // });
}

/**
 * Starts WebGazer and collects data
 */
function initiate_webgazer() {
  webgazer_time_stamp = 0;
  webgazer
    .clearData()
    .setRegression("ridge")
    .setTracker("clmtrackr")
    .setGazeListener(function(data, elapsedTime) {
      if (data === null) return;
      if (curr_object === undefined || curr_object === null) return;
      if (collect_data === false) return;

      if (elapsedTime - webgazer_time_stamp > 1000 / SAMPLING_RATE) {
        webgazer_time_stamp = elapsedTime;
        store_data.elapsedTime.push(elapsedTime);
        if (current_task === "calibration") {
          webgazer.addWatchListener(curr_object.x, curr_object.y);
        }
        else if (current_task === "pursuit") {
          store_data.object_x.push(curr_object.cx);
          store_data.object_y.push(curr_object.cy);
        } else {
          store_data.object_x.push(curr_object.x);
          store_data.object_y.push(curr_object.y);
        }
        store_data.gaze_x.push(data.x);
        store_data.gaze_y.push(data.y);
      }
      if (current_task === "bonus") {
        loop_bonus_round();
      }
    })
    .begin()
    .showPredictionPoints(false);
  check_webgazer_status();
}

/**
 * Checks if webgazer is successfully initiated. If yes, then start carrying out tasks.
 */
function check_webgazer_status() {
  if (webgazer.isReady()) {
    console.log("webgazer is ready.");
    // Create database
    createID();
    create_experiment_instruction();
    create_gaze_database();
    create_user_database();
  } else {
    setTimeout(check_webgazer_status, 100);
  }
}

/**
 * Creates unique ID from time + RNG. Loads the ID from local storage if it's already there.
 */
function createID() {
  gazer_id =
    "id-" +
    (new Date().getTime().toString(16) +
      Math.floor(1e7 * Math.random()).toString(16));
}

/**
 * Creates data table to store the gaze location data.
 */
function create_gaze_database() {
  var params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "gazer_id", KeyType: "HASH" },
      { AttributeName: "time_collected", KeyType: "RANGE" } //Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: "gazer_id", AttributeType: "S" },
      { AttributeName: "time_collected", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 20,
      WriteCapacityUnits: 20
    }
  };
  dynamodb.createTable(params, function(err, data) {
    if (err) {
      console.log(
        "Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2)
      );
    } else {
      console.log(
        "Created table: " + "\n" + JSON.stringify(data, undefined, 2)
      );
    }
  });
}

/**
 * Creates data table to store the information of users.
 */
function create_user_database() {
  var params = {
    TableName: USER_TABLE_NAME,
    KeySchema: [
      { AttributeName: "gazer_id", KeyType: "HASH" },
      { AttributeName: "time_collected", KeyType: "RANGE" } //Sort key
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
      console.log(
        "Unable to create table: " + "\n" + JSON.stringify(err, undefined, 2)
      );
    } else {
      console.log(
        "Created table: " + "\n" + JSON.stringify(data, undefined, 2)
      );
    }
  });
}

/**
 * Shows experiment instruction
 */
function create_experiment_instruction() {
  session_time = new Date().getTime().toString();
  store_data.task = "experiment";
  store_data.description = "begin";
  send_gaze_data_to_database();
  if ($("#consent-yes").is(":checked")) {
    var instruction = document.createElement("div");
    var instruction_guide1 =
      "For nearly half of your experiment, we'll be training your computer to guess where you're looking (and we'll show you what we think along the way!). We'll end the experiment by having you look at charts, graphs, and infographics to help us understand the way you process information. Finally, you'll have a chance to complete a searching challenge and share your results with your friends.";
    var instruction_guide2 =
      "We know focusing on the screen for a long time is tiring to the eyes, so there will be break in between sections.";
    var instruction_guide3 =
      "Before we start, there are few tips we want to share with you to help you progress through the experiment faster.";
    delete_elem("consent_form");
    instruction.id = "instruction";
    instruction.className += "overlay-div";
    instruction.style.zIndex = 12;
    instruction.innerHTML +=
      '<header class="form__header">' +
      '<h2 class="form__title">Thank you for participating. </br></h2>' +
      '<p class="information">' +
      instruction_guide1 +
      "<p>" +
      '<p class="information">' +
      instruction_guide2 +
      "<p>" +
      '<p class="information">' +
      instruction_guide3 +
      "<p>" +
      "</header>" +
      '<button class="form__button" type="button" onclick="create_webcam_instruction_glasses()">Start</button>';
    document.body.appendChild(instruction);
    show_video_feed();
  }
}

function create_webcam_instruction_glasses() {
  create_general_instruction(
    "Glasses",
    "Firstly, glasses. The program can't identify your eyes or your face if you wear glasses. Therefore, if you wear glasses, please take them off before continue.",
    "create_webcam_instruction_uneven(); delete_elem('guide-img');",
    "Next"
  );
  var guide = new Image();
  guide.src = "../assets/images/guide/Glasses.png";
  guide.id = "guide-img";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}

function create_webcam_instruction_uneven() {
  create_general_instruction(
    "Lighting conditions",
    "Secondly, lighting conditions. This is rather tricky, but the main idea is that you should make sure that you have even lighting across your face. Ideally, the light source should be behind or in front you.",
    "create_webcam_instruction_reset(); delete_elem('guide-img');",
    "Next"
  );
  var guide = new Image();
  guide.id = "guide-img";
  guide.src = "../assets/images/guide/Uneven.png";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}

function create_webcam_instruction_broken() {
  create_general_instruction(
    "When things go wrong",
    "However, the conditions are not always ideal and the program may fail to identify your eyes and your face. Should it fail, the green line will not match your face and your eyes. There are two primary suspects here.",
    "create_webcam_instruction_glasses(); delete_elem('guide-img');",
    "Next"
  );
  var guide = new Image();
  guide.src = "../assets/images/guide/Broken.png";
  guide.id = "guide-img";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}

function create_webcam_instruction_reset() {
  create_general_instruction(
    "A final touch",
    "Now, after you have fixed everything, you should try to calibrate again. To do that, move your face away completely from the webcam and then move back to in front of the webcam. The program will recalibrate and it should be able to indentify your face correctly now. If it is not, please perform this step again.",
    "create_webcam_instruction_final_check(); delete_elem('guide-img');",
    "Next"
  );
  var guide = new Image();
  guide.src = "../assets/images/guide/Reset.png";
  guide.id = "guide-img";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}

function create_webcam_instruction_perfect() {
  create_general_instruction(
    "A crucial point",
    "It is extremely crucial that the program can identify your eyes accurately. How do you know that? The green line should fit your face and your eyes correctly.",
    "create_webcam_instruction_broken(); delete_elem('guide-img');",
    "Continue"
  );
  var guide = new Image();
  guide.src = "../assets/images/guide/Perfect.png";
  guide.id = "guide-img";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}
function create_webcam_instruction_final_check() {
  create_general_instruction(
    "A few other tips.",
    "When you progress through the experiment, try to maintain your head position, and recalibrate whenever you think the program fails to identify your face and your eyes. Again, we really appreciate your participation.",
    "create_calibration_instruction(); delete_elem('guide-img');",
    "Continue"
  );
  var guide = new Image();
  guide.src = "../assets/images/guide/Perfect.png";
  guide.id = "guide-img";
  guide.style.display = "block";
  guide.style.position = "fixed";
  guide.style.top = "65%";
  guide.style.left = "calc(50% - 400px)";
  guide.style.zIndex = 13;
  guide.width = cam_width;
  document.body.appendChild(guide);
  var video = document.getElementById("webgazerVideoFeed");
  video.style.left = "calc(50% + 25px)";
  var overlay = document.getElementById("face_tracker");
  overlay.style.left = "calc(50% + 25px)";
}

/**
 * Create the survey
 */
function create_survey(show_share_button) {
  var share_button = "";
  if (show_share_button === true) {
    share_button =
      "<div style='display: inline-block; vertical-align: bottom; background-color: #3b5998;' class='fb-share-button form__button' data-href='https://bucknell-hci.github.io/html/simple.html' data-layout='button' data-size='large' data-mobile-iframe='false'><a style='text-decoration: none!important; color:" +
      background_color +
      "!important;' class='fb-xfbml-parse-ignore' target='_blank' href='https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent("https://bucknell-hci.github.io/html/simple.html") +
      "&amp;src=sdkpreparse'>Share on Facebook</a></div>" +
      "<div style='display: inline-block; vertical-align: bottom; background-color: #1DA1F2;' class='form__button'><a style='text-decoration: none!important; color:" +
      background_color +
      "!important;' target='_blank' href='https://twitter.com/intent/tweet?text=" +
      encodeURIComponent("https://https://bucknell-hci.github.io") +
      "'>Share on Twitter</a></div>";
  }
  var age_options = "";
  var performnace_rating = "";
  for (var i = 6; i < 120; i++) {
    age_options += "<option value=" + i + ">" + i + "</option>";
  }
  for (i = 1; i < 11; i++) {
    performnace_rating += "<option value=" + i + ">" + i + "</option>";
  }
  var survey = document.createElement("div");
  delete_elem("consent_form");
  survey.id = "survey";
  survey.className += "overlay-div";
  survey.style.zIndex = 12;
  survey.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title">This is the last of it, we promise.</h2>' +
    "</header>" +
    "<form id='selection_fields' style='max-height: 60%; overflow-y: scroll; overflow-x: hidden'>" +
    "<select id='experience' onchange='autofill_survey(this)' required>" +
    '<option value="" disabled selected> Have you done this experiment before? </option>' +
    "<option value='yes'> Yes </option>" +
    "<option value='no'> No </option>" +
    "</select>" +
    "</br>" +
    "<select id='age' required>" +
    '<option value="" disabled selected> How old are you? </option>' +
    age_options +
    "</select>" +
    "</br>" +
    "<select id = 'gender' required>" +
    '<option value="" disabled selected> What is your gender? </option>' +
    "<option value='male'> Male </option>" +
    "<option value='female'> Female </option>" +
    "<option value='other'> Other </option>" +
    "</select>" +
    "</br>" +
    "<select id = 'main_country' required>" +
    '<option value="" disabled selected> Which country have you spent most of your life in? </option>' +
    "<option value='Afghanistan'>Afghanistan</option><option value='Aland Islands'>Aland Islands</option><option value='Albania'>Albania</option><option value='Algeria'>Algeria</option><option value='American Samoa'>American Samoa</option><option value='Andorra'>Andorra</option><option value='Angola'>Angola</option><option value='Anguilla'>Anguilla</option><option value='Antarctica'>Antarctica</option><option value='Antigua And Barbuda'>Antigua And Barbuda</option><option value='Argentina'>Argentina</option><option value='Armenia'>Armenia</option><option value='Aruba'>Aruba</option><option value='Australia'>Australia</option><option value='Austria'>Austria</option><option value='Azerbaijan'>Azerbaijan</option><option value='Bahamas'>Bahamas</option><option value='Bahrain'>Bahrain</option><option value='Bangladesh'>Bangladesh</option><option value='Barbados'>Barbados</option><option value='Belarus'>Belarus</option><option value='Belgium'>Belgium</option><option value='Belize'>Belize</option><option value='Benin'>Benin</option><option value='Bermuda'>Bermuda</option><option value='Bhutan'>Bhutan</option><option value='Bolivia'>Bolivia</option><option value='Bosnia And Herzegovina'>Bosnia And Herzegovina</option><option value='Botswana'>Botswana</option><option value='Bouvet Island'>Bouvet Island</option><option value='Brazil'>Brazil</option><option value='British Indian Ocean Territory'>British Indian Ocean Territory</option><option value='Brunei Darussalam'>Brunei Darussalam</option><option value='Bulgaria'>Bulgaria</option><option value='Burkina Faso'>Burkina Faso</option><option value='Burundi'>Burundi</option><option value='Cambodia'>Cambodia</option><option value='Cameroon'>Cameroon</option><option value='Canada'>Canada</option><option value='Cape Verde'>Cape Verde</option><option value='Cayman Islands'>Cayman Islands</option><option value='Central African Republic'>Central African Republic</option><option value='Chad'>Chad</option><option value='Chile'>Chile</option><option value='China'>China</option><option value='Christmas Island'>Christmas Island</option><option value='Cocos (Keeling) Islands'>Cocos (Keeling) Islands</option><option value='Colombia'>Colombia</option><option value='Comoros'>Comoros</option><option value='Congo'>Congo</option><option value='The Democratic Republic Of The Congo'>The Democratic Republic Of The Congo</option><option value='Cook Islands'>Cook Islands</option><option value='Costa Rica'>Costa Rica</option><option value='Cote Divoire'>Cote Divoire</option><option value='Croatia'>Croatia</option><option value='Cuba'>Cuba</option><option value='Cyprus'>Cyprus</option><option value='Czech Republic'>Czech Republic</option><option value='Denmark'>Denmark</option><option value='Djibouti'>Djibouti</option><option value='Dominica'>Dominica</option><option value='Dominican Republic'>Dominican Republic</option><option value='Ecuador'>Ecuador</option><option value='Egypt'>Egypt</option><option value='El Salvador'>El Salvador</option><option value='Equatorial Guinea'>Equatorial Guinea</option><option value='Eritrea'>Eritrea</option><option value='Estonia'>Estonia</option><option value='Ethiopia'>Ethiopia</option><option value='Falkland Islands (Malvinas)'>Falkland Islands (Malvinas)</option><option value='Faroe Islands'>Faroe Islands</option><option value='Fiji'>Fiji</option><option value='Finland'>Finland</option><option value='France'>France</option><option value='French Guiana'>French Guiana</option><option value='French Polynesia'>French Polynesia</option><option value='French Southern Territories'>French Southern Territories</option><option value='Gabon'>Gabon</option><option value='Gambia'>Gambia</option><option value='Georgia'>Georgia</option><option value='Germany'>Germany</option><option value='Ghana'>Ghana</option><option value='Gibraltar'>Gibraltar</option><option value='Greece'>Greece</option><option value='Greenland'>Greenland</option><option value='Grenada'>Grenada</option><option value='Guadeloupe'>Guadeloupe</option><option value='Guam'>Guam</option><option value='Guatemala'>Guatemala</option><option value='Guernsey'>Guernsey</option><option value='Guinea'>Guinea</option><option value='Guinea-bissau'>Guinea-bissau</option><option value='Guyana'>Guyana</option><option value='Haiti'>Haiti</option><option value='Heard Island And Mcdonald Islands'>Heard Island And Mcdonald Islands</option><option value='Holy See (Vatican City State)'>Holy See (Vatican City State)</option><option value='Honduras'>Honduras</option><option value='Hong Kong'>Hong Kong</option><option value='Hungary'>Hungary</option><option value='Iceland'>Iceland</option><option value='India'>India</option><option value='Indonesia'>Indonesia</option><option value='Iran'>Iran</option><option value='Iraq'>Iraq</option><option value='Ireland'>Ireland</option><option value='Isle Of Man'>Isle Of Man</option><option value='Israel'>Israel</option><option value='Italy'>Italy</option><option value='Jamaica'>Jamaica</option><option value='Japan'>Japan</option><option value='Jersey'>Jersey</option><option value='Jordan'>Jordan</option><option value='Kazakhstan'>Kazakhstan</option><option value='Kenya'>Kenya</option><option value='Kiribati'>Kiribati</option><option value='Democratic Peoples Republic of Korea'>Democratic Peoples Republic of Korea</option><option value='Republic of Korea'>Republic of Korea</option><option value='Kuwait'>Kuwait</option><option value='Kyrgyzstan'>Kyrgyzstan</option><option value='Lao Peoples Democratic Republic'>Lao Peoples Democratic Republic</option><option value='Latvia'>Latvia</option><option value='Lebanon'>Lebanon</option><option value='Lesotho'>Lesotho</option><option value='Liberia'>Liberia</option><option value='Libyan Arab Jamahiriya'>Libyan Arab Jamahiriya</option><option value='Liechtenstein'>Liechtenstein</option><option value='Lithuania'>Lithuania</option><option value='Luxembourg'>Luxembourg</option><option value='Macao'>Macao</option><option value='Macedonia'>Macedonia</option><option value='Madagascar'>Madagascar</option><option value='Malawi'>Malawi</option><option value='Malaysia'>Malaysia</option><option value='Maldives'>Maldives</option><option value='Mali'>Mali</option><option value='Malta'>Malta</option><option value='Marshall Islands'>Marshall Islands</option><option value='Martinique'>Martinique</option><option value='Mauritania'>Mauritania</option><option value='Mauritius'>Mauritius</option><option value='Mayotte'>Mayotte</option><option value='Mexico'>Mexico</option><option value='Micronesia'>Micronesia</option><option value='Republic of Moldova'>Republic of Moldova</option><option value='Monaco'>Monaco</option><option value='Mongolia'>Mongolia</option><option value='Montenegro'>Montenegro</option><option value='Montserrat'>Montserrat</option><option value='Morocco'>Morocco</option><option value='Mozambique'>Mozambique</option><option value='Myanmar'>Myanmar</option><option value='Namibia'>Namibia</option><option value='Nauru'>Nauru</option><option value='Nepal'>Nepal</option><option value='Netherlands'>Netherlands</option><option value='New Caledonia'>New Caledonia</option><option value='New Zealand'>New Zealand</option><option value='Nicaragua'>Nicaragua</option><option value='Niger'>Niger</option><option value='Nigeria'>Nigeria</option><option value='Niue'>Niue</option><option value='Norfolk Island'>Norfolk Island</option><option value='Northern Mariana Islands'>Northern Mariana Islands</option><option value='Norway'>Norway</option><option value='Oman'>Oman</option><option value='Pakistan'>Pakistan</option><option value='Palau'>Palau</option><option value='Palestinian Territory'>Palestinian Territory</option><option value='Panama'>Panama</option><option value='Papua New Guinea'>Papua New Guinea</option><option value='Paraguay'>Paraguay</option><option value='Peru'>Peru</option><option value='Philippines'>Philippines</option><option value='Pitcairn'>Pitcairn</option><option value='Poland'>Poland</option><option value='Portugal'>Portugal</option><option value='Puerto Rico'>Puerto Rico</option><option value='Qatar'>Qatar</option><option value='Reunion'>Reunion</option><option value='Romania'>Romania</option><option value='Russian Federation'>Russian Federation</option><option value='Rwanda'>Rwanda</option><option value='Saint Helena'>Saint Helena</option><option value='Saint Kitts And Nevis'>Saint Kitts And Nevis</option><option value='Saint Lucia'>Saint Lucia</option><option value='Saint Pierre And Miquelon'>Saint Pierre And Miquelon</option><option value='Saint Vincent And The Grenadines'>Saint Vincent And The Grenadines</option><option value='Samoa'>Samoa</option><option value='San Marino'>San Marino</option><option value='Sao Tome And Principe'>Sao Tome And Principe</option><option value='Saudi Arabia'>Saudi Arabia</option><option value='Senegal'>Senegal</option><option value='Serbia'>Serbia</option><option value='Seychelles'>Seychelles</option><option value='Sierra Leone'>Sierra Leone</option><option value='Singapore'>Singapore</option><option value='Slovakia'>Slovakia</option><option value='Slovenia'>Slovenia</option><option value='Solomon Islands'>Solomon Islands</option><option value='Somalia'>Somalia</option><option value='South Africa'>South Africa</option><option value='South Georgia And The South Sandwich Islands'>South Georgia And The South Sandwich Islands</option><option value='Spain'>Spain</option><option value='Sri Lanka'>Sri Lanka</option><option value='Sudan'>Sudan</option><option value='Suriname'>Suriname</option><option value='Svalbard And Jan Mayen'>Svalbard And Jan Mayen</option><option value='Swaziland'>Swaziland</option><option value='Sweden'>Sweden</option><option value='Switzerland'>Switzerland</option><option value='Syrian Arab Republic'>Syrian Arab Republic</option><option value='Taiwan'>Taiwan</option><option value='Tajikistan'>Tajikistan</option><option value='Tanzania'>Tanzania</option><option value='Thailand'>Thailand</option><option value='Timor-leste'>Timor-leste</option><option value='Togo'>Togo</option><option value='Tokelau'>Tokelau</option><option value='Tonga'>Tonga</option><option value='Trinidad And Tobago'>Trinidad And Tobago</option><option value='Tunisia'>Tunisia</option><option value='Turkey'>Turkey</option><option value='Turkmenistan'>Turkmenistan</option><option value='Turks And Caicos Islands'>Turks And Caicos Islands</option><option value='Tuvalu'>Tuvalu</option><option value='Uganda'>Uganda</option><option value='Ukraine'>Ukraine</option><option value='United Arab Emirates'>United Arab Emirates</option><option value='United Kingdom'>United Kingdom</option><option value='United States'>United States</option><option value='United States Minor Outlying Islands'>United States Minor Outlying Islands</option><option value='Uruguay'>Uruguay</option><option value='Uzbekistan'>Uzbekistan</option><option value='Vanuatu'>Vanuatu</option><option value='Venezuela'>Venezuela</option><option value='Viet Nam'>Viet Nam</option><option value='British Virgin Islands'>British Virgin Islands</option><option value='U.S. Virgin Islands'>U.S. Virgin Islands</option><option value='Wallis And Futuna'>Wallis And Futuna</option><option value='Western Sahara'>Western Sahara</option><option value='Yemen'>Yemen</option><option value='Zambia'>Zambia</option><option value='Zimbabwe'>Zimbabwe</option>" +
    "</select>" +
    "</br>" +
    "<select id= 'current_country' required>" +
    "<option value='' disabled selected> Which country are you currently living in? </option>" +
    "<option value='Afghanistan'>Afghanistan</option><option value='Aland Islands'>Aland Islands</option><option value='Albania'>Albania</option><option value='Algeria'>Algeria</option><option value='American Samoa'>American Samoa</option><option value='Andorra'>Andorra</option><option value='Angola'>Angola</option><option value='Anguilla'>Anguilla</option><option value='Antarctica'>Antarctica</option><option value='Antigua And Barbuda'>Antigua And Barbuda</option><option value='Argentina'>Argentina</option><option value='Armenia'>Armenia</option><option value='Aruba'>Aruba</option><option value='Australia'>Australia</option><option value='Austria'>Austria</option><option value='Azerbaijan'>Azerbaijan</option><option value='Bahamas'>Bahamas</option><option value='Bahrain'>Bahrain</option><option value='Bangladesh'>Bangladesh</option><option value='Barbados'>Barbados</option><option value='Belarus'>Belarus</option><option value='Belgium'>Belgium</option><option value='Belize'>Belize</option><option value='Benin'>Benin</option><option value='Bermuda'>Bermuda</option><option value='Bhutan'>Bhutan</option><option value='Bolivia'>Bolivia</option><option value='Bosnia And Herzegovina'>Bosnia And Herzegovina</option><option value='Botswana'>Botswana</option><option value='Bouvet Island'>Bouvet Island</option><option value='Brazil'>Brazil</option><option value='British Indian Ocean Territory'>British Indian Ocean Territory</option><option value='Brunei Darussalam'>Brunei Darussalam</option><option value='Bulgaria'>Bulgaria</option><option value='Burkina Faso'>Burkina Faso</option><option value='Burundi'>Burundi</option><option value='Cambodia'>Cambodia</option><option value='Cameroon'>Cameroon</option><option value='Canada'>Canada</option><option value='Cape Verde'>Cape Verde</option><option value='Cayman Islands'>Cayman Islands</option><option value='Central African Republic'>Central African Republic</option><option value='Chad'>Chad</option><option value='Chile'>Chile</option><option value='China'>China</option><option value='Christmas Island'>Christmas Island</option><option value='Cocos (Keeling) Islands'>Cocos (Keeling) Islands</option><option value='Colombia'>Colombia</option><option value='Comoros'>Comoros</option><option value='Congo'>Congo</option><option value='The Democratic Republic Of The Congo'>The Democratic Republic Of The Congo</option><option value='Cook Islands'>Cook Islands</option><option value='Costa Rica'>Costa Rica</option><option value='Cote Divoire'>Cote Divoire</option><option value='Croatia'>Croatia</option><option value='Cuba'>Cuba</option><option value='Cyprus'>Cyprus</option><option value='Czech Republic'>Czech Republic</option><option value='Denmark'>Denmark</option><option value='Djibouti'>Djibouti</option><option value='Dominica'>Dominica</option><option value='Dominican Republic'>Dominican Republic</option><option value='Ecuador'>Ecuador</option><option value='Egypt'>Egypt</option><option value='El Salvador'>El Salvador</option><option value='Equatorial Guinea'>Equatorial Guinea</option><option value='Eritrea'>Eritrea</option><option value='Estonia'>Estonia</option><option value='Ethiopia'>Ethiopia</option><option value='Falkland Islands (Malvinas)'>Falkland Islands (Malvinas)</option><option value='Faroe Islands'>Faroe Islands</option><option value='Fiji'>Fiji</option><option value='Finland'>Finland</option><option value='France'>France</option><option value='French Guiana'>French Guiana</option><option value='French Polynesia'>French Polynesia</option><option value='French Southern Territories'>French Southern Territories</option><option value='Gabon'>Gabon</option><option value='Gambia'>Gambia</option><option value='Georgia'>Georgia</option><option value='Germany'>Germany</option><option value='Ghana'>Ghana</option><option value='Gibraltar'>Gibraltar</option><option value='Greece'>Greece</option><option value='Greenland'>Greenland</option><option value='Grenada'>Grenada</option><option value='Guadeloupe'>Guadeloupe</option><option value='Guam'>Guam</option><option value='Guatemala'>Guatemala</option><option value='Guernsey'>Guernsey</option><option value='Guinea'>Guinea</option><option value='Guinea-bissau'>Guinea-bissau</option><option value='Guyana'>Guyana</option><option value='Haiti'>Haiti</option><option value='Heard Island And Mcdonald Islands'>Heard Island And Mcdonald Islands</option><option value='Holy See (Vatican City State)'>Holy See (Vatican City State)</option><option value='Honduras'>Honduras</option><option value='Hong Kong'>Hong Kong</option><option value='Hungary'>Hungary</option><option value='Iceland'>Iceland</option><option value='India'>India</option><option value='Indonesia'>Indonesia</option><option value='Iran'>Iran</option><option value='Iraq'>Iraq</option><option value='Ireland'>Ireland</option><option value='Isle Of Man'>Isle Of Man</option><option value='Israel'>Israel</option><option value='Italy'>Italy</option><option value='Jamaica'>Jamaica</option><option value='Japan'>Japan</option><option value='Jersey'>Jersey</option><option value='Jordan'>Jordan</option><option value='Kazakhstan'>Kazakhstan</option><option value='Kenya'>Kenya</option><option value='Kiribati'>Kiribati</option><option value='Democratic Peoples Republic of Korea'>Democratic Peoples Republic of Korea</option><option value='Republic of Korea'>Republic of Korea</option><option value='Kuwait'>Kuwait</option><option value='Kyrgyzstan'>Kyrgyzstan</option><option value='Lao Peoples Democratic Republic'>Lao Peoples Democratic Republic</option><option value='Latvia'>Latvia</option><option value='Lebanon'>Lebanon</option><option value='Lesotho'>Lesotho</option><option value='Liberia'>Liberia</option><option value='Libyan Arab Jamahiriya'>Libyan Arab Jamahiriya</option><option value='Liechtenstein'>Liechtenstein</option><option value='Lithuania'>Lithuania</option><option value='Luxembourg'>Luxembourg</option><option value='Macao'>Macao</option><option value='Macedonia'>Macedonia</option><option value='Madagascar'>Madagascar</option><option value='Malawi'>Malawi</option><option value='Malaysia'>Malaysia</option><option value='Maldives'>Maldives</option><option value='Mali'>Mali</option><option value='Malta'>Malta</option><option value='Marshall Islands'>Marshall Islands</option><option value='Martinique'>Martinique</option><option value='Mauritania'>Mauritania</option><option value='Mauritius'>Mauritius</option><option value='Mayotte'>Mayotte</option><option value='Mexico'>Mexico</option><option value='Micronesia'>Micronesia</option><option value='Republic of Moldova'>Republic of Moldova</option><option value='Monaco'>Monaco</option><option value='Mongolia'>Mongolia</option><option value='Montenegro'>Montenegro</option><option value='Montserrat'>Montserrat</option><option value='Morocco'>Morocco</option><option value='Mozambique'>Mozambique</option><option value='Myanmar'>Myanmar</option><option value='Namibia'>Namibia</option><option value='Nauru'>Nauru</option><option value='Nepal'>Nepal</option><option value='Netherlands'>Netherlands</option><option value='New Caledonia'>New Caledonia</option><option value='New Zealand'>New Zealand</option><option value='Nicaragua'>Nicaragua</option><option value='Niger'>Niger</option><option value='Nigeria'>Nigeria</option><option value='Niue'>Niue</option><option value='Norfolk Island'>Norfolk Island</option><option value='Northern Mariana Islands'>Northern Mariana Islands</option><option value='Norway'>Norway</option><option value='Oman'>Oman</option><option value='Pakistan'>Pakistan</option><option value='Palau'>Palau</option><option value='Palestinian Territory'>Palestinian Territory</option><option value='Panama'>Panama</option><option value='Papua New Guinea'>Papua New Guinea</option><option value='Paraguay'>Paraguay</option><option value='Peru'>Peru</option><option value='Philippines'>Philippines</option><option value='Pitcairn'>Pitcairn</option><option value='Poland'>Poland</option><option value='Portugal'>Portugal</option><option value='Puerto Rico'>Puerto Rico</option><option value='Qatar'>Qatar</option><option value='Reunion'>Reunion</option><option value='Romania'>Romania</option><option value='Russian Federation'>Russian Federation</option><option value='Rwanda'>Rwanda</option><option value='Saint Helena'>Saint Helena</option><option value='Saint Kitts And Nevis'>Saint Kitts And Nevis</option><option value='Saint Lucia'>Saint Lucia</option><option value='Saint Pierre And Miquelon'>Saint Pierre And Miquelon</option><option value='Saint Vincent And The Grenadines'>Saint Vincent And The Grenadines</option><option value='Samoa'>Samoa</option><option value='San Marino'>San Marino</option><option value='Sao Tome And Principe'>Sao Tome And Principe</option><option value='Saudi Arabia'>Saudi Arabia</option><option value='Senegal'>Senegal</option><option value='Serbia'>Serbia</option><option value='Seychelles'>Seychelles</option><option value='Sierra Leone'>Sierra Leone</option><option value='Singapore'>Singapore</option><option value='Slovakia'>Slovakia</option><option value='Slovenia'>Slovenia</option><option value='Solomon Islands'>Solomon Islands</option><option value='Somalia'>Somalia</option><option value='South Africa'>South Africa</option><option value='South Georgia And The South Sandwich Islands'>South Georgia And The South Sandwich Islands</option><option value='Spain'>Spain</option><option value='Sri Lanka'>Sri Lanka</option><option value='Sudan'>Sudan</option><option value='Suriname'>Suriname</option><option value='Svalbard And Jan Mayen'>Svalbard And Jan Mayen</option><option value='Swaziland'>Swaziland</option><option value='Sweden'>Sweden</option><option value='Switzerland'>Switzerland</option><option value='Syrian Arab Republic'>Syrian Arab Republic</option><option value='Taiwan'>Taiwan</option><option value='Tajikistan'>Tajikistan</option><option value='Tanzania'>Tanzania</option><option value='Thailand'>Thailand</option><option value='Timor-leste'>Timor-leste</option><option value='Togo'>Togo</option><option value='Tokelau'>Tokelau</option><option value='Tonga'>Tonga</option><option value='Trinidad And Tobago'>Trinidad And Tobago</option><option value='Tunisia'>Tunisia</option><option value='Turkey'>Turkey</option><option value='Turkmenistan'>Turkmenistan</option><option value='Turks And Caicos Islands'>Turks And Caicos Islands</option><option value='Tuvalu'>Tuvalu</option><option value='Uganda'>Uganda</option><option value='Ukraine'>Ukraine</option><option value='United Arab Emirates'>United Arab Emirates</option><option value='United Kingdom'>United Kingdom</option><option value='United States'>United States</option><option value='United States Minor Outlying Islands'>United States Minor Outlying Islands</option><option value='Uruguay'>Uruguay</option><option value='Uzbekistan'>Uzbekistan</option><option value='Vanuatu'>Vanuatu</option><option value='Venezuela'>Venezuela</option><option value='Viet Nam'>Viet Nam</option><option value='British Virgin Islands'>British Virgin Islands</option><option value='U.S. Virgin Islands'>U.S. Virgin Islands</option><option value='Wallis And Futuna'>Wallis And Futuna</option><option value='Western Sahara'>Western Sahara</option><option value='Yemen'>Yemen</option><option value='Zambia'>Zambia</option><option value='Zimbabwe'>Zimbabwe</option>" +
    "</select>" +
    "</br>" +
    "<select id = 'education_level' required>" +
    '<option value="" disabled selected> What is the highest level of education you have received or are pursuing? </option>' +
    "<option value='pre-high school'>Pre-high school</option><option value='high school'>High school</option><option value='college'>College</option><option value='graduate school'>Graduate school</option><option value='professional school'>Professional school</option><option value='PhD'>PhD</option><option value='postdoctoral'>Postdoctoral</option>" +
    "</select>" +
    "</br>" +
    "<select id = 'vision' required>" +
    '<option value="" disabled selected> How is your vision? </option>' +
    "<option value='perfect'>Perfect</option><option value='corrected'>Glasses/Contacts (corrected) </option><option value='other'>Other</option>" +
    "</select>" +
    "</br>" +
    "<select id = 'handedness' required>" +
    '<option value="" disabled selected> What is your handedness? </option>' +
    "<option value='right-handed'>Right-handed</option><option value='left-handed'>Left-handed</option><option value='ambidextrous'>Ambidextrous</option>" +
    "</select>" +
    "</br>" +
    "<select id = 'performance' required>" +
    '<option value="" disabled selected> On a scale of 1 to 10, how well do you think the eye tracker performed? </option>' +
    performnace_rating +
    "</select>" +
    "</br>" +
    "<textarea rows='5' id = 'comment' style='width: calc(100% - 10px)' name='comment' form='selection_fields' placeholder='Comments...'></textarea>" +
    "</form>" +
    "<p id='survey_info' class='information'></p>" +
    "</br>" +
    '<button class="form__button" type="button" onclick = \'send_user_data_to_database()\'> Bye Bye! </button>' +
    // "<a class=\"form__button\" type=\"button\" onclick = \"download_calibration_data(this)\"> Download calibration data for later usage and bye </a>" +
    share_button;
  document.body.appendChild(survey);
}

/************************************
 * CALIBRATION
 ************************************/
/**
 * Shows calibration instruction
 */
function create_calibration_instruction() {
  webgazer_training_data = undefined;
  clear_canvas();
  delete_elem("instruction");
  var instruction = document.createElement("div");
  var instruction_guide1 =
    "This is the calibration step. A dot will appear on the screen every " +
    calibration_settings.duration.toString() +
    " seconds. There will be 39 dots in total, divided into 3 parts with breaks in between. The number on the dot represents the number of dots you have left.";
  // var instruction_guide2 = "If you have done this before, and saved a calibration file, you can upload the file to skip this step entirely.";
  delete_elem("consent_form");
  instruction.id = "instruction";
  instruction.className += "overlay-div";
  instruction.style.zIndex = 12;
  instruction.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title"> Calibration (1/4) </br></h2>' +
    '<p class="information">' +
    instruction_guide1 +
    "<p>" +
    '<p class="information">' +
    "</header>" +
    '<button class="form__button" type="button" onclick="start_calibration()">Start</button>' +
    '<input id=\'calibration_file\' class="file__button" type="file" onchange="upload_calibration_data(event)"> </input>';
  // "<label for='calibration_file'>" +
  // "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='17' viewBox='0 0 20 17'><path d='M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z'/></svg>" +
  // "<span>Upload previous calibration data</span>" +
  // "</label>";
  document.body.appendChild(instruction);
  show_video_feed();
}

function create_calibration_break_form() {
  show_video_feed();
  collect_data = false;
  clear_canvas();
  var instruction = document.createElement("div");
  instruction.id = "instruction";
  instruction.className += "overlay-div";
  instruction.style.zIndex = 12;
  instruction.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title"> Break time! </br> Press the button when you are ready.</h2>' +
    "</header>" +
    '<button class="form__button" type="button" onclick="create_new_dot_calibration()">Continue Calibration</button>';
  document.body.appendChild(instruction);
}
/**
 * Start the calibration
 */
function start_calibration() {
  reset_store_data();
  session_time = new Date().getTime().toString();
  // send initial data to database
  store_data.task = "calibration";
  store_data.description = "begin";
  send_gaze_data_to_database();
  current_task = "calibration";
  var gazeDot = document.getElementById("gazeDot");
  gazeDot.style.zIndex = 14;
  gazeDot.style.display = "block";
  hide_face_tracker();
  collect_data = true;
  webgazer.resume();
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  clear_canvas();
  delete_elem("instruction");
  if (webgazer_training_data !== undefined) {
    webgazer.loadTrainingData(webgazer_training_data);
    finish_calibration();
  } else {
    create_new_dot_calibration();
  }
}

/**
 * Create a new dot for calibration
 */
function create_new_dot_calibration() {
  collect_data = true;
  hide_face_tracker();
  delete_elem("instruction");
  if (num_objects_shown >= calibration_settings.num_dots) {
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
  store_data.description = (num_objects_shown + 1).toString();
  send_gaze_data_to_database();
  webgazer.addWatchListener(curr_object.x, curr_object.y);
  time_stamp = new Date().getTime();
  draw_dot(context, curr_object, dark_color,calibration_settings);
  num_objects_shown++;
}

/**
 * Triggered once the calibration process finishes. Clean up things and go on to next step
 */
function finish_calibration() {
  calibration_current_round = 1;
  objects_array = [];
  num_objects_shown = 0;
  store_data.description = "success";
  send_gaze_data_to_database();
  webgazer.pause();
  collect_data = false;
  paradigm = "simple";
  heatmap_data_x = store_data.gaze_x.slice(0);
  heatmap_data_y = store_data.gaze_y.slice(0);
  reset_store_data(draw_heatmap("navigate_tasks"));
}

function create_general_instruction(
  title,
  information,
  button_action,
  button_label
) {
  clear_canvas();
  delete_elem("instruction");
  var instruction = document.createElement("div");
  instruction.id = "instruction";
  instruction.className += "overlay-div";
  instruction.style.zIndex = 12;
  instruction.innerHTML +=
    '<header class="form__header">' +
    '<h2 class="form__title">' +
    title +
    "</h2>" +
    "<p class='information'>" +
    information +
    "<p>" +
    "</header>" +
    '<button class="form__button" type="button" onclick="delete_elem(\'instruction\'); hide_face_tracker();' +
    button_action +
    '">' +
    button_label +
    "</button>";
  document.body.appendChild(instruction);
  show_video_feed();
}

/**
 * start running task based on paradigm
 */
function navigate_tasks() {
  switch (paradigm) {
    case "simple":
      create_simple_instruction();
      break;
    case "pursuit":
      create_pursuit_instruction();
      break;
    case "massvis":
      create_massvis_instruction();
      break;
    case "iframe":
      create_iframe_testable();
      break;
    case "bonus":
      create_bonus_round_instruction();
      break;
    default:
      loop_iframe_paradigm();
  }
}

/************************************
 * SIMPLE DOT VIEWING PARADIGM
 * If you want to introduce your own paradigms, follow the same structure and extend the design array above.
 ************************************/
function create_simple_instruction() {
  session_time = new Date().getTime().toString();
  reset_store_data();
  create_general_instruction(
    "Dot viewing (2/4)",
    "Please look at the cross. When a dot appears, please look at it. You will have to repeat this process " +
      simple_paradigm_settings.num_trials.toString() +
      " times",
    "loop_simple_paradigm()",
    "Start"
  );
}

function loop_simple_paradigm() {
  // if we don't have dot-positions any more, refill the array
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  collect_data = true;
  webgazer.resume();
  clear_canvas();
  current_task = "simple_paradigm";
  if (objects_array.length === 0) {
    objects_array = create_dot_array(simple_paradigm_settings.position_array);
  }
  curr_object = objects_array.pop();
  num_objects_shown++;
  if (num_objects_shown > simple_paradigm_settings.num_trials) {
    finish_simple_paradigm();
  } else {
    webgazer.pause();
    collect_data = false;
    draw_fixation_cross(canvas.width * 0.5, canvas.height * 0.5, canvas);
    setTimeout(function() {
      clear_canvas();
      webgazer.resume();
      collect_data = true;
      draw_dot(context, curr_object, dark_color, simple_paradigm_settings);
      setTimeout(loop_simple_paradigm, simple_paradigm_settings.dot_show_time);
    }, simple_paradigm_settings.fixation_rest_time);
  }
}

function finish_simple_paradigm() {
  objects_array = [];
  num_objects_shown = 0;
  store_data.task = "simple";
  store_data.description = "success";
  paradigm = "pursuit";
  webgazer.pause();
  collect_data = false;
  console.log("finish simple paradigm");
  heatmap_data_x = store_data.gaze_x.slice(0);
  heatmap_data_y = store_data.gaze_y.slice(0);
  send_gaze_data_to_database();
  draw_heatmap("navigate_tasks");
}

/************************************
 * SMOOTH PURSUIT PARADIGM
 ************************************/
function create_pursuit_instruction() {
  reset_store_data();
  session_time = new Date().getTime().toString();
  create_general_instruction(
    "Dot pursuing (3/4)",
    "There will be a dot appearing on the screen. When it changes color, please follow it. You will have to repeat this procedure " +
      pursuit_paradigm_settings.num_trials.toString() +
      " times",
    "loop_pursuit_paradigm()",
    "Start"
  );
}

function loop_pursuit_paradigm() {
  if (num_objects_shown >= pursuit_paradigm_settings.num_trials) {
    finish_pursuit_paradigm();
    return;
  }
  // if we don't have dot-positions any more, refill the array
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  collect_data = true;
  webgazer.resume();
  clear_canvas();
  current_task = "pursuit_paradigm";
  if (objects_array.length === 0) {
    var temp = { arr: pursuit_paradigm_settings.position_array };
    var obj = $.extend(true, {}, temp);
    objects_array = obj.arr;
    objects_array = shuffle(objects_array);
    for (var i = 0; i < objects_array.length; i++) {
      objects_array[i].x = canvas.width * objects_array[i].x;
      objects_array[i].tx = canvas.width * objects_array[i].tx;
      objects_array[i].y = canvas.height * objects_array[i].y;
      objects_array[i].ty = canvas.height * objects_array[i].ty;
    }
  }
  curr_object = objects_array.pop();
  curr_object.cx = curr_object.x;
  curr_object.cy = curr_object.y;
  num_objects_shown++;
  var dot = {
    x: curr_object.cx,
    y: curr_object.cy,
    r: DEFAULT_DOT_RADIUS
  };
  draw_dot(context, dot, light_color, pursuit_paradigm_settings);
  setTimeout(function() {
    time_stamp = null;
    draw_moving_dot();
  }, pursuit_paradigm_settings.fixation_rest_time);
}

function draw_moving_dot() {
  if (current_task !== "pursuit_paradigm") return;
  var now = new Date().getTime(),
    dt = now - (time_stamp || now);
  time_stamp = now;
  var angle = Math.atan2(
    curr_object.ty - curr_object.y,
    curr_object.tx - curr_object.x
  );
  var dist_per_frame =
    distance(curr_object.x, curr_object.y, curr_object.tx, curr_object.ty) /
    pursuit_paradigm_settings.dot_show_time *
    dt;
  var x_dist_per_frame = Math.cos(angle) * dist_per_frame;
  var y_dist_per_frame = Math.sin(angle) * dist_per_frame;
  curr_object.cx = curr_object.cx + x_dist_per_frame;
  curr_object.cy = curr_object.cy + y_dist_per_frame;
  var dot = {
    x: curr_object.cx,
    y: curr_object.cy,
    r: DEFAULT_DOT_RADIUS
  };
  if (
    distance(curr_object.cx, curr_object.cy, curr_object.tx, curr_object.ty) <
    20
  ) {
    loop_pursuit_paradigm();
    return;
  } else {
    var canvas = document.getElementById("canvas-overlay");
    var context = canvas.getContext("2d");
    clear_canvas();
    draw_dot(context, dot, dark_color, pursuit_paradigm_settings);
    request_anim_frame(draw_moving_dot);
  }
}

function finish_pursuit_paradigm() {
  objects_array = [];
  num_objects_shown = 0;
  store_data.task = "pursuit";
  store_data.description = "success";
  current_task = "pursuit_end";
  paradigm = "massvis";
  webgazer.pause();
  collect_data = false;
  heatmap_data_x = store_data.gaze_x.slice(0);
  heatmap_data_y = store_data.gaze_y.slice(0);
  draw_heatmap("navigate_tasks");
  send_gaze_data_to_database();
  console.log("finish pursuit paradigm");
}

/************************************
 * MASSVIS PARADIGM
 ************************************/
function create_massvis_instruction() {
  reset_store_data();
  session_time = new Date().getTime().toString();
  create_general_instruction(
    "Massvis (4/4)",
    "There will be a fixation cross appearing on the screen. Please look at it. <br> When the cross disappears, there will be a data visualization appearing on the screen. Feel free to look at whatever you like on the visualization.",
    "loop_massvis_paradigm()",
    "Start"
  );
}

function loop_massvis_paradigm() {
  if (num_objects_shown >= massvis_paradigm_settings.num_trials) {
    finish_massvis_paradigm();
    return;
  }
  var canvas = document.getElementById("canvas-overlay");
  current_task = "massvis_paradigm";
  collect_data = true;
  webgazer.resume();
  clear_canvas();
  objects_array = shuffle(massvis_paradigm_settings.image_array);
  curr_object = new Image();
  curr_object.src = objects_array.pop();
  store_data.description = curr_object.src;
  draw_fixation_cross(canvas.width * 0.5, canvas.height * 0.5, canvas);
  num_objects_shown++;
  webgazer.pause();
  collect_data = false;
  setTimeout(draw_massvis_image, massvis_paradigm_settings.fixation_rest_time);
}
/**
 * Draw massvis
 */
function draw_massvis_image() {
  clear_canvas();
  webgazer.resume();
  collect_data = true;
  var canvas = document.getElementById("canvas-overlay");
  var context = canvas.getContext("2d");
  var aspect_ratio = curr_object.width / curr_object.height;
  if (
    curr_object.width >= canvas.width ||
    curr_object.height >= canvas.height
  ) {
    var heightmajor_height =
      canvas.height - massvis_paradigm_settings.spacing * 2;
    var heightmajor_width = aspect_ratio * heightmajor_height;
    var widthmajor_width = canvas.width - massvis_paradigm_settings.spacing * 2;
    var widthmajor_height = widthmajor_width / aspect_ratio;
    if (
      heightmajor_height < canvas.height &&
      heightmajor_width < canvas.width
    ) {
      curr_object.width = heightmajor_width;
      curr_object.height = heightmajor_height;
    } else if (
      widthmajor_width < canvas.width &&
      widthmajor_height < canvas.height
    ) {
      curr_object.width = widthmajor_width;
      curr_object.height = widthmajor_height;
    }
  }
  curr_object.onload = context.drawImage(
    curr_object,
    canvas.width / 2 - curr_object.width / 2,
    canvas.height / 2 - curr_object.height / 2,
    curr_object.width,
    curr_object.height
  );

  context.font = "20px Source Sans Pro";
  context.fillStyle = font_color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    num_objects_shown.toString() +
      " / " +
      massvis_paradigm_settings.num_trials.toString(),
    canvas.width - 50,
    25
  );

  setTimeout(function() {
    store_data.task = "massvis";
    paradigm = "massvis";
    heatmap_data_x = store_data.gaze_x.slice(0);
    heatmap_data_y = store_data.gaze_y.slice(0);
    send_gaze_data_to_database();
    reset_store_data(draw_heatmap("loop_massvis_paradigm"));
  }, massvis_paradigm_settings.image_show_time);
}

function finish_massvis_paradigm() {
  clear_canvas();
  num_objects_shown = 0;
  store_data.task = "massvis";
  paradigm = "bonus";
  webgazer.pause();
  collect_data = false;
  navigate_tasks();
  console.log("finish massvis paradigm");
}

/************************************
 * BONUS ROUND
 * If you want to introduce your own paradigms, follow the same structure and extend the design array above.
 ************************************/
function create_bonus_round_instruction() {
  reset_store_data();
  session_time = new Date().getTime().toString();
  create_general_instruction(
    "Bonus Round",
    "Make a painting with just your eyes.<br> This task is optional.",
    "create_heatmap_overlay()",
    "Start"
  );
  var instruction = document.getElementById("instruction");
  instruction.innerHTML +=
    '<button class="form__button" type="button" onclick="delete_elem(\'instruction\'); hide_face_tracker(); create_survey(true)"> Skip </button>';
}

function create_heatmap_overlay() {
  var function_name = "upload_to_imgur";
  current_task = "bonus";
  collect_data = true;
  webgazer.resume();
  webgazer.showPredictionPoints(true);
  var canvas = document.createElement("canvas");
  canvas.id = "heatmap-overlay";
  // canvas.addEventListener("mousedown", canvas_on_click, false);
  // style the newly created canvas
  canvas.style.zIndex = 11;
  canvas.style.position = "fixed";
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var button = document.createElement("button");
  button.className += "form__button";
  button.id = "heatmap-button";
  button.style.opacity = 0.5;
  button.style.right = "1em";
  button.style.bottom = "2em";
  button.innerHTML = "Done";
  button.style.position = "absolute";
  button.style.zIndex = 99;
  button.addEventListener("click", function() {
    window[function_name](canvas);
    webgazer.pause();
    collect_data = false;
    delete_elem("heatmap-button");
  });
  button.onmouseover = function() {
    button.style.opacity = 1;
  };
  button.onmouseout = function() {
    button.style.opacity = 0.5;
  };
  document.body.appendChild(button);
}

function loop_bonus_round() {
  var canvas = document.getElementById("heatmap-overlay");
  var heat = simpleheat(canvas);
  var points = [];
  for (i = 0; i < store_data.gaze_x.length; i++) {
    var point = [store_data.gaze_x[i], store_data.gaze_y[i], 0.1];
    points.push(point);
  }

  heat.data(points);
  heat.draw();
}

function upload_to_imgur(canvas) {
  var image = canvas.toDataURL().slice(22);
  var form = new FormData();
  form.append("image", image);

  var settings = {
    async: true,
    crossDomain: true,
    url: "https://api.imgur.com/3/image",
    method: "POST",
    headers: {
      authorization: "Bearer b99c6cfd9f5ed209e572032238a4a4db48e3ed3d"
    },
    processData: false,
    contentType: false,
    mimeType: "multipart/form-data",
    data: form
  };

  $.ajax(settings).done(function(response) {
    var link = JSON.parse(response).data.link;
    bonus_round_share(link);
    store_data.description = link;
    store_data.object_x = [0];
    store_data.object_y = [0];
    send_gaze_data_to_database();
  });
}

function bonus_round_share(link) {
  //
  //
  // document.body.innerHTML += "<div id='fb-share-div' style='position: absolute; z-index: 99; bottom: 2em; right: 10em; vertical-align: bottom; background-color: #3b5998; ' class='fb-share-button form__button' data-href='https://khaiquangnguyen.github.io' data-layout='button' data-size='large' data-mobile-iframe='false'><a style='text-decoration: none!important; color:" + background_color + "!important;' class='fb-xfbml-parse-ignore' target='_blank' href='https://www.facebook.com/sharer/sharer.php?u=" + link + "&amp;src=sdkpreparse'>Share on Facebook</a></div>";
  var share_link = "";
  var button = document.createElement("button");
  button.className += "form__button";
  button.id = "heatmap-button";
  button.style.opacity = 0.5;
  button.style.right = "1em";
  button.style.bottom = "2em";
  button.innerHTML = "Next";
  button.style.position = "absolute";
  button.style.zIndex = 99;
  button.addEventListener("click", function() {
    finish_bonus_round();
  });
  button.onmouseover = function() {
    button.style.opacity = 1;
  };
  button.onmouseout = function() {
    button.style.opacity = 0.5;
  };
  document.body.appendChild(button);

  var share_button_fb = document.createElement("button");
  share_button_fb.style.backgroundColor = "#3b5998";
  share_button_fb.className += "form__button";
  share_button_fb.id = "bonus-round-share-button-fb";
  share_button_fb.style.right = "10em";
  share_button_fb.style.bottom = "2em";
  share_button_fb.innerHTML = "Share on Facebook";
  share_button_fb.style.position = "absolute";
  share_button_fb.style.zIndex = 99;
  share_button_fb.addEventListener("click", function(e) {
    link = encodeURIComponent(link);
    share_link =
      "https://www.facebook.com/dialog/share?" +
      "app_id=140235746556932" +
      "&quote=" +
      encodeURIComponent(
        "I made this drawing only with my eyes. You can make your own AND contribute to science at: https://bucknell-hci.github.io"
      ) +
      "&href=" +
      link +
      "&display=popup";
    window.open(share_link, "_blank");
  });

  document.body.appendChild(share_button_fb);

  var share_button_tw = document.createElement("button");
  share_button_tw.style.backgroundColor = "#1DA1F2";
  share_button_tw.className += "form__button";
  share_button_tw.id = "bonus-round-share-button-tw";
  share_button_tw.style.right = "30em";
  share_button_tw.style.bottom = "2em";
  share_button_tw.innerHTML = "Share on Twitter";
  share_button_tw.style.position = "absolute";
  share_button_tw.style.zIndex = 99;
  share_button_tw.addEventListener("click", function() {
    link = link.replace("i.", "");
    link = link.slice(0, -4);
    share_link =
      "https://twitter.com/intent/tweet?text=" +
      link +
      " " +
      encodeURIComponent(
        "I made this drawing only with my eyes. You can make your own AND contribute to science at: https://bucknell-hci.github.io"
      );
    window.open(share_link, "_blank");
  });

  document.body.appendChild(share_button_tw);
}
// /**
//  * Draw bonus round images
//  */
// function draw_bonus_round_image() {
//     clear_canvas();
//     webgazer.resume();
//     collect_data = true;
//     var canvas = document.getElementById("canvas-overlay");
//     var context = canvas.getContext("2d");
//     var aspect_ratio = curr_object.width/curr_object.height;
//     if (curr_object.width >= canvas.width || curr_object.height >= canvas.height) {
//         var heightmajor_height = canvas.height - massvis_paradigm_settings.spacing * 2;
//         var heightmajor_width = aspect_ratio * heightmajor_height;
//         var widthmajor_width =  canvas.width - massvis_paradigm_settings.spacing * 2;
//         var widthmajor_height = widthmajor_width / aspect_ratio;
//         if (heightmajor_height < canvas.height && heightmajor_width < canvas.width) {
//             curr_object.width = heightmajor_width;
//             curr_object.height = heightmajor_height;
//         } else if (widthmajor_width < canvas.width && widthmajor_height < canvas.height) {
//             curr_object.width = widthmajor_width;
//             curr_object.height = widthmajor_height;
//         }
//     }
//     curr_object.onload =
//         context.drawImage(curr_object,
//             canvas.width / 2 - curr_object.width / 2,
//             canvas.height / 2 - curr_object.height / 2,
//             curr_object.width,
//             curr_object.height
//         );
//
//     setTimeout(function(){
//         store_data.task = "bonus";
//         paradigm = "bonus";
//         heatmap_data_x = store_data.gaze_x.slice(0);
//         heatmap_data_y = store_data.gaze_y.slice(0);
//         draw_heatmap("loop_bonus_round");
//     }, bonus_round_settings.image_show_time);
// }

function finish_bonus_round() {
  delete_elem("heatmap-overlay");
  webgazer.showPredictionPoints(false);
  delete_elem("bonus-round-share-button-fb");
  delete_elem("bonus-round-share-button-tw");
  delete_elem("heatmap-button");
  clear_canvas();
  num_objects_shown = 0;
  store_data.task = "bonus";
  paradigm = "bonus";
  webgazer.pause();
  collect_data = false;
  create_survey(false);
  console.log("finish bonus paradigm");
}
