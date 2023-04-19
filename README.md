GDAL JS
==============
An [Emscripten](https://github.com/kripken/emscripten) port of [GDAL](http://www.gdal.org) 2.4.

Installation
---------------
```
npm install gdal-js
```

Usage
---------------
*Caution!* It is strongly recommended to run this code inside of a web worker.
To see complete examples for how to do this, checkout the `examples` directory.
From simplest to most complex, these are:

1. `inspect_geotiff`
2. `inspect_vector`
3. `map_extent`
4. `thumbnail`
5. `thumbnail_map`
6. `tile_tiff`

If you want to use GDAL from within a Node application, you are probably looking
for [https://www.npmjs.com/package/gdal](https://www.npmjs.com/package/gdal).

This library exports the following GDAL functions:
- CSLCount
- GDALSetCacheMax
- GDALAllRegister
- GDALOpen
- GDALOpenEx
- GDALClose
- GDALGetDriverByName
- GDALCreate
- GDALCreateCopy
- GDALGetRasterXSize
- GDALGetRasterYSize
- GDALGetRasterCount
- GDALGetRasterDataType
- GDALGetRasterBand
- GDALGetRasterStatistics
- GDALGetRasterMinimum
- GDALGetRasterMaximum
- GDALGetRasterNoDataValue
- GDALGetDataTypeSizeBytes
- GDALGetDataTypeByName
- GDALGetDataTypeName
- GDALRasterIO
- GDALRasterIOEx
- GDALReadBlock
- GDALWriteBlock
- GDALGetBlockSize
- GDALGetActualBlockSize
- GDALGetProjectionRef
- GDALSetProjection
- GDALGetGeoTransform
- GDALSetGeoTransform
- OSRNewSpatialReference
- OSRDestroySpatialReference
- OSRImportFromEPSG
- OCTNewCoordinateTransformation
- OCTDestroyCoordinateTransformation
- OCTTransform
- GDALCreateGenImgProjTransformer
- GDALDestroyGenImgProjTransformer
- GDALGenImgProjTransform
- GDALDestroyGenImgProjTransformer
- GDALSuggestedWarpOutput
- GDALTranslate
- GDALTranslateOptionsNew
- GDALTranslateOptionsFree
- GDALWarpAppOptionsNew
- GDALWarpAppOptionsSetProgress
- GDALWarpAppOptionsFree
- GDALWarp
- GDALBuildVRTOptionsNew
- GDALBuildVRTOptionsFree
- GDALBuildVRT
- GDALReprojectImage
- CPLError
- CPLSetErrorHandler
- CPLQuietErrorHandler
- CPLErrorReset
- CPLGetLastErrorMsg
- CPLGetLastErrorNo
- CPLGetLastErrorType
- GDALRasterize
- GDALRasterizeOptionsNew
- GDALRasterizeOptionsFree
- GDALDEMProcessing
- GDALDEMProcessingOptionsNew
- GDALDEMProcessingOptionsFree
- GDALDatasetGetLayer
- GDALDatasetGetLayerByName
- GDALDatasetGetLayerCount
- GDALDatasetExecuteSQL
- GDALRasterIO
- GDALRasterIOEx
- GDALDatasetRasterIO
- GDALDatasetRasterIOEx
- GDALReadBlock
- GDALWriteBlock
- GDALGetBlockSize
- GDALGetActualBlockSize
- OGR\_L\_GetNextFeature
- OGR\_L\_GetExtent
- OGR\_L\_GetLayerDefn
- OGR\_L\_ResetReading
- OGR\_L\_GetName
- OGR\_F\_GetFieldAsInteger
- OGR\_F\_GetFieldAsInteger64
- OGR\_F\_GetFieldAsDouble
- OGR\_F\_GetFieldAsString
- OGR\_F\_GetFieldAsBinary
- OGR\_F\_GetFieldAsDateTime
- OGR\_F\_GetFieldAsDateTimeEx
- OGR\_F\_GetFieldAsDoubleList
- OGR\_F\_GetFieldAsIntegerList
- OGR\_F\_GetFieldAsInteger64List
- OGR\_F\_GetFieldAsStringList
- OGR\_F\_GetGeometryRef
- OGR\_F\_Destroy
- OGR\_FD\_GetFieldCount
- OGR\_FD\_GetFieldDefn
- OGR\_Fld\_GetType
- OGR\_Fld\_GetNameRef
- OGR\_G\_GetGeometryType
- OGR\_G\_GetX
- OGR\_G\_GetY
- OGR\_G\_GetPoint
- OGR\_G\_GetPoints
- OGR\_G\_GetPointCount
- OGR\_G\_GetEnvelope
- OGR\_G\_GetSpatialReference
- OGR\_G\_Intersects
- OGR\_G\_Simplify
- OGR\_G\_Touches
- OGR\_G\_Transform
- OGR\_G\_Within
- OGR\_G\_ExportToGML
- OGR\_G\_ExportToJson
- OGR\_G\_ExportToJsonEx
- OGR\_G\_ExportToKML
- OGR\_G\_ExportToWkb
- OGR\_G\_ExportToWkt
- GDALVectorTranslate (ogr2ogr)
- GDALVectorTranslateOptionsFree
- GDALVectorTranslateOptionsNew
- GDALVectorTranslateOptionsSetProgress
- GDALPolygonize
- GDALFPolygonize
- GDALSieveFilter

For documentation of these functions' behavior, please see the
[GDAL documentation](http://www.gdal.org/gdal_8h.html)

In order to limit build size, GDAL is currently built with raster support for GeoTIFFs, PNGs, and JPEGs only.

Developing
-----------
1. Install Docker
2. Run `./scripts/setup`, which will build the Docker container.
3. Run `./scripts/make gdal`. The make script just calls `make` from inside the Docker container.
4. `./scripts/make clean` works as expected.
5. To package up a release, run `./scripts/make VERSION=<number> release`

