var gdbInspector = new Worker('worker.js');

function inspectFiles() {
    var files = document.querySelector('#gdb-select').files;
    gdbInspector.postMessage(files);
}

gdbInspector.onmessage = function (evt) {
    console.log(evt.data);
};
