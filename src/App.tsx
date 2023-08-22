// okay, so all we need to do here is make a detector for when
// AHHHHH THIS IS GOOD!!!!!!!!!
// :) :) :)
// okay, so handstand detector. it does pose detection to detect the start and end of a handstand, so you can have an auto-replay of your last handstand, over and over again.

import * as posedetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'
import React from 'react'
import { Canvas } from './Canvas'
import { FileDropzone } from './FileDropzone'
import { LivePreview } from './LivePreview'
import { ReplayPlayer } from './ReplayPlayer'
import { drawFrame } from './drawFrame'
import { useAppState } from './state'
import { getCanvasDimensions } from './utils'

navigator.mediaDevices.getUserMedia({
  video: true,
})

export const DebugMode: boolean = false

const App = () => {
  const livePreviewRef = React.useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const replayVideoRef = React.useRef<HTMLVideoElement>(null)

  const tfReadyStatus = useAppState((s) => s.tfReadyStatus)

  const model = useAppState((s) => s.model)

  const recordingStatus = useAppState((s) => s.recordingStatus)

  const sourceDimensions = useAppState((s) => s.sourceDimensions)

  const videoSrcObject = useAppState((s) => s.videoSrcObject)

  const mediaRecorder = useAppState((s) => s.mediaRecorder)

  const currentReplayIndex = useAppState((s) => s.currentReplayIndex)

  const addChunk = useAppState((s) => s.addChunk)

  const doesVideoNeedToBeMirrored = useAppState((s) =>
    s.doesVideoNeedToBeMirrored(),
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
    if (mediaRecorder == null) {
      const mimeType = MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

      if (videoSrcObject instanceof MediaStream) {
        const newMediaRecorder = new MediaRecorder(videoSrcObject, {
          mimeType,
        })
        newMediaRecorder.start()
        useAppState.setState({
          recordingStart: Date.now(),
          mediaRecorder: newMediaRecorder,
          recordingStatus: 'passive-recording',
          mimeType,
        })
      } else if (videoSrcObject instanceof File && canvasRef.current != null) {
        const newMediaRecorder = new MediaRecorder(
          canvasRef.current.captureStream(),
          {
            mimeType,
          },
        )
        newMediaRecorder.start()
        useAppState.setState({
          recordingStart: Date.now(),
          mediaRecorder: newMediaRecorder,
          recordingStatus: 'passive-recording',
        })
      }
    }
  }, [mediaRecorder, recordingStatus, videoSrcObject])

  React.useEffect(() => {
    if (mediaRecorder instanceof MediaRecorder) {
      const onDataAvailable = (e: BlobEvent) => addChunk(e.data)
      mediaRecorder.addEventListener('dataavailable', onDataAvailable)

      const onStop = () => {
        useAppState.getState().prepareReplay()
      }
      mediaRecorder.addEventListener('stop', onStop)
      return () => {
        mediaRecorder.removeEventListener('dataavailable', onDataAvailable)
      }
    }
  }, [addChunk, mediaRecorder])

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
    </div>
  )
}

export default App

/**
 * TODO
 * - check the handstand recognition, see why it sucks
 * - give the video player a scrubber
 * - view all the replays with their times and a screenshot
 * - change the MediaRecorder system to have a set of three, which cycle
 *   between each of them, discarding them if a handstand isn't detected,
 *   giving us recordings that start 1s before each handstand.
 * - find a way to make loading not be block the main thread
 * - review the rerenders
 * - fix clicking on dropzone in chrome opening the file picker
 * - maybe improve perf by limiting number of pose detection calls, not every frame?
 */
