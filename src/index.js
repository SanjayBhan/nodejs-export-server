/**
 * FusionCharts Node.js Exporter
 * -----------------------------
 * 
 * Prerequisites
 * -------------
 * 
 *   1. Requires inkscape to be installed and to be present in the $PATH.
 *   2. Requires ImageMagick to be installed.
 *   
 * Installation
 * ------------
 * 
 * $ cd path/to/nodejsexporter
 * $ npm install
 *
 * Server Configuration
 * --------------------
 * 
 * The server configuration is present in the config.json file in the root path. Edit this file to change the config. Currently it contains
 * 
 *     port => The port on which the server needs to be started.
 *     
 *     fileSavePath => The path for the saved image files when the `exportAction` is save.
 *     
 * Running the server
 * ------------------
 * 
 * $ cd path/to/nodejsexporter/src
 * 
 * $ node index.js
 * 
 */
var express = require ('express');
var Inkscape = require('inkscape');
var im = require('imagemagick');
var app = new express ();
var bodyParser = require('body-parser');
var fs = require ('fs');
var path = require ('path');

// Content Types for all the file types
var contentType = {
    'png': 'image/png',
    'jpeg': 'image/png',
    'jpg': 'image/png',
    'pdf': 'application/pdf',
    'svg': 'image/svg+xml', 
};

// Command-line options to be passed to Inkscape for all file types
var exportAs = {
    'png': '--export-png',
    'pdf': '--export-pdf',
    'svg': '--export-plain-svg',
    'jpg': '--export-png',
};

app.use( bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

// Calls the doExport function on POST
app.post('/', function (req, res) {
    doExport (req, res);
});

// The config file
var config = JSON.parse(fs.readFileSync (path.resolve (__dirname, '../', 'config.json')));
var rootPath = path.resolve (__dirname, '../');
var savePath = path.resolve (rootPath, config.fileSavePath);
// The fileNo increases linearly whenever a file is saved to the server
var fileNo = 0;

console.log ('Starting the exporter on port ' + config.port);
console.log ('File save path set as `' + savePath + '`');

app.listen (config.port);


// Main export function
function doExport (req, res) {
    var params = parseParams (req.body),
        filename = params.parameters.exportfilename + '.' + params.parameters.exportformat;

    inkscape = new Inkscape ([exportAs[params.parameters.exportformat], '--export-width=' + params.width, '--export-height=' + params.height]);
    /**
     * When the exportAction is download it creates a readstream which is piped to Inkscape, Which is then piped to the response object.
     * The exception is jpeg, which cannot be created by inkscape. So instead it is converted to png and ImageMagick is used to convert it to jpeg
     * The Content-Disposition is set to attachment to trigger a file download
     */
    if(params.parameters.exportAction === 'download') {
        res.writeHead(200, {'Content-Type': contentType[params.parameters.exportformat], 'Content-Disposition': 'attachment; filename=' + filename});
        fs.writeFileSync (__dirname + '/tmp.svg', params.svg, 'utf-8');
        if(params.parameters.exportformat === 'jpg' || params.parameters.exportformat === 'jpeg') {
            im.convert ([path.resolve(__dirname, 'tmp.svg'), path.resolve(__dirname, 'tmp.jpg')], function (err, stdout) {
                if(!err) {
                    res.end (fs.readFileSync(path.resolve(__dirname, 'tmp.jpg')));
                } else {
                    console.log (err);
                }
            });
        } else {
            fs.createReadStream(path.resolve(__dirname, 'tmp.svg'))
                .pipe(inkscape).pipe (res);    
        }
    } else {
        /**
         * When the exportAction is save, we need to just save the file to a specified path. The same method above is used to convert, but instead of 
         * piping to the response we pipe it to a writeFileStream
         */
        fs.writeFileSync (__dirname + '/tmp.svg', params.svg, 'utf-8');
        res.writeHead (200, {'Content-Type': 'text/html'});
        if(params.parameters.exportformat === 'jpg' || params.parameters.exportformat === 'jpeg') {
            im.convert ([path.resolve(__dirname, 'tmp.svg'), path.resolve(savePath, (fileNo ++) + '.jpg')], function (err, stdout) {
                if(!err) {
                    res.end ('{status: true}');
                } else {
                    console.log (err);
                    res.end ('{status: false}');
                }
            });
        } else {
            fs.createReadStream(path.resolve(__dirname, 'tmp.svg'))
                .pipe(inkscape).pipe (fs.createWriteStream(savePath + '/' + (fileNo ++) + '.' + params.parameters.exportformat));    
                res.end ('{status: true}');
        }
    }
}
/**
 * parseParams function is used to convert the parameters object to an Object.
 */
function parseParams (paramsObject) {
    console.log (paramsObject);
    var returnedObj = {},
        params = paramsObject.parameters.replace(/\|/g, '&');
        
    returnedObj.svg = paramsObject.stream;
    returnedObj.srcType = paramsObject.stream_type;
    returnedObj.bgColor = paramsObject.meta_bgColor;
    returnedObj.bgAlpha = paramsObject.meta_bgAlpha;
    returnedObj.DOMID = paramsObject.meta_DOMId;
    returnedObj.width = +paramsObject.meta_width;
    returnedObj.height = +paramsObject.meta_height;

    returnedObj.parameters = require('querystring').parse(params);

    return returnedObj;
}