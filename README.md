# FusionCharts Node.js Exporter

## Prerequisites
    1. Requires inkscape to be installed and to be present in the $PATH.
    2. Requires ImageMagick to be installed.
## Installation
```
$ cd path/to/nodejsexporter
$ npm install
```

## Server Configuration
The server configuration is present in the config.json file in the root path. Edit this file to change the config. Currently it contains
* port => The port on which the server needs to be started.
* fileSavePath => The path for the saved image files when the `exportAction` is save. (Note: Make sure that the server has write permissions to this folder)

## Running the server
```
$ cd path/to/nodejsexporter/src
$ node index.js
```