window.log = console.log.bind(console)

checkAudioContext = () ->
  window.AudioContext = window.AudioContext or \
  window.webkitAudioContext or \
  window.mozAudioContext or \
  window.oAudioContext or \
  window.msAudioContext
  return window.AudioContext?

checkGetUserMedia = () ->
  if not navigator.mediaDevices?
    navigator.mediaDevices = {}
  if not navigator.mediaDevices.getUserMedia?
    navigator.mediaDevices.getUserMedia = (constraints) ->
      getUserMedia = navigator.getUserMedia or \
      navigator.webkitGetUserMedia or \
      navigator.mozGetUserMedia or \
      navigator.oGetUserMedia or \
      navigator.msGetUserMedia
      if not getUserMedia?
        return null
      else
        return new Promise((resolve, reject) ->
          getUserMedia.call(navigator, constraints, resolve, reject)
        )
  return navigator.mediaDevices.getUserMedia?

checkRequestAnimationFrame = () ->
  window.requestAnimationFrame = window.requestAnimationFrame or \
  window.webkitRequestAnimationFrame or \
  window.mozRequestAnimationFrame or \
  window.oRequestAnimationFrame or \
  window.msRequestAnimationFrame or \
  (callback) ->
    window.setTimeout(callback, 1000 / 60)
  window.cancelAnimationFrame = window.cancelAnimationFrame or \
  window.webkitCancelAnimationFrame or \
  window.mozCancelAnimationFrame or \
  window.oCancelAnimationFrame or \
  window.msCancelAnimationFrame or \
  (animateId) ->
    window.clearTimeout(animateId)
  return window.requestAnimationFrame? and window.cancelAnimationFrame?

checkAudioContext()
checkGetUserMedia()
checkRequestAnimationFrame()

audioProcessor = new AudioProcessor()
audioVisualizer = new AudioVisualizer()
