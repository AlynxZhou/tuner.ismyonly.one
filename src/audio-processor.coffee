class AudioProcessor
  constructor: () ->
    @checkVisibilityApi()
    @initialize()

  initialize: () =>
    @audioCtx = new AudioContext()
    @analyser = @audioCtx.createAnalyser()
    @animateId = null
    @stream = null
    @micSource = null
    @analyser.fftSize = 4096
    @hidden = null
    @visibilityChange = null
    @lastTime = 0
    @dataBuffer = new Float32Array(@analyser.fftSize)
    document.addEventListener(@visibilityChange, @onVisibilityChange)
    @onVisibilityChange()

  destroy: () =>
    cancelAnimationFrame(@animateId) if @animateId?

  autoCorrelate: (buffer, sampleRate) ->
    minSamples = 4
    maxSamples = buffer.length / 2
    bestOffset = -1
    bestCorrelation = 0
    freq = -1
    for offset in [maxSamples..minSamples]
      correlation = 0
      for i in [0...maxSamples]
        correlation += buffer[i] * buffer[i + offset]
      correlation /= maxSamples + offset
      if correlation > bestCorrelation
        bestCorrelation = correlation
        bestOffset = offset
    return freq = sampleRate / bestOffset

  fireFreqEvent: (time) =>
    if time > @lastTime + 128
      @analyser.getFloatTimeDomainData(@dataBuffer)
      rms = 0
      freq = 0
      noticeableRms = 0.008
      for i in [0...@dataBuffer.length]
        rms += @dataBuffer[i] * @dataBuffer[i]
      rms = Math.sqrt(rms / @dataBuffer.length)
      if rms > noticeableRms
        freq = @autoCorrelate(@dataBuffer, @audioCtx.sampleRate)
      if freq >= 32.7 and freq <= 8372
        # C1 - C8
        event = new CustomEvent("freqevent", {"detail": {"freq": freq}})
        dispatchEvent(event)
        @lastTime = time
    requestAnimationFrame(@fireFreqEvent)

  requestUserMedia: () =>
    navigator.mediaDevices.getUserMedia({"audio": true}).then((stream) =>
      @stream = stream
      @micSource = @audioCtx.createMediaStreamSource(@stream)
      @micSource.connect(@analyser)
      @animateId = requestAnimationFrame(@fireFreqEvent)
    ).catch((error) =>
      log(error)
      cancelAnimationFrame(@animateId) if @animateId?
    )

  onVisibilityChange: () =>
    if document[@hidden]
      cancelAnimationFrame(@animateId)
      @animateId = null
      if @stream?
        @stream.getAudioTracks().forEach((track) ->
          if "stop" of track
            track.stop()
        )
        if "stop" of @stream
          @stream.stop()
      @stream = null
    else
      @requestUserMedia()

  checkVisibilityApi: () ->
    if document.hidden?
      @hidden = "hidden"
      @visibilityChange = "visibilitychange"
    else if document.webkitHidden?
      @hidden = "webkitHidden"
      @visibilityChange = "webkitvisibilitychange"
    else if document.mozHidden?
      @hidden = "mozHidden"
      @visibilityChange = "mozvisibilitychange"
    else if document.oHidden?
      @hidden = "oHidden"
      @visibilityChange = "ovisibilitychange"
    else if document.msHidden?
      @hidden = "msHidden"
      @visibilityChange = "msvisibilitychange"
    return document.hidden?
