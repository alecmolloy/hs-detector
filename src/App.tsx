// okay, so all we need to do here is make a detector for when
// AHHHHH THIS IS GOOD!!!!!!!!!
// :) :) :)
// okay, so handstand detector. it does pose detection to detect the start and end of a handstand, so you can have an auto-replay of your last handstand, over and over again.

import * as posedetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'
import React from 'react'
import { animated, useTransition } from 'react-spring'
import { Canvas } from './Canvas'
import { FileDropzone } from './FileDropzone'
import { LivePreview } from './LivePreview'
import { ReplayList } from './ReplayList'
import { ReplayPlayer } from './ReplayPlayer'
import { drawFrame } from './drawFrame'
import { useAppState } from './state'
import { getCanvasDimensions } from './utils'

navigator.mediaDevices.getUserMedia({
  video: true,
})

export const DebugMode: boolean = true

const App = () => {
  const livePreviewRef = React.useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const replayVideoRef = React.useRef<HTMLVideoElement>(null)

  const tfReadyStatus = useAppState((s) => s.tfReadyStatus)

  const model = useAppState((s) => s.model)

  const sourceDimensions = useAppState((s) => s.sourceDimensions)

  const videoSrcObject = useAppState((s) => s.videoSrcObject)

  const activeMediaRecorder = useAppState((s) => s.activeMediaRecorder)
  const passiveMediaRecorder1 = useAppState((s) => s.passiveMediaRecorder1)
  const passiveMediaRecorder2 = useAppState((s) => s.passiveMediaRecorder2)

  const currentReplayIndex = useAppState((s) => s.currentReplayIndex)

  const controlsActiveFor3Seconds = useAppState(
    (s) => s.controlsActiveFor3Seconds,
  )
  const isCursorIsOverControls = useAppState((s) => s.cursorIsOverControls)

  const addChunk = useAppState((s) => s.addChunk)

  const doesVideoNeedToBeMirrored = useAppState((s) =>
    s.doesVideoNeedToBeMirrored(),
  )

  const canvasDimensions = useAppState((s) => s.canvasDimensions)

  const replayListTransition = useTransition(
    currentReplayIndex == null &&
      (controlsActiveFor3Seconds || isCursorIsOverControls),
    {
      from: { opacity: 0 },
      enter: { opacity: 1, config: { duration: 150 } },
      leave: { opacity: 0, config: { duration: 0 } },
    },
  )

  React.useEffect(() => {
    ;(async () => {
      await tf.setBackend('webgl')
      if (videoSrcObject == null) {
        const source = await navigator.mediaDevices
          .getUserMedia({
            video: true,
          })
          .catch(() => {
            throw new Error("Can't get webcam video.")
          })
        useAppState.setState({ videoSrcObject: source })
      }
    })()
  }, [videoSrcObject])

  React.useEffect(() => {
    if (
      passiveMediaRecorder1 == null &&
      passiveMediaRecorder2 == null &&
      videoSrcObject != null
    ) {
      const mimeType = MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'
      if (canvasRef.current == null) {
        throw new Error(`Canvas element missing`)
      }
      let stream: MediaStream
      if (videoSrcObject instanceof MediaStream) {
        stream = videoSrcObject
      } else if (videoSrcObject instanceof File) {
        stream = canvasRef.current.captureStream()
      } else {
        throw new Error(`Invalid videoSrcObject`)
      }

      const newPassiveMediaRecorder1 = new MediaRecorder(stream, {
        mimeType,
      })
      const newPassiveMediaRecorder2 = new MediaRecorder(stream, {
        mimeType,
      })
      newPassiveMediaRecorder1.start()
      useAppState.setState({
        recordingStart: Date.now(),
        passiveMediaRecorder1: newPassiveMediaRecorder1,
        passiveMediaRecorder1StartTime: Date.now(),
        passiveMediaRecorder2: newPassiveMediaRecorder2,
        mimeType,
      })
    }
  }, [
    activeMediaRecorder,
    passiveMediaRecorder1,
    passiveMediaRecorder2,
    videoSrcObject,
  ])

  React.useEffect(() => {
    if (activeMediaRecorder instanceof MediaRecorder) {
      const onDataAvailable = (e: BlobEvent) => addChunk(e.data)
      activeMediaRecorder.addEventListener('dataavailable', onDataAvailable)

      const onStop = () => {
        if (
          useAppState.getState().triggerReplayPreparationOnNextStop === true
        ) {
          useAppState.getState().prepareReplay()
          useAppState.setState({ triggerReplayPreparationOnNextStop: false })
        }
      }
      activeMediaRecorder.addEventListener('stop', onStop)
      return () => {
        activeMediaRecorder.removeEventListener(
          'dataavailable',
          onDataAvailable,
        )
      }
    }
  }, [addChunk, activeMediaRecorder])

  React.useEffect(() => {
    if (
      tfReadyStatus == null &&
      // make sure the video stream is properly loaded
      videoSrcObject instanceof MediaStream
    ) {
      ;(async () => {
        const thumbnailVideoElement = livePreviewRef.current
        const canvasElement = canvasRef.current
        if (canvasElement == null || thumbnailVideoElement == null) {
          throw new Error(`Canvas or video elements missing`)
        }

        const newModel = await posedetection
          .createDetector(posedetection.SupportedModels.BlazePose, {
            runtime: 'tfjs',
            enableSmoothing: true,
            modelType: 'full',
          })
          .catch(() => {
            throw new Error("Can't initialize pose detection.")
          })

        useAppState.setState({
          tfReadyStatus: 'loading',
          model: newModel,
        })
        newModel.estimatePoses(thumbnailVideoElement).then(() => {
          useAppState.setState({
            tfReadyStatus: 'ready',
          })
        })
      })()
    }
  }, [tfReadyStatus, videoSrcObject])

  React.useEffect(() => {
    const thumbnailVideo = livePreviewRef.current
    const canvas = canvasRef.current
    if (thumbnailVideo != null && canvas != null && model != null) {
      let rafId: number

      const frame = () => {
        drawFrame(thumbnailVideo, canvas, model)
        rafId = window.requestAnimationFrame(frame)
      }

      rafId = window.requestAnimationFrame(frame)
      return () => {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [model])

  // Use the webcam footage if it is set up
  React.useEffect(() => {
    if (videoSrcObject != null) {
      if (
        videoSrcObject instanceof MediaStream ||
        videoSrcObject instanceof File
      ) {
        const thumbnailVideo = livePreviewRef.current
        const backgroundVideo = backgroundVideoRef.current
        if (thumbnailVideo == null || backgroundVideo == null) {
          throw new Error(`One or both video elements are missing`)
        }
        thumbnailVideo.srcObject = videoSrcObject
        backgroundVideo.srcObject = videoSrcObject
        return () => {
          thumbnailVideo.srcObject = null
          backgroundVideo.srcObject = null
        }
      }
    }
  }, [videoSrcObject])

  React.useEffect(() => {
    const sourceAspectRatio = sourceDimensions.width / sourceDimensions.height
    const resize = () => {
      useAppState.setState({
        canvasDimensions: getCanvasDimensions(sourceAspectRatio),
      })
    }
    window.addEventListener('resize', resize)
    resize()
    return () => window.removeEventListener('resize', resize)
  }, [sourceDimensions])

  const mouseTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const handleMouseMove = () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
      useAppState.setState({ controlsActiveFor3Seconds: true })
      mouseTimeoutRef.current = window.setTimeout(() => {
        useAppState.setState({ controlsActiveFor3Seconds: false })
      }, 3000)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
      }}
    >
      <video
        id='background-video'
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          objectFit: 'cover',
          filter: 'blur(20px)',
          transform: doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
        }}
        muted
        controls={false}
        autoPlay
        ref={backgroundVideoRef}
      />
      <Canvas ref={canvasRef} />
      {currentReplayIndex != null && (
        <ReplayPlayer
          ref={replayVideoRef}
          currentReplayIndex={currentReplayIndex}
        />
      )}
      {tfReadyStatus !== 'ready' && (
        <progress
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          id='progress-bar'
        />
      )}
      <FileDropzone />
      <LivePreview ref={livePreviewRef} />
      {replayListTransition(
        (style, isShowing) =>
          isShowing && (
            <animated.div
              style={{
                ...style,
                width: `calc(${canvasDimensions.width}px - 32px)`,
                position: 'absolute',
                bottom: 13,
                left: 'calc(50%)',
                transform: 'translateX(-50%)',
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <ReplayList />
            </animated.div>
          ),
      )}
    </div>
  )
}

export default App

/**
 * TODO
 *
 * - replay selector shows the replay videos with them as long as their duration, with their screenshots
 *   all shown in a row. show the time it was taken so its clear when they were taken, along with length
 * - give the video player a scrubber
 * - find a way to make loading not be block the main thread
 * - review the rerenders
 * - maybe improve perf by limiting number of pose detection calls, not every frame?
 * - make the videos persist beyond reloads
 * - redefine how a handstand works.
 */
