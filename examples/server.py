#!/usr/bin/env python
from __future__ import print_function
from future import standard_library
import http.server

standard_library.install_aliases()

port = 8000
print("Running on port %d" % port)

http.server.SimpleHTTPRequestHandler.extensions_map['.wasm'] = 'application/wasm'
httpd = http.server.HTTPServer(
    ('0.0.0.0', port),
    http.server.SimpleHTTPRequestHandler)

httpd.serve_forever()
