var model_name_menu = document.getElementById("model_name");
var layer_menu = document.getElementById("layer");
var unit_id_input = document.getElementById("unit_id");
var unit_id_label = document.getElementById("unit_id_label");

// Load rf data.
let rf_data = {
    "alexnet": {
        "layer_indices": [0, 3, 6, 8, 10],
        "rf_sizes": [11, 51, 99, 131, 163],
        "xn": [15, 63, 127, 159, 191],
        "nums_units": [64, 192, 384, 256, 256]
    },
    "vgg16": {
        "layer_indices": [0, 2, 5, 7, 10, 12, 14, 17, 19, 21, 24, 26, 28],
        "rf_sizes": [3, 5, 10, 14, 24, 32, 40, 60, 76, 92, 132, 164, 196],
        "xn": [5, 7, 14, 18, 28, 36, 52, 72, 88, 104, 176, 208, 240],
        "nums_units": [64, 64, 128, 128, 256, 256, 256, 512, 512, 512, 512, 512, 512]
    },
    "resnet18": {
        "layer_indices": [0, 4, 7, 10, 13, 16, 19, 21, 24, 27, 30, 33, 35, 38, 41, 44, 47, 49, 52, 55],
        "rf_sizes": [7, 19, 27, 35, 43, 51, 67, 43, 83, 99, 115, 147, 99, 179, 211, 243, 307, 211, 371, 435],
        "xn": [9, 25, 33, 41, 49, 65, 81, 49, 97, 113, 129, 193, 129, 225, 257, 321, 385, 257, 449, 513],
        "nums_units": [64, 64, 64, 64, 64, 128, 128, 128, 128, 128, 256, 256, 256, 256, 256, 512, 512, 512, 512, 512]
    }
}

// Get model, layer, and unit_id (the default values) from index.html.
let model_name = model_name_menu.value;
let layer = layer_menu.value;
let conv_i = parseInt(layer.match(/\d+/)[0]) - 1;
let unit_id = parseInt(unit_id_input.value);
let num_layers = rf_data[model_name].layer_indices.length;
let num_units = rf_data[model_name].nums_units[conv_i];
unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
unit_id_input.max = num_units - 1;

// populate the layer dropdown menu according to the model.
const populateLayerMenu = () => {
    // Clear all options first.
    layer_menu.innerHTML = '';

    // Populate with new layer options.
    for(let i = 1; i < num_layers+1; i++) {
        // Deeper layers are too big. They are too slow to render and should
        // not be included in the dropdown menu.
        let thisLayerName = `conv${i}`;
        var newOption = document.createElement("option");
        newOption.textContent = thisLayerName;
        newOption.value = thisLayerName;
        layer_menu.appendChild(newOption);
    }
}
populateLayerMenu();

// model dropdown menu logic:
model_name_menu.addEventListener('change', async (event) => {
    model_name = model_name_menu.value;
    num_layers = rf_data[model_name].layer_indices.length;
    populateLayerMenu();
    layer = layer_menu.value;
    conv_i = parseInt(layer.match(/\d+/)[0]) - 1
    num_units = rf_data[model_name].nums_units[conv_i];
    unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
    unit_id_input.max = num_units - 1;
    load_natural_img_index();
    load_img();
    load_stats();
});

let natural_image_indicies;
// layer dropdown menu logic:
layer_menu.addEventListener('change', async (event) => {
    layer = layer_menu.value;
    conv_i = parseInt(layer.match(/\d+/)[0]) - 1
    num_units = rf_data[model_name].nums_units[conv_i];
    unit_id_label.innerHTML = `Choose a unit (0 - ${num_units-1}): `;
    unit_id_input.max = num_units - 1;
    load_natural_img_index();
    load_img();
    load_stats();
});

// unit input form logic:
unit_id_input.addEventListener('change', (event) => {
    unit_id = parseInt(unit_id_input.value);
    load_img();
    load_stats();
});


/* Configuring AWS S3 access
Reference Website: Viewing Photos in an Amazon S3 Bucket from a Browser
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
*/
var albumBucketName = 'rfmapping';
AWS.config.region = 'us-west-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-west-2:495c99f0-9773-4aef-9e01-29b3c4127e50',
});

// create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

// utility function to create HTML.
function getHtml(template) {
    return template.join('\n');
};

function load_cri() {
    var cri_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/cri/${model_name}/${model_name}.json`;
    fetch(cri_url)
        .then(response => response.json())
        .then(data => {
            var cri = data[`${layer}`][`${unit_id}`];
            document.getElementById('cri').innerHTML = `Color Rotation Index = ${cri}`;
        });
}

function load_fnat() {
    // rfmp4a
    var max_fnat_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/fnat/${model_name}/rfmp4a/max_${layer}.json`;
    var min_fnat_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/fnat/${model_name}/rfmp4a/min_${layer}.json`;
    fetch(max_fnat_url)
        .then(response => response.json())
        .then(data => {
            var max_fnat = data[`${layer}`][`${unit_id}`];
            document.getElementById('rfmp4a_max_fnat').innerHTML = `Max Fnat = ${max_fnat}`;
        }
    );
    fetch(min_fnat_url)
        .then(response => response.json())
        .then(data => {
            var min_fnat = data[`${layer}`][`${unit_id}`];
            document.getElementById('rfmp4a_min_fnat').innerHTML = `Min Fnat = ${min_fnat}`;
        }
    );

    // rfmp4c7o
    var max_fnat_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/fnat/${model_name}/rfmp4c7o/max_${layer}.json`;
    var min_fnat_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/fnat/${model_name}/rfmp4c7o/min_${layer}.json`;
    fetch(max_fnat_url)
        .then(response => response.json())
        .then(data => {
            var max_fnat = data[`${layer}`][`${unit_id}`];
            document.getElementById('rfmp4c7o_max_fnat').innerHTML = `Max Fnat = ${max_fnat}`;
        }
    );
    fetch(min_fnat_url)
        .then(response => response.json())
        .then(data => {
            var min_fnat = data[`${layer}`][`${unit_id}`];
            document.getElementById('rfmp4c7o_min_fnat').innerHTML = `Min Fnat = ${min_fnat}`;
        }
    );
}

function load_natural_img_index() {
    var img_indicies_url = `https://s3.us-west-2.amazonaws.com/cnn-database/stats/natural_images/${model_name}/${layer}.json`;
    fetch(img_indicies_url)
        .then(response => response.json())
        .then(data => {
            natural_image_indicies = data;
        }
    );
}

// function load_natural_img() {
//     var html_template = ["<div>"]
//     for (var i = 0; i < 5; i++) {
//         var img_index = natural_image_indicies[`${unit_id}`][i]["max_img_idx"];
//         var img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/natural_images/${img_index}.png`;
//         html_template.push(`<img src="${img_url}"/>`);
//         // These image should have a rectangle drawn on them. The coordinates are defined in the json file.
//         var x_y_width_height = natural_image_indicies[`${unit_id}`][i]["max_idx"];  // [x, y, width, height]
//         // How to apply the rectangle to the image?
//     }
//     html_template.push("</div>");
//     html_template.push("<div>")
//     for (var i = 0; i < 5; i++) {
//         var img_index = natural_image_indicies[`${unit_id}`][i]["min_img_idx"];
//         var img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/natural_images/${img_index}.png`;
//         html_template.push(`<img src="${img_url}"/>`);
//         // These image should have a rectangle drawn on them. The coordinates are defined in the json file.
//         var x_y_width_height = natural_image_indicies[`${unit_id}`][i]["min_idx"];  // [x, y, width, height]
//         // How to apply the rectangle to the image?
//     }
//     document.getElementById("natural_image_div").innerHTML = getHtml(html_template);
// }

function init_natural_img() {
    var html_template = ["<div>"];
    for (var i = 0; i < 5; i++) {
        html_template.push(`<canvas id="canvas${i}max" width="227" height="227"></canvas>`);
    }
    html_template.push("</div>");
    html_template.push("<div>");
    for (var i = 0; i < 5; i++) {
        html_template.push(`<canvas id="canvas${i}min" width="227" height="227"></canvas>`);
    }
    html_template.push("</div>");
    document.getElementById("natural_image_div").innerHTML = getHtml(html_template);
}

function load_natural_img() {
    for (var i = 0; i < 5; i++) {
        var img_index = natural_image_indicies[`${unit_id}`][i]["max_img_idx"];
        var x_y_width_height = natural_image_indicies[`${unit_id}`][i]["max_idx"]; // [x, y, width, height]
        drawRectangleOnImage(`canvas${i}max`, `https://s3.us-west-2.amazonaws.com/cnn-database/natural_images/${img_index}.png`, x_y_width_height);
    }
    for (var i = 0; i < 5; i++) {
        var img_index = natural_image_indicies[`${unit_id}`][i]["min_img_idx"];
        var x_y_width_height = natural_image_indicies[`${unit_id}`][i]["min_idx"]; // [x, y, width, height]
        drawRectangleOnImage(`canvas${i}min`, `https://s3.us-west-2.amazonaws.com/cnn-database/natural_images/${img_index}.png`, x_y_width_height);
    }
}

function drawRectangleOnImage(canvasId, imageUrl, rectDimensions) {
    var canvas = document.getElementById(canvasId);
    var context = canvas.getContext('2d');

    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    var image = new Image();

    // Handle successful image loading
    image.onload = function() {
        context.drawImage(image, 0, 0);
        context.beginPath();
        context.rect(rectDimensions[0], rectDimensions[1], rectDimensions[2], rectDimensions[3]);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.stroke();
    };

    // Handle image loading failure
    image.onerror = function() {
        console.log('Error loading image at ' + imageUrl);
    };

    // Start loading the image
    image.src = imageUrl;
}


function load_guided_backprop_img() {
    var max_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/guided_backprop/${model_name}/${layer}/max_${unit_id}.png`;
    var min_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/guided_backprop/${model_name}/${layer}/min_${unit_id}.png`;
    document.getElementById("guided_backprop_div").innerHTML = `<img style="width:100px;height:100px;" src="${max_img_url}"/> <img style="width:100px;height:100px;" src="${min_img_url}"/>`;
}

function load_rfmp4a_img() {
    var max_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/rfmp4a/${model_name}/${layer}/max_${unit_id}.png`;
    var min_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/rfmp4a/${model_name}/${layer}/min_${unit_id}.png`;
    document.getElementById("rfmp4a_image_div").innerHTML = `<img style="width:100px;height:100px;" src="${max_img_url}"/> <img style="width:100px;height:100px;" src="${min_img_url}"/>`;
}

function load_rfmp4c7o_img() {
    var max_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/rfmp4c7o/${model_name}/${layer}/max_${unit_id}.png`;
    var min_img_url = `https://s3.us-west-2.amazonaws.com/cnn-database/rfmp4c7o/${model_name}/${layer}/min_${unit_id}.png`;
    document.getElementById("rfmp4c7o_image_div").innerHTML = `<img style="width:100px;height:100px;" src="${max_img_url}"/> <img style="width:100px;height:100px;" src="${min_img_url}"/>`;
}

// show the photos that exist in an album.
function load_img() {
    load_natural_img_index();

    load_natural_img();
    load_guided_backprop_img();
    load_rfmp4a_img();
    load_rfmp4c7o_img();
};

function load_stats()
{
    load_cri();
    load_fnat();
}

init_natural_img();
load_natural_img_index();
load_img();
load_stats();
