/*
 * Setup
 */
var TIFFPATH = '/tiffs';
var PNGPATH = '/pngs';
const THUMB_X_SIZE = 512;

var initialized = false;

var GDALOpen,
  GDALClose,
  GDALGetRasterCount,
  GDALGetRasterXSize,
  GDALGetRasterYSize,
  GDALGetRasterBand,
  GDALGetRasterDataType,
  GDALGetDataTypeName,
  GDALGetDataTypeSizeBytes,
  GDALGetDataTypeByName,
  GDALDatasetRasterIO,
  GDALTranslate,
  GDALTranslateOptionsNew,
  GDALTranslateOptionsFree,
  CSLCount;

// Set up Module object for gdal.js to populate. Emscripten sets up its compiled
// code to look for a Module object in the global scope. If found, it reads runtime
// configuration from the existing object, and then further populates that object
// with other helpful functionality (e.g. ccall() and cwrap(), which are used in
// the onRuntimeInitialized callback, below).
var Module = {
  'print': function(text) { console.log('stdout: ' + text); },
  'printErr': function(text) { console.log('stderr: ' + text); },
  // Optimized builds contain a .js.mem file which is loaded asynchronously;
  // this waits until that has finished before performing further setup.
  'onRuntimeInitialized': function() {
    // Initialize GDAL
    Module.ccall('GDALAllRegister', null, [], []);

    // Set up JS proxy functions
    // Note that JS Number types are used to represent pointers, which means that
    // any time we want to pass a pointer to an object, such as in GDALOpen, which in
    // C returns a pointer to a GDALDataset, we need to use 'number'.
    GDALOpen = Module.cwrap('GDALOpen', 'number', ['string', 'number']);
    GDALClose = Module.cwrap('GDALClose', 'number', ['number']);
    GDALGetRasterBand = Module.cwrap('GDALGetRasterBand', 'number', ['number', 'number']);
    GDALGetDataTypeSizeBytes = Module.cwrap('GDALGetDataTypeSizeBytes', 'number', ['number']);
    GDALGetDataTypeName = Module.cwrap('GDALGetDataTypeName', 'string', ['number']);
    GDALGetRasterDataType = Module.cwrap('GDALGetRasterDataType', 'number', ['number']);
    GDALGetRasterCount = Module.cwrap('GDALGetRasterCount', 'number', ['number']);
    GDALGetRasterXSize = Module.cwrap('GDALGetRasterXSize', 'number', ['number']);
    GDALGetRasterYSize = Module.cwrap('GDALGetRasterYSize', 'number', ['number']);
    // Params:
    //  1. Output path
    //  2. Pointer to a GDALDataset
    //  3. Pointer to a GDALTranslateOptions
    //  4. Int to use for error reporting
    // Returns a pointer to a new GDAL Dataset
    GDALTranslate = Module.cwrap('GDALTranslate', 'number', ['string', 'number', 'number', 'number']);
    // Params: array of option strings as to gdal_translate; pointer to a struct that should be null.
    GDALTranslateOptionsNew = Module.cwrap('GDALTranslateOptionsNew', 'number', ['number', 'number']);
    GDALTranslateOptionsFree = Module.cwrap('GDALTranslateOptionsFree', 'number', ['number']);

    GDALGetDataTypeByName = Module.cwrap('GDALGetDataTypeByName', 'number', ['string']);
    GDALDatasetRasterIO = Module.cwrap('GDALDatasetRasterIO', 'number', [
      'number', // GDALDatasetH
      'number', // GF_READ or GF_WRITE
      'number', // nXOff
      'number', // nYOff
      'number', // nXSize
      'number', // nYSize
      'number', // pData
      'number', // nBufXSize
      'number', // nBufYSize
      'number', // eBufType
      'number', // nBandCount
      'number', // panBandMap
      'number', // nPixelSpace
      'number', // nLineSpace
      'number', // nBandSpace
      'number', // psExtraArg
    ]);

    CSLCount = Module.cwrap('CSLCount', 'number', ['number']);
    // Create a "directory" where user-selected files will be placed
    FS.mkdir(TIFFPATH);
    FS.mkdir(PNGPATH);
    initialized = true;
  }
};

// Load gdal.js. This will populate the Module object, and then call
// Module.onRuntimeInitialized() when it is ready for user code to interact with it.
importScripts('gdal.js');

/*
 * Logic
 */
// Use GDAL functions to translate file into PNG format
// @param files a FileList object as returned by a file input's .files field
function translateTiff(files) {
  // Make GeoTiffs available to GDAL in the virtual filesystem that it lives inside
  FS.mount(WORKERFS, {
    files: files
  }, TIFFPATH);

  // Create a GDAL Dataset
  // TODO: Dynamically adjust Module['TOTAL_MEMORY'] based on incoming file size
  var dataset = GDALOpen(TIFFPATH + '/' + files[0].name);
  var bandCount = GDALGetRasterCount(dataset);
  // TODO: Dynamically adjust the band output based on the band count
  // Things get a bit ugly passing string arrays to C++ functions. Bear with me.
  var translateOptions = [
    '-ot', 'Byte',
    '-of', 'PNG',
    '-outsize', THUMB_X_SIZE.toString(), '0',
    '-r', 'nearest',
    '-scale'
  ];
  // Dynamically adjust band output based on availability
  for (var i = 1; i <= 3 && i <= bandCount; i++) {
    translateOptions.push('-b');
    translateOptions.push(i.toString());
  }
  // So first, we need to allocate Emscripten heap space sufficient to store each string
  // as a null-terminated C string.
  var ptrsArray = translateOptions.map(function(str) {
    return Module._malloc(Module.lengthBytesUTF8(str) + 1);  // +1 for the null terminator byte
  });

  // In addition to each individual argument being null-terminated, the GDAL docs specify that
  // GDALTranslateOptionsNew take its options passed in as a null-terminated array of pointers,
  // so we have to add on a null (0) byte at the end.
  ptrsArray.push(0);
  // Because the C function signature is char **, we'll eventually need to get a pointer to the list of
  // pointers, so we're going to prepare by storing the pointers as a typed array so that we can
  // more easily copy it into heap space later.
  var strPtrs = Uint32Array.from(ptrsArray);

  // Next, we need to write each string from the JS string array into the Emscripten heap space
  // we've allocated for it.
  translateOptions.forEach(function(str, i) {
    Module.stringToUTF8(str, strPtrs[i], Module.lengthBytesUTF8(str) + 1);
  });

  // Now, as mentioned above, we also need to copy the pointer array itself into heap space.
  var ptrOffset = Module._malloc(strPtrs.length * strPtrs.BYTES_PER_ELEMENT);
  Module.HEAPU32.set(strPtrs, ptrOffset / strPtrs.BYTES_PER_ELEMENT);
  // Whew, all finished. ptrOffset is now the address of the start of the list of pointers in
  // Emscripten heap space. Each pointer identifies the address of the start of a parameter
  // string, also stored in heap space. This is the direct equivalent of a char **, which is what
  // GDALTranslateOptionsNew requires.
  var translateOptionsPtr = GDALTranslateOptionsNew(ptrOffset, null);
  // Now that we have our translate options, we need to make a file location to hold the output.
  var pngFilePath = PNGPATH + '/thumb.png';
  // And then we can kick off the actual translation process.
  var pngDataset = GDALTranslate(pngFilePath, dataset, translateOptionsPtr, null);

  // Close out the output dataset before reading from it.
  GDALClose(pngDataset);
  // Read the output dataset (which is a PNG image) and send it back to the caller.
  postMessage({ type: 'thumbnail', payload: FS.readFile(pngFilePath, { encoding: 'binary' }) });

  // Now cleanup
  GDALClose(dataset);
  FS.unmount(TIFFPATH);
  FS.unlink(pngFilePath);
  // TODO this results in "Invalid argument"
  //FS.unmount(PNGPATH);
  ptrsArray.pop(); // Remove 0 terminator from the end; we don't want to free() this.
  strPtrs.forEach(function(ptr) { Module._free(ptr); });
  Module._free(ptrOffset);

  // Deallocate TranslateOptions
  GDALTranslateOptionsFree(translateOptionsPtr);
}

function getPixelValues(files, x, y) {
  // Make GeoTiffs available to GDAL in the virtual filesystem that it lives inside
  FS.mount(WORKERFS, {
    files: files
  }, TIFFPATH);

  // Create a GDAL Dataset
  const dataset = GDALOpen(TIFFPATH + '/' + files[0].name, 0);
  const bandCount = GDALGetRasterCount(dataset);

  // Create an array of the band data type to receive pixel values.
  const band1 = GDALGetRasterBand(dataset, 1);
  const band1Dt = GDALGetRasterDataType(band1);
  const band1DtBytes = GDALGetDataTypeSizeBytes(band1Dt);

  const pixDataDest = Module._malloc(bandCount * band1DtBytes);

  // Transform thumbnail coordinates to image coordinates.
  // The thumbnail is always 512 x Y. So we need to figure out what Y is and then
  // transform both coordinates.
  const dsXSize = GDALGetRasterXSize(dataset);
  const dsYSize = GDALGetRasterYSize(dataset);
  const thumbYSize = (THUMB_X_SIZE / dsXSize) * dsYSize;

  const dsXPix = Math.floor((dsXSize / THUMB_X_SIZE) * x);
  const dsYPix = Math.floor((dsYSize / thumbYSize) * y);
  // Read from the raster
  // https://gdal.org/api/gdaldataset_cpp.html#_CPPv4N11GDALDataset8RasterIOE10GDALRWFlagiiiiPvii12GDALDataTypeiPi8GSpacing8GSpacing8GSpacingP20GDALRasterIOExtraArg
  GDALDatasetRasterIO(
    dataset,
    0, // GF_READ
    dsXPix, // nXOff
    dsYPix, // nYOff
    1, // nXSize
    1, // nYSize
    pixDataDest, // pData
    1, // nBufXSize
    1, // nBufYSize
    band1Dt, // eBufType
    bandCount, // nBandCount
    0, // panBandMap
    0, // nPixelSpace
    0, // nLineSpace
    0, // nBandSpace
    0, // psExtraArg
  );

  const band1DtName = GDALGetDataTypeName(band1Dt);
  console.log('band1 Datatype', band1DtName);
  const memView =
    band1DtName === 'Byte' ? Module.HEAPU8 :
      band1DtName === 'UInt16' ? Module.HEAPU16 :
        band1DtName === 'Int16' ? Module.HEAP16 :
          band1DtName === 'UInt32' ? Module.HEAPU32 :
            band1DtName === 'Int32' ? Module.HEAP32 :
              band1DtName === 'Float32' ? Module.HEAPF32 :
                band1DtName === 'Float64' ? Module.HEAPF64 : Module.HEAPF64;
  const pixValues = Array.from(memView.subarray(pixDataDest / band1DtBytes, pixDataDest / band1DtBytes + bandCount));
  postMessage({ type: 'click', payload: pixValues });


  Module._free(pixDataDest);
  GDALClose(dataset);
  FS.unmount(TIFFPATH);

}

// Assume that all incoming messages are FileLists of GeoTiffs and inspect them.
onmessage = function(msg) {
  if (!initialized) {
    console.log('Runtime not initialized yet, try again');
    return;
  }
  if (msg.data.type === 'thumbnail') {
    translateTiff(msg.data.payload);
  }
  if (msg.data.type === 'click') {
    const payload = msg.data.payload;
    getPixelValues(payload.files, payload.x, payload.y);
  }
};
