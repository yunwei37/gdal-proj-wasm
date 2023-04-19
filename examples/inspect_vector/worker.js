/*
 * Setup
 */
var DATAPATH = '/data';

var initialized = false;

var GDALOpenEx,
    GDALClose,
    GDALDatasetGetLayerCount,
    GDALDatasetGetLayer,
    OGR_L_GetLayerDefn,
    OGR_L_ResetReading,
    OGR_L_GetNextFeature,
    OGR_FD_GetFieldCount,
    OGR_FD_GetFieldDefn,
    OGR_Fld_GetType,
    OGR_Fld_GetNameRef,
    OGR_F_GetFieldAsInteger,
    OGR_F_GetFieldAsInteger64,
    OGR_F_GetFieldAsString,
    OGR_F_GetFieldAsDouble,
    OGR_F_GetGeometryRef,
    OGR_G_GetGeometryType,
    OGR_G_GetX,
    OGR_G_GetY,
    OGR_G_ExportToJson,
    GDALGetRasterCount,
    GDALGetRasterXSize,
    GDALGetRasterYSize,
    GDALGetProjectionRef,
    GDALGetGeoTransform,
    CPLQuietErrorHandler,
    CPLSetErrorHandler,
    CPLGetLastErrorMsg,
    CPLGetLastErrorNo,
    CPLGetLastErrorType,
    CPLErrorReset;

// Set up Module object for gdal.js to populate. Emscripten sets up its compiled
// code to look for a Module object in the global scope. If found, it reads runtime
// configuration from the existing object, and then further populates that object
// with other helpful functionality (e.g. ccall() and cwrap(), which are used in
// the onRuntimeInitialized callback, below).
var Module = {
    'print': function (text) { console.log('stdout: ' + text); },
    'printErr': function (text) { console.log('stderr: ' + text); },
    // Optimized builds contain a .js.mem file which is loaded asynchronously;
    // this waits until that has finished before performing further setup.
    'onRuntimeInitialized': function () {
        // Initialize GDAL
        Module.ccall('GDALAllRegister', null, [], []);

        // Set up JS proxy functions
        // Note that JS Number types are used to represent pointers, which means that
        // any time we want to pass a pointer to an object, such as in GDALOpen, which in
        // C returns a pointer to a GDALDataset, we need to use 'number'.
        // GDAL_OF_VECTOR is the second parameter and its value is 4
        GDALOpenEx = Module.cwrap('GDALOpenEx', 'number', ['string', 'number', null, null, null]);
        GDALClose = Module.cwrap('GDALClose', null, ['number']);
        GDALDatasetGetLayerCount = Module.cwrap('GDALDatasetGetLayerCount', 'number', ['number']);
        GDALDatasetGetLayer = Module.cwrap('GDALDatasetGetLayer', 'number', ['number', 'number']);
        OGR_L_GetLayerDefn = Module.cwrap('OGR_L_GetLayerDefn', 'number', ['number']);
        OGR_L_ResetReading = Module.cwrap('OGR_L_ResetReading', 'number', []);
        OGR_L_GetNextFeature = Module.cwrap('OGR_L_GetNextFeature', 'number', ['number']);
        OGR_FD_GetFieldCount = Module.cwrap('OGR_FD_GetFieldCount', 'number', ['number']);
        OGR_FD_GetFieldDefn = Module.cwrap('OGR_FD_GetFieldDefn', 'number', ['number', 'number']);
        OGR_Fld_GetType = Module.cwrap('OGR_Fld_GetType', 'number', ['number']);
        OGR_Fld_GetNameRef = Module.cwrap('OGR_Fld_GetNameRef', 'string', ['number']);
        OGR_F_GetFieldAsInteger = Module.cwrap('OGR_F_GetFieldAsInteger', 'number', ['number', 'number']);
        OGR_F_GetFieldAsInteger64 = Module.cwrap('OGR_F_GetFieldAsInteger64', 'number', ['number', 'number']);
        OGR_F_GetFieldAsString = Module.cwrap('OGR_F_GetFieldAsString', 'string', ['number', 'number']);
        OGR_F_GetFieldAsDouble = Module.cwrap('OGR_F_GetFieldAsDouble', 'number', ['number', 'number']);
        OGR_F_GetGeometryRef = Module.cwrap('OGR_F_GetGeometryRef', 'number', ['number']);
        OGR_G_GetGeometryType = Module.cwrap('OGR_G_GetGeometryType', 'number', ['number']);
        OGR_G_GetX = Module.cwrap('OGR_G_GetX', 'number', ['number', 'number']);
        OGR_G_GetY = Module.cwrap('OGR_G_GetY', 'number', ['number', 'number']);
        OGR_G_ExportToJson = Module.cwrap('OGR_G_ExportToJson', 'string', ['number']);
        CPLErrorReset = Module.cwrap('CPLErrorReset', null, []);
        CPLSetErrorHandler = Module.cwrap('CPLSetErrorHandler', 'number', ['number']);
        CPLQuietErrorHandler = Module.cwrap('CPLQuietErrorHandler', null, ['number', 'number', 'string']);
        var cplQuietFnPtr = addFunction(CPLQuietErrorHandler, 'viii');
        CPLGetLastErrorNo = Module.cwrap('CPLGetLastErrorNo', 'number', []);
        CPLGetLastErrorMsg = Module.cwrap('CPLGetLastErrorMsg', 'string', []);
        CPLGetLastErrorType = Module.cwrap('CPLGetLastErrorType', 'number', []);

        CPLSetErrorHandler(cplQuietFnPtr);
        // Create a "directory" where user-selected files will be placed
        FS.mkdir(DATAPATH);
        initialized = true;
    }
};

// Load gdal.js. This will populate the Module object, and then call
// Module.onRuntimeInitialized() when it is ready for user code to interact with it.
importScripts('gdal.js');

/*
 * Logic
 */
// Use GDAL functions to provide information about a list of files.
// @param files a FileList object as returned by a file input's .files field
function inspectVectorDs(files) {
    // Make vector files available to GDAL in the virtual filesystem that it lives inside
    FS.mount(WORKERFS, {
        files: files
    }, DATAPATH);

    var results = [];
    CPLErrorReset();
    for (var i = 0; i < files.length; i++) {
        var dataset = GDALOpenEx(DATAPATH + '/' + files[i].name, 4);

        if (CPLGetLastErrorNo() !== 0) {
            console.log('Error occurred opening dataset');
            console.log('Error message: ', CPLGetLastErrorMsg());
            console.log('Error number: ', CPLGetLastErrorNo());
            console.log('Resetting errors');
            CPLErrorReset();
            continue;
        }

        var layer_count = GDALDatasetGetLayerCount(dataset);

        for (var j = 0; j < layer_count; j++) {
            var layer = GDALDatasetGetLayer(dataset, j);
            var defn = OGR_L_GetLayerDefn(layer);

            OGR_L_ResetReading(layer);

            var feature;
            var field_count = OGR_FD_GetFieldCount(defn);

            var layer_results = [];

            while (feature = OGR_L_GetNextFeature(layer)) {
                var temp_feature = {
                    properties: {},
                    geometry: {},
                };
                for (var i = 0; i < field_count; i++) {
                    var field_defn = OGR_FD_GetFieldDefn(defn, i);
                    var value;
                    var name = OGR_Fld_GetNameRef(field_defn);

                    switch (OGR_Fld_GetType(field_defn)) {
                        case 0:
                            value = OGR_F_GetFieldAsInteger(feature, i)
                            break;
                        case 2:
                            value = OGR_F_GetFieldAsDouble(feature, i)
                            break;
                        case 4:
                            value = OGR_F_GetFieldAsString(feature, i)
                            break;
                        case 12:
                            value = OGR_F_GetFieldAsInteger(feature, i)
                            break;
                        default:
                            value = OGR_F_GetFieldAsString(feature, i)
                            break;
                    }

                    temp_feature.properties[name] = value;
                }

                var geometry = OGR_F_GetGeometryRef(feature);
                var geom_result = OGR_G_ExportToJson(geometry);

                temp_feature.geometry = geom_result;
                layer_results.push(temp_feature);
            }

            results.push(layer_results);

        }

        GDALClose(dataset);
    }

    // Now pass this back to the calling thread, which is presumably where we'd want to handle it:
    postMessage(results);

    // And cleanup
    FS.unmount(DATAPATH);
}

// Assume that all incoming messages are FileLists of vector datasets and inspect them.
onmessage = function (msg) {
    if (!initialized) {
        console.log('Runtime not initialized yet, try again');
        return;
    }
    inspectVectorDs(msg.data);
};
