#!/bin/bash
# Set up Emscripten environment settings
source /opt/emsdk/emsdk_env.sh
# Then run whatever was passed as our command
exec "$@"
