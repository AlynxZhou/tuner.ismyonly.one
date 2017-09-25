// Generated by CoffeeScript 2.0.0-beta4
(function() {
  var analyser, animateID, audioCtx, autoCorrelate, checkAudioContext, checkGetUserMedia, checkRequestAnimationFrame, detectPitch, heading, log;

  log = console.log.bind(console);

  checkAudioContext = function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
    return window.AudioContext != null;
  };

  checkGetUserMedia = function() {
    if (navigator.mediaDevices == null) {
      navigator.mediaDevices = {};
    }
    if (navigator.mediaDevices.getUserMedia == null) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        var getUserMedia;
        getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.oGetUserMedia || navigator.msGetUserMedia;
        if (getUserMedia) {
          return void 0;
        } else {
          return new Promise(function(resolve, reject) {
            return getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
      };
    }
    return navigator.mediaDevices.getUserMedia != null;
  };

  checkRequestAnimationFrame = function() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
      return window.setTimeout(callback, 1000 / 60);
    };
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || function(animateId) {
      return window.clearTimeout(animateId);
    };
    return (window.requestAnimationFrame != null) && (window.cancelAnimationFrame != null);
  };

  audioCtx = new AudioContext();

  analyser = audioCtx.createAnalyser();

  animateID = void 0;

  autoCorrelate = function(buffer, sampleRate) {
    var bestCorrelation, bestOffset, correlation, freq, i, j, k, maxSamples, minSamples, noticeableCorrelation, offset, ref, ref1, ref2;
    minSamples = 4;
    maxSamples = buffer.length / 2;
    noticeableCorrelation = 0.003;
    bestOffset = -1;
    bestCorrelation = 0;
    freq = -1;
    for (offset = j = ref = minSamples, ref1 = maxSamples; ref <= ref1 ? j <= ref1 : j >= ref1; offset = ref <= ref1 ? ++j : --j) {
      correlation = 0;
      for (i = k = 0, ref2 = maxSamples; 0 <= ref2 ? k < ref2 : k > ref2; i = 0 <= ref2 ? ++k : --k) {
        correlation += buffer[i] * buffer[i + offset];
      }
      correlation /= maxSamples + offset;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    if (bestCorrelation > noticeableCorrelation) {
      freq = sampleRate / bestOffset;
    }
    return freq;
  };

  detectPitch = function() {
    var bufferLength, dataBuffer, freq;
    analyser.fftSize = 4096;
    bufferLength = analyser.fftSize;
    dataBuffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataBuffer);
    freq = autoCorrelate(dataBuffer, audioCtx.sampleRate);
    if (freq > 0) {
      updateDisplay(freq);
    } else {
      clearDisplay();
    }
    return animateID = requestAnimationFrame(detectPitch);
  };

  navigator.mediaDevices.getUserMedia({
    "audio": true
  }).then(function(stream) {
    var source;
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    return detectPitch();
  }).catch(function(error) {
    log(error);
    if (animateID != null) {
      return cancelAnimationFrame(animateID);
    }
  });

  heading = document.getElementById("freq");

  // updateDisplay = (freq) ->
//   heading.innerHTML = Math.floor(freq) + " Hz"
// clearDisplay = () ->
//   heading.innerHTML = "--- Hz"

}).call(this);