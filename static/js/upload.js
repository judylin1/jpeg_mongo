$(function () {
  var timerId;

  function setTimer() {
    timerId = setInterval(function () {
      if ($('#userFileInput').val() !== '') {
        clearInterval(timerId);
        $('#uploadForm').submit();
      }
    }, 500);
  }

  setTimer();

  $('#uploadForm').submit(function () {
    status('0%');
    var formData = new FormData();
    var files = document.getElementById('userFileInput').files;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      formData.append('userFile', file, file.name);
    }
    //formData.append('userFile', file);
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType('application/json');
    xhr.open('post', '/api/upload', true);
    xhr.onerror = function (e) {
      status('error while trying to upload');
    };
    xhr.onload = function () {
      $('#userFileInput').val('');
      var resJson = JSON.parse(xhr.responseText);
      setTimer();
      if (resJson.success) {
        status('All files have been uploaded and optimised successfully');
        success();
        document.getElementById('image-uploaded').className = '';
      }
    };
    xhr.send(formData);
    return false; // no refresh
  });
  function status(message) {
    $('#status').text(message);
  };
  function success() {
    document.getElementById('success').className = '';
  };
});

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object

  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0, f; f = files[i]; i++) {
    // Only process image files.
    if (!f.type.match('image.*')) {
      continue;
    }
    var reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function (theFile) {
      return function (e) {
        // Render thumbnail.
        var span = document.createElement('span');
        span.innerHTML = ['<img class="thumb" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join('');
        document.getElementById('files').insertBefore(span, null);
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
}

document.getElementById('userFileInput').addEventListener('change', handleFileSelect, false);
