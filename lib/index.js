// Generated by CoffeeScript 2.0.0-beta4
(function() {
  var AudioProcessor, AudioVisualizer, audioProcessor, audioVisualizer, checkAudioContext, checkGetUserMedia, checkRequestAnimationFrame;

  AudioProcessor = class AudioProcessor {
    constructor() {
      this.initialize = this.initialize.bind(this);
      this.destroy = this.destroy.bind(this);
      this.fireFreqEvent = this.fireFreqEvent.bind(this);
      this.requestUserMedia = this.requestUserMedia.bind(this);
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      this.checkVisibilityApi();
      this.initialize();
    }

    initialize() {
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.animateId = null;
      this.stream = null;
      this.micSource = null;
      this.analyser.fftSize = 4096;
      this.hidden = null;
      this.visibilityChange = null;
      this.lastTime = 0;
      this.dataBuffer = new Float32Array(this.analyser.fftSize);
      document.addEventListener(this.visibilityChange, this.onVisibilityChange);
      return this.onVisibilityChange();
    }

    destroy() {
      if (this.animateId != null) {
        return cancelAnimationFrame(this.animateId);
      }
    }

    autoCorrelate(buffer, sampleRate) {
      var bestCorrelation, bestOffset, correlation, freq, i, j, k, maxSamples, minSamples, offset, ref, ref1, ref2;
      minSamples = 4;
      maxSamples = buffer.length / 2;
      bestOffset = -1;
      bestCorrelation = 0;
      freq = -1;
      for (offset = j = ref = maxSamples, ref1 = minSamples; ref <= ref1 ? j <= ref1 : j >= ref1; offset = ref <= ref1 ? ++j : --j) {
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
      return freq = sampleRate / bestOffset;
    }

    fireFreqEvent(time) {
      var event, freq, i, j, noticeableRms, ref, rms;
      if (time > this.lastTime + 128) {
        this.analyser.getFloatTimeDomainData(this.dataBuffer);
        rms = 0;
        freq = 0;
        noticeableRms = 0.008;
        for (i = j = 0, ref = this.dataBuffer.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          rms += this.dataBuffer[i] * this.dataBuffer[i];
        }
        rms = Math.sqrt(rms / this.dataBuffer.length);
        if (rms > noticeableRms) {
          freq = this.autoCorrelate(this.dataBuffer, this.audioCtx.sampleRate);
        }
        if (freq >= 32.7 && freq <= 8372) {
          // C1 - C8
          event = new CustomEvent("freqevent", {
            "detail": {
              "freq": freq
            }
          });
          dispatchEvent(event);
          this.lastTime = time;
        }
      }
      return requestAnimationFrame(this.fireFreqEvent);
    }

    requestUserMedia() {
      return navigator.mediaDevices.getUserMedia({
        "audio": true
      }).then((stream) => {
        this.stream = stream;
        this.micSource = this.audioCtx.createMediaStreamSource(this.stream);
        this.micSource.connect(this.analyser);
        return this.animateId = requestAnimationFrame(this.fireFreqEvent);
      }).catch((error) => {
        log(error);
        if (this.animateId != null) {
          return cancelAnimationFrame(this.animateId);
        }
      });
    }

    onVisibilityChange() {
      if (document[this.hidden]) {
        cancelAnimationFrame(this.animateId);
        this.animateId = null;
        if (this.stream != null) {
          this.stream.getAudioTracks().forEach(function(track) {
            if ("stop" in track) {
              return track.stop();
            }
          });
          if ("stop" in this.stream) {
            this.stream.stop();
          }
        }
        return this.stream = null;
      } else {
        return this.requestUserMedia();
      }
    }

    checkVisibilityApi() {
      if (document.hidden != null) {
        this.hidden = "hidden";
        this.visibilityChange = "visibilitychange";
      } else if (document.webkitHidden != null) {
        this.hidden = "webkitHidden";
        this.visibilityChange = "webkitvisibilitychange";
      } else if (document.mozHidden != null) {
        this.hidden = "mozHidden";
        this.visibilityChange = "mozvisibilitychange";
      } else if (document.oHidden != null) {
        this.hidden = "oHidden";
        this.visibilityChange = "ovisibilitychange";
      } else if (document.msHidden != null) {
        this.hidden = "msHidden";
        this.visibilityChange = "msvisibilitychange";
      }
      return document.hidden != null;
    }

  };

  AudioVisualizer = class AudioVisualizer {
    constructor() {
      this.initialize = this.initialize.bind(this);
      this.destroy = this.destroy.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onFreqEvent = this.onFreqEvent.bind(this);
      this.drawAll = this.drawAll.bind(this);
      this.drawBackground = this.drawBackground.bind(this);
      this.drawDial = this.drawDial.bind(this);
      this.drawOuterCircle = this.drawOuterCircle.bind(this);
      this.drawInnerCircle = this.drawInnerCircle.bind(this);
      this.drawSplit = this.drawSplit.bind(this);
      this.drawDialText = this.drawDialText.bind(this);
      this.drawPointer = this.drawPointer.bind(this);
      this.drawMid = this.drawMid.bind(this);
      this.initialize();
    }

    initialize() {
      this.notes = ["C", "#C", "D", "♭E", "E", "F", "#F", "G", "#G", "A", "♭B", "B"];
      this.div = document.getElementById("tunerDiv");
      // @canvas = document.createElement("canvas")
      this.canvas = document.getElementById("canvas");
      // @div.appendChild(@canvas)
      // @canvas.width = 480
      // @canvas.height = 480
      this.ctx = this.canvas.getContext("2d");
      this.note = "C";
      this.octave = 0;
      this.rotateAngle = 0;
      this.realRotateAngle = 0;
      this.loopColor = "rgba(255, 152, 0, 255)";
      // @backColor = "rgba(55, 71, 79, 255)"
      this.fontColor = "rgba(255, 255, 255, 255)";
      this.midColor = "rgba(176, 190, 197, 255)";
      addEventListener("freqevent", this.onFreqEvent);
      addEventListener("resize", this.onResize);
      this.onResize();
      return this.animateId = requestAnimationFrame(this.drawAll);
    }

    destroy() {
      this.audioProcessor.removeEventListener("freqevent", this.onFreqEvent);
      removeEventListener("resize", this.onResize);
      if (this.animateId != null) {
        return cancelAnimationFrame(this.animateId);
      }
    }

    onResize() {
      var dPR;
      dPR = window.devicePixelRatio || 1;
      this.width = this.canvas.parentElement.clientWidth;
      this.height = this.canvas.parentElement.clientHeight;
      this.canvas.width = this.width * dPR;
      this.canvas.height = this.height * dPR;
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
      this.radius = Math.min(this.canvas.width, this.canvas.height) / 2;
      console.log(this.radius);
      this.xOffset = this.canvas.width / 2;
      this.yOffset = this.canvas.height / 2;
      this.outerRadius = this.radius * 9 / 10;
      this.innerRadius = this.outerRadius * 7 / 10;
      this.pointerRadius = this.innerRadius / 10;
      return this.midRadius = this.innerRadius / 2;
    }

    onFreqEvent(event) {
      var angleDifference, newRotateAngle, noteIndex, semitonesFromA4;
      this.freq = event.detail.freq;
      // https://zh.wikipedia.org/wiki/%E9%9F%B3%E9%AB%98
      semitonesFromA4 = this.notes.length * Math.log2(this.freq / 440);
      this.octave = Math.floor(4 + ((9 + semitonesFromA4) / this.notes.length));
      noteIndex = (this.notes.length + Math.round(9 + semitonesFromA4) % this.notes.length) % this.notes.length;
      this.note = this.notes[noteIndex];
      newRotateAngle = (this.notes.length + ((9 + this.notes.length * Math.log2(this.freq / 440)) % this.notes.length)) % this.notes.length * Math.PI * 2 / this.notes.length;
      angleDifference = (newRotateAngle - this.realRotateAngle) % (Math.PI * 2);
      if (Math.abs(angleDifference) > Math.PI) {
        angleDifference = (Math.PI * 2 + angleDifference) % (Math.PI * 2);
      }
      return this.realRotateAngle += angleDifference;
    }

    drawAll(time) {
      this.rotateAngle += (this.realRotateAngle - this.rotateAngle) * 0.15;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawDial(this.rotateAngle);
      this.drawPointer();
      this.drawMid(this.note, `${this.octave}`);
      return requestAnimationFrame(this.drawAll);
    }

    drawBackground() {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.backColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return this.ctx.restore();
    }

    drawDial(rotateAngle = 0) {
      this.ctx.save();
      this.ctx.translate(this.xOffset, this.yOffset);
      this.ctx.rotate(0 - rotateAngle);
      this.drawOuterCircle();
      this.drawInnerCircle();
      this.drawSplit();
      this.drawDialText();
      return this.ctx.restore();
    }

    drawOuterCircle() {
      this.ctx.save();
      this.ctx.fillStyle = this.loopColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.outerRadius, 0, Math.PI * 2, true);
      this.ctx.fill();
      return this.ctx.restore();
    }

    drawInnerCircle() {
      this.ctx.save();
      this.ctx.globalCompositeOperation = "destination-out";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.innerRadius, 0, Math.PI * 2, true);
      this.ctx.fill();
      return this.ctx.restore();
    }

    drawSplit() {
      var i, j, ref;
      this.ctx.save();
      this.ctx.rotate(Math.PI * 2 / this.notes.length / 2);
      this.ctx.globalCompositeOperation = "destination-out";
      for (i = j = 0, ref = this.notes.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0 - this.innerRadius);
        this.ctx.lineTo(0, 0 - this.outerRadius);
        this.ctx.stroke();
        this.ctx.rotate(Math.PI * 2 / this.notes.length);
      }
      return this.ctx.restore();
    }

    drawDialText() {
      var bigFont, i, j, ref, smallFont;
      this.ctx.save();
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = this.fontColor;
      bigFont = Math.floor((this.outerRadius - this.innerRadius) * 3 / 5);
      smallFont = Math.floor(bigFont / 2);
      for (i = j = 0, ref = this.notes.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        if (this.notes[i].length > 1) {
          this.ctx.font = smallFont + "px sans";
          this.ctx.fillText(this.notes[i][0], 0 - bigFont / 2, 0 - (this.innerRadius + (this.outerRadius - this.innerRadius) / 2) - smallFont / 2);
          this.ctx.font = bigFont + "px sans";
          this.ctx.fillText(this.notes[i][1], 0, 0 - (this.innerRadius + (this.outerRadius - this.innerRadius) / 2));
        } else if (this.notes[i].length === 1) {
          this.ctx.font = bigFont + "px sans";
          this.ctx.fillText(this.notes[i], 0, 0 - (this.innerRadius + (this.outerRadius - this.innerRadius) / 2));
        }
        this.ctx.rotate(Math.PI * 2 / this.notes.length);
      }
      return this.ctx.restore();
    }

    drawPointer() {
      this.ctx.save();
      this.ctx.translate(this.xOffset, this.yOffset);
      this.ctx.fillStyle = "rgba(255, 255, 255, 255)";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.pointerRadius, Math.PI / 2, Math.PI, false);
      this.ctx.lineTo(0, 0 - this.outerRadius + this.pointerRadius);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = "rgba(200, 200, 200, 255)";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.pointerRadius, Math.PI / 2, 0, true);
      this.ctx.lineTo(0, 0 - this.outerRadius + this.pointerRadius);
      this.ctx.closePath();
      this.ctx.fill();
      return this.ctx.restore();
    }

    drawMid(note, octave) {
      var bigFont, smallFont;
      this.ctx.save();
      this.ctx.translate(this.xOffset, this.yOffset);
      this.ctx.save();
      this.ctx.fillStyle = this.midColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.midRadius, 0, Math.PI * 2, true);
      this.ctx.fill();
      this.ctx.restore();
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillStyle = this.fontColor;
      bigFont = Math.floor(this.midRadius * 4 / 5);
      smallFont = Math.floor(bigFont / 2);
      if (note.length > 1) {
        this.ctx.font = smallFont + "px sans";
        this.ctx.fillText(note[0], 0 - bigFont / 2, 0 - smallFont / 2);
        this.ctx.font = bigFont + "px sans";
        this.ctx.fillText(note[1], 0, 0);
        this.ctx.font = smallFont + "px sans";
        this.ctx.fillText(octave, 0 + bigFont / 2, 0 + (smallFont / 2) * octave.length);
      } else if (note.length === 1) {
        this.ctx.font = bigFont + "px sans";
        this.ctx.fillText(note, 0, 0);
        this.ctx.font = smallFont + "px sans";
        this.ctx.fillText(octave, 0 + bigFont / 2, 0 + (smallFont / 2) * octave.length);
      }
      return this.ctx.restore();
    }

  };

  window.log = console.log.bind(console);

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
        if (getUserMedia == null) {
          return null;
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

  checkAudioContext();

  checkGetUserMedia();

  checkRequestAnimationFrame();

  audioProcessor = new AudioProcessor();

  audioVisualizer = new AudioVisualizer();

}).call(this);
