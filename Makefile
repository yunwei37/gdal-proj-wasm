PROJ4 = proj4
GDAL = gdal
EMMAKE ?= emmake
EMCC ?= emcc
EMCONFIGURE ?= emconfigure
EMCONFIGURE_JS ?= 0
GDAL_EMCC_CFLAGS := -O3 -s USE_PTHREADS=1 -pthread -pthreads
# -fPIC allows PROJ4 to be linked successfully when using MAIN_MODULE=2 in GDAL
PROJ_EMCC_CFLAGS := -O3 -fPIC -s USE_PTHREADS=1 -pthread -pthreads
EXPORTED_FUNCTIONS = "[\
  '_malloc',\
  '_free',\
  '_CSLCount',\
  '_GDALSetCacheMax',\
  '_GDALAllRegister',\
  '_GDALOpen',\
  '_GDALOpenEx',\
  '_GDALClose',\
  '_GDALGetDriverByName',\
  '_GDALCreate',\
  '_GDALCreateCopy',\
  '_GDALGetRasterXSize',\
  '_GDALGetRasterYSize',\
  '_GDALGetRasterCount',\
  '_GDALGetRasterDataType',\
  '_GDALGetRasterBand',\
  '_GDALGetRasterStatistics',\
  '_GDALGetRasterMinimum',\
  '_GDALGetRasterMaximum',\
  '_GDALGetRasterNoDataValue',\
  '_GDALGetDataTypeSizeBytes',\
  '_GDALGetDataTypeByName',\
  '_GDALGetDataTypeName',\
  '_GDALRasterIO',\
  '_GDALRasterIOEx',\
  '_GDALReadBlock',\
  '_GDALWriteBlock',\
  '_GDALGetBlockSize',\
  '_GDALGetActualBlockSize',\
  '_GDALGetProjectionRef',\
  '_GDALSetProjection',\
  '_GDALGetGeoTransform',\
  '_GDALSetGeoTransform',\
  '_OSRNewSpatialReference',\
  '_OSRDestroySpatialReference',\
  '_OSRImportFromEPSG',\
  '_OCTNewCoordinateTransformation',\
  '_OCTDestroyCoordinateTransformation',\
  '_OCTTransform',\
  '_GDALCreateGenImgProjTransformer',\
  '_GDALDestroyGenImgProjTransformer',\
  '_GDALGenImgProjTransform',\
  '_GDALDestroyGenImgProjTransformer',\
  '_GDALSuggestedWarpOutput',\
  '_GDALTranslate',\
  '_GDALTranslateOptionsNew',\
  '_GDALTranslateOptionsFree',\
  '_GDALWarpAppOptionsNew',\
  '_GDALWarpAppOptionsSetProgress',\
  '_GDALWarpAppOptionsFree',\
  '_GDALWarp',\
  '_GDALBuildVRTOptionsNew',\
  '_GDALBuildVRTOptionsFree',\
  '_GDALBuildVRT',\
  '_GDALReprojectImage',\
  '_CPLError',\
  '_CPLSetErrorHandler',\
  '_CPLQuietErrorHandler',\
  '_CPLErrorReset',\
  '_CPLGetLastErrorMsg',\
  '_CPLGetLastErrorNo',\
  '_CPLGetLastErrorType',\
  '_GDALRasterize',\
  '_GDALRasterizeOptionsNew',\
  '_GDALRasterizeOptionsFree',\
  '_GDALDEMProcessing',\
  '_GDALDEMProcessingOptionsNew',\
  '_GDALDEMProcessingOptionsFree',\
  '_GDALDatasetGetLayer',\
  '_GDALDatasetGetLayerByName',\
  '_GDALDatasetGetLayerCount',\
  '_GDALDatasetExecuteSQL',\
  '_GDALDatasetRasterIO',\
  '_GDALDatasetRasterIOEx',\
  '_OGR_L_GetNextFeature',\
  '_OGR_L_GetExtent',\
  '_OGR_L_GetLayerDefn',\
  '_OGR_L_ResetReading',\
  '_OGR_L_GetName',\
  '_OGR_F_GetFieldAsInteger',\
  '_OGR_F_GetFieldAsInteger64',\
  '_OGR_F_GetFieldAsDouble',\
  '_OGR_F_GetFieldAsString',\
  '_OGR_F_GetFieldAsBinary',\
  '_OGR_F_GetFieldAsDateTime',\
  '_OGR_F_GetFieldAsDateTimeEx',\
  '_OGR_F_GetFieldAsDoubleList',\
  '_OGR_F_GetFieldAsIntegerList',\
  '_OGR_F_GetFieldAsInteger64List',\
  '_OGR_F_GetFieldAsStringList',\
  '_OGR_F_GetGeometryRef',\
  '_OGR_F_Destroy',\
  '_OGR_FD_GetFieldCount',\
  '_OGR_FD_GetFieldDefn',\
  '_OGR_Fld_GetType',\
  '_OGR_Fld_GetNameRef',\
  '_OGR_G_GetGeometryType',\
  '_OGR_G_GetX',\
  '_OGR_G_GetY',\
  '_OGR_G_GetPoint',\
  '_OGR_G_GetPoints',\
  '_OGR_G_GetPointCount',\
  '_OGR_G_GetEnvelope',\
  '_OGR_G_GetSpatialReference',\
  '_OGR_G_Intersects',\
  '_OGR_G_Simplify',\
  '_OGR_G_Set3D',\
  '_OGR_G_SetMeasured',\
  '_OGR_G_Touches',\
  '_OGR_G_Transform',\
  '_OGR_G_Within',\
  '_OGR_G_ExportToGML',\
  '_OGR_G_ExportToJson',\
  '_OGR_G_ExportToJsonEx',\
  '_OGR_G_ExportToKML',\
  '_OGR_G_ExportToWkb',\
  '_OGR_G_ExportToWkt',\
  '_GDALVectorTranslate',\
  '_GDALVectorTranslateOptionsFree',\
  '_GDALVectorTranslateOptionsNew',\
  '_GDALVectorTranslateOptionsSetProgress',\
  '_GDALPolygonize',\
  '_GDALFPolygonize',\
  '_GDALSieveFilter'\
]"

EXPORTED_RUNTIME_FUNCTIONS="[\
  'setValue',\
  'getValue',\
  'ccall',\
  'cwrap',\
  'stringToUTF8',\
  'lengthBytesUTF8',\
  'addFunction'\
]"

export EMCONFIGURE_JS

include gdal-configure.opt

.PHONY: clean release gdal proj4

########
# GDAL #
########
gdal: gdal.js

# See https://github.com/emscripten-core/emscripten/issues/6090 for why disabling errors on undefined is necessary
# I wasn't able to find an equivalent workaround to what was described in that thread using the GDAL build system.
# GDAL insists on using dlopen() even when it's compiled entirely statically, which causes Emscripten to throw an 
# error. Compiling using MAIN_MODULE=2 allows dlopen() to function correctly while maintaining other benefits of
# code elimination.
gdal.js: $(GDAL)/libgdal.a
	EMCC_CFLAGS="$(GDAL_EMCC_CFLAGS)" $(EMCC) $(GDAL)/libgdal.a $(PROJ4)/src/.libs/libproj.a -o gdal.js \
		-s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS) \
		-s EXPORTED_RUNTIME_METHODS=$(EXPORTED_RUNTIME_FUNCTIONS) \
		-s MAIN_MODULE=2 \
		-s ALLOW_MEMORY_GROWTH \
		-s INITIAL_MEMORY=256MB \
		-s MAXIMUM_MEMORY=2GB \
		-s FORCE_FILESYSTEM=1 \
		-s ALLOW_TABLE_GROWTH \
		-s WASM=1 \
		-lworkerfs.js \
		--preload-file $(GDAL)/data/pcs.csv@/usr/local/share/gdal/pcs.csv \
		--preload-file $(GDAL)/data/gcs.csv@/usr/local/share/gdal/gcs.csv \
		--preload-file $(GDAL)/data/gcs.override.csv@/usr/local/share/gdal/gcs.override.csv \
		--preload-file $(GDAL)/data/prime_meridian.csv@/usr/local/share/gdal/prime_meridian.csv \
		--preload-file $(GDAL)/data/unit_of_measure.csv@/usr/local/share/gdal/unit_of_measure.csv \
		--preload-file $(GDAL)/data/ellipsoid.csv@/usr/local/share/gdal/ellipsoid.csv \
		--preload-file $(GDAL)/data/coordinate_axis.csv@/usr/local/share/gdal/coordinate_axis.csv \
		--preload-file $(GDAL)/data/vertcs.override.csv@/usr/local/share/gdal/vertcs.override.csv \
		--preload-file $(GDAL)/data/vertcs.csv@/usr/local/share/gdal/vertcs.csv \
		--preload-file $(GDAL)/data/compdcs.csv@/usr/local/share/gdal/compdcs.csv \
		--preload-file $(GDAL)/data/geoccs.csv@/usr/local/share/gdal/geoccs.csv \
		--preload-file $(GDAL)/data/stateplane.csv@/usr/local/share/gdal/stateplane.csv


$(GDAL)/libgdal.a: $(PROJ4)/src/.libs/libproj.a $(GDAL)/config.status
	cd $(GDAL) && EMCC_CFLAGS="$(GDAL_EMCC_CFLAGS)" $(EMMAKE) make static-lib

# TODO: Pass the configure params more elegantly so that this uses the
# EMCONFIGURE variable
# Disables the "-Wno-limited-postlink-optimizations" warning because this warning causes one of
# GDAL's configure checks to fail because it assumes that success will result in zero-length
# output from the compiler, and printing a warning breaks that assumption.
$(GDAL)/config.status: $(GDAL)/configure
	cd $(GDAL) && EMCC_CFLAGS="-Wno-limited-postlink-optimizations" emconfigure ./configure $(GDAL_CONFIG_OPTIONS)

##########
# PROJ.4 #
##########
# Alias to easily remake PROJ.4
proj4: $(PROJ4)/src/.libs/libproj.a

$(PROJ4)/src/.libs/libproj.a: $(PROJ4)/config.status
	cd $(PROJ4) && EMCC_CFLAGS="$(PROJ_EMCC_CFLAGS)" $(EMMAKE) make

$(PROJ4)/config.status: $(PROJ4)/configure
	cd $(PROJ4) && $(EMCONFIGURE) ./configure --enable-shared=no --enable-static --without-mutex

$(PROJ4)/configure: $(PROJ4)/autogen.sh
	cd $(PROJ4) && ./autogen.sh

# There seems to be interference between a dependency on config.status specified
# in the original GDAL Makefile and the config.status rule above that causes
# `make clean` from the gdal folder to try to _build_ gdal before cleaning it.
clean:
	cd $(PROJ4) && git clean -X -d --force .
	cd $(GDAL) && git clean -X -d --force .
	rm -f gdal.wasm
	rm -f gdal.js
	rm -f gdal.js.mem
	rm -f gdal.data

##############
# Release    #
##############
release: $(VERSION).tar.gz $(VERSION).zip

$(VERSION).tar.gz $(VERSION).zip: dist/README dist/LICENSE.TXT dist/gdal.js dist/gdal.wasm dist/gdal.data
	tar czf $(VERSION).tar.gz dist
	zip -r $(VERSION).zip dist

dist/gdal.js dist/gdal.wasm dist/gdal.data: gdal.js
	cp gdal.js gdal.wasm gdal.data dist
