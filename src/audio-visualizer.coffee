class AudioVisualizer
  constructor: () ->
    @initialize()

  initialize: () =>
    @notes = ["C", "#C", "D", "♭E", "E", "F",
    "#F", "G", "#G", "A", "♭B", "B"]
    @div = document.getElementById("tunerDiv")
    # @canvas = document.createElement("canvas")
    @canvas = document.getElementById("canvas")
    # @div.appendChild(@canvas)
    # @canvas.width = 480
    # @canvas.height = 480
    @ctx = @canvas.getContext("2d")
    @note = "C"
    @octave = 0
    @rotateAngle = 0
    @realRotateAngle = 0
    @loopColor = "rgba(255, 152, 0, 255)"
    # @backColor = "rgba(55, 71, 79, 255)"
    @fontColor = "rgba(255, 255, 255, 255)"
    @midColor = "rgba(176, 190, 197, 255)"
    addEventListener("freqevent", @onFreqEvent)
    addEventListener("resize", @onResize)
    @onResize()
    @animateId = requestAnimationFrame(@drawAll)

  destroy: () =>
    @audioProcessor.removeEventListener("freqevent", @onFreqEvent)
    removeEventListener("resize", @onResize)
    cancelAnimationFrame(@animateId) if @animateId?

  onResize: () =>
    dPR = window.devicePixelRatio or 1
    @width = @canvas.parentElement.clientWidth
    @height = @canvas.parentElement.clientHeight
    @canvas.width = @width * dPR
    @canvas.height = @height * dPR
    @canvas.style.width = @width + "px"
    @canvas.style.height = @height + "px"
    @radius = Math.min(@canvas.width, @canvas.height) / 2
    console.log @radius
    @xOffset = @canvas.width / 2
    @yOffset = @canvas.height / 2
    @outerRadius = @radius * 9 / 10
    @innerRadius = @outerRadius * 7 / 10
    @pointerRadius = @innerRadius / 10
    @midRadius = @innerRadius / 2

  onFreqEvent: (event) =>
    @freq = event.detail.freq
    # https://zh.wikipedia.org/wiki/%E9%9F%B3%E9%AB%98
    semitonesFromA4 = @notes.length * Math.log2(@freq / 440)
    @octave = Math.floor(4 + ((9 + semitonesFromA4) / @notes.length))
    noteIndex = (@notes.length + Math.round(9 + semitonesFromA4) % \
    @notes.length) % @notes.length
    @note = @notes[noteIndex]
    newRotateAngle = (@notes.length + ((9 + @notes.length * \
    Math.log2(@freq / 440)) % @notes.length)) % @notes.length * \
    Math.PI * 2 / @notes.length
    angleDifference = (newRotateAngle - @realRotateAngle) % (Math.PI * 2)
    if Math.abs(angleDifference) > Math.PI
      angleDifference = (Math.PI * 2 + angleDifference) % (Math.PI * 2)
    @realRotateAngle += angleDifference

  drawAll: (time) =>
    @rotateAngle += (@realRotateAngle - @rotateAngle) * 0.15
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @drawDial(@rotateAngle)
    @drawPointer()
    @drawMid(@note, "#{@octave}")
    requestAnimationFrame(@drawAll)

  drawBackground: () =>
    @ctx.save()
    @ctx.clearRect(0, 0, @canvas.width, @canvas.height)
    @ctx.fillStyle = @backColor
    @ctx.fillRect(0, 0, @canvas.width, @canvas.height)
    @ctx.restore()

  drawDial: (rotateAngle = 0) =>
    @ctx.save()
    @ctx.translate(@xOffset, @yOffset)
    @ctx.rotate(0 - rotateAngle)
    @drawOuterCircle()
    @drawInnerCircle()
    @drawSplit()
    @drawDialText()
    @ctx.restore()

  drawOuterCircle: () =>
    @ctx.save()
    @ctx.fillStyle = @loopColor
    @ctx.beginPath()
    @ctx.arc(0, 0, @outerRadius, 0, Math.PI * 2, true)
    @ctx.fill()
    @ctx.restore()

  drawInnerCircle: () =>
    @ctx.save()
    @ctx.globalCompositeOperation = "destination-out"
    @ctx.beginPath()
    @ctx.arc(0, 0, @innerRadius, 0, Math.PI * 2, true)
    @ctx.fill()
    @ctx.restore()

  drawSplit: () =>
    @ctx.save()
    @ctx.rotate(Math.PI * 2 / @notes.length / 2)
    @ctx.globalCompositeOperation = "destination-out"
    for i in [0...@notes.length]
      @ctx.beginPath()
      @ctx.moveTo(0, 0 - @innerRadius)
      @ctx.lineTo(0, 0 - @outerRadius)
      @ctx.stroke()
      @ctx.rotate(Math.PI * 2 / @notes.length)
    @ctx.restore()

  drawDialText: () =>
    @ctx.save()
    @ctx.textAlign = "center"
    @ctx.textBaseline = "middle"
    @ctx.fillStyle = @fontColor
    bigFont = Math.floor(((@outerRadius - @innerRadius) * 3 / 5))
    smallFont = Math.floor(bigFont / 2)
    for i in [0...@notes.length]
      if @notes[i].length > 1
        @ctx.font = smallFont + "px sans"
        @ctx.fillText(@notes[i][0], 0 - bigFont / 2, 0 - \
        (@innerRadius + (@outerRadius - @innerRadius) / 2) \
        - smallFont / 2)
        @ctx.font = bigFont + "px sans"
        @ctx.fillText(@notes[i][1], 0, 0 - (@innerRadius + \
        (@outerRadius - @innerRadius) / 2))
      else if @notes[i].length is 1
        @ctx.font = bigFont + "px sans"
        @ctx.fillText(@notes[i], 0, 0 - (@innerRadius + \
        (@outerRadius - @innerRadius) / 2))
      @ctx.rotate(Math.PI * 2 / @notes.length)
    @ctx.restore()

  drawPointer: () =>
    @ctx.save()
    @ctx.translate(@xOffset, @yOffset)
    @ctx.fillStyle = "rgba(255, 255, 255, 255)"
    @ctx.beginPath()
    @ctx.arc(0, 0, @pointerRadius, Math.PI / 2, Math.PI, false)
    @ctx.lineTo(0, 0 - @outerRadius + @pointerRadius)
    @ctx.closePath()
    @ctx.fill()
    @ctx.fillStyle = "rgba(200, 200, 200, 255)"
    @ctx.beginPath()
    @ctx.arc(0, 0, @pointerRadius, Math.PI / 2, 0, true)
    @ctx.lineTo(0, 0 - @outerRadius + @pointerRadius)
    @ctx.closePath()
    @ctx.fill()
    @ctx.restore()

  drawMid: (note, octave) =>
    @ctx.save()
    @ctx.translate(@xOffset, @yOffset)
    @ctx.save()
    @ctx.fillStyle = @midColor
    @ctx.beginPath()
    @ctx.arc(0, 0, @midRadius, 0, Math.PI * 2, true)
    @ctx.fill()
    @ctx.restore()
    @ctx.textAlign = "center"
    @ctx.textBaseline = "middle"
    @ctx.fillStyle = @fontColor
    bigFont = Math.floor(@midRadius * 4 / 5)
    smallFont = Math.floor(bigFont / 2)
    if note.length > 1
      @ctx.font = smallFont + "px sans"
      @ctx.fillText(note[0], 0 - bigFont / 2, 0 - smallFont / 2)
      @ctx.font = bigFont + "px sans"
      @ctx.fillText(note[1], 0, 0)
      @ctx.font = smallFont + "px sans"
      @ctx.fillText(octave, 0 + bigFont / 2, \
      0 + (smallFont / 2) * octave.length)
    else if note.length is 1
      @ctx.font = bigFont + "px sans"
      @ctx.fillText(note, 0, 0)
      @ctx.font = smallFont + "px sans"
      @ctx.fillText(octave, 0 + bigFont / 2, \
      0 + (smallFont / 2) * octave.length)
    @ctx.restore()
