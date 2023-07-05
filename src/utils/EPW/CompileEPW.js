import fs from 'fs';
import JSONStream from 'JSONStream';

const __dir = process.cwd();
const ep_json_filepath = './EP_JSON';
const ob_kml_filepath = './OneBuilding_KML';

function JSONReader(filePath) {

    const json_stuff = fs.promises.readFile(filePath, 'utf-8').then(function (data) {
        const json_stuff_ = [];

        try {
            const epw_json = JSON.parse(data).features;
            epw_json.forEach((epw) => {

                const epw_info = {
                    "name" : `${epw.properties.title}`,
                    "coords" : epw.geometry.coordinates,
                    "url" : `${epw.properties.all.split('=')[1].split('>')[0]}`
                }

                json_stuff_.push(epw_info);
            })
            // for (var i = 0; i < epw_json.length; i++) {
            //     const epw_info = {
            //         name : epw_json[i].properties.title,
            //         coords : epw_json[i].geometry.coordinates,
            //         url : epw_json[i].properties.all.split('=')[1].split('>')[0]
            //     }

            //     json_stuff_.push(epw_info);
            // }

        } catch (err) {
            console.log(err);
        }

        return json_stuff_;
    })

    return json_stuff;
}

async function processJSONFiles(files) {
    var json_compilation = [];

    for (var i = 0; i < files.length; i++) {
        const filePath_ = ep_json_filepath + '/' + files[i];
        var json_ = await JSONReader(filePath_);
        for (var k = 0; k < json_.length; k++) {
            json_compilation.push(json_[k])
        }
    }

    return json_compilation
}


function KMLReader(filePath) {


    const kml_stuff = fs.promises.readFile(filePath, 'utf-8').then(function (data) {

        const kml_stuff_ = [];
        // Getting file content
        const locationStrings = data.split('<Placemark>');
        locationStrings.splice(0,1);
        
        locationStrings.forEach((location) => {
            const urlElem = location.split('<tr>');
            try {
                const urlString = urlElem[urlElem.length - 1].split('URL ')[1].split('<')[0];
                const checkURL = urlString.split('TMYx.')[1];
                if (checkURL == "zip") {
                    const location_name = location.split('<name>')[1].split('</name>')[0];
        
                    const location_coord = location.split('<coordinates>')[1].split('</coordinates>')[0].split(',');
        
                    const epw_info = {
                        "name" : `${location_name}`,
                        "coords" : [Number(location_coord[1]), Number(location_coord[0])],
                        "url" : `${urlString}`
                    }
                    
                    kml_stuff_.push(epw_info);
                    
                }
            } catch (err) {
                console.log(err)
                console.log(urlElem)
                console.log(urlElem[urlElem.length - 1].split('URL '));
            }

        })

        return kml_stuff_
    });

    return kml_stuff
}

async function processKMLFiles(files) {
    var kml_compilation = [];

    for (var i = 0; i < files.length; i++) {
        const filePath_ = ob_kml_filepath + '/' + files[i];
        var kml_ = await KMLReader(filePath_);
        for (var k = 0; k < kml_.length; k++) {
            kml_compilation.push(kml_[k])
        }
    }

    return kml_compilation
}



// TESTING OF SINGLE FILES
// var KML_files = fs.readdirSync('./OneBuilding_KML');
// kml_compilation = await KMLReader(`${ob_kml_filepath + '/' + KML_files[0]}`);
// console.log(kml_compilation)

// TESTING SCRIPT FOR WHOLE FOLDER OF FILES
var EP_files = fs.readdirSync(ep_json_filepath);
var json_ = await processJSONFiles(EP_files);
// console.log(json_);

// WORKING SCRIPT FOR WHOLE FOLDER OF FILES
var KML_files = fs.readdirSync(ob_kml_filepath);
var kml_ = await processKMLFiles(KML_files);
// console.log(kml_);

var compilation = [];

json_.forEach((json) => {
    compilation.push(json);
})

kml_.forEach((kml) => {
    compilation.push(kml);
})

// console.log(JSON.stringify(compilation.splice(0,2), null, 2))
// console.log(typeof(compilation));
// console.log(compilation.length);

// Writing to a JSON file
const compilation_object = {
    "epw" : {}
}

compilation_object.epw = compilation
// console.log(JSON.stringify(compilation_object, null, 2))

fs.writeFile('EPW_Compilation.json', JSON.stringify(compilation_object, null, 2), (err) => {
    if (err) {
        console.log(err);
    }
})