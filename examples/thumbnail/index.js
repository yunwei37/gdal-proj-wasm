var thumbnailer = new Worker('worker.js');

function makeThumbnail() {
  var files = document.querySelector('#geotiff-select').files;
  thumbnailer.postMessage({ type: 'thumbnail', payload: files });
}

thumbnailer.onmessage = function(evt) {
  if (evt.data.type === 'thumbnail') {
    displayImage(evt.data.payload);
  }
  if (evt.data.type === 'click') {
    displayPixelValues(evt.data.payload);
  }
};

function postClickCoordinates(evt) {
  var files = document.querySelector('#geotiff-select').files;
  thumbnailer.postMessage({ type: 'click', payload: { files: files, x: evt.offsetX, y: evt.offsetY } });
}

function displayImage(imageBytes) {
  var outputBlob = new Blob([imageBytes], { type: 'image/png' });
  var imgDisplay = document.querySelector('#thumbnail');
  imgDisplay.removeEventListener('click', postClickCoordinates);
  imgDisplay.addEventListener('click', postClickCoordinates);
  imgDisplay.src = window.URL.createObjectURL(outputBlob);

}

function displayPixelValues(bandValues) {
  console.log(bandValues);
}
