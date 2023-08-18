// okay, so all we need to do here is make a detector for when
// AHHHHH THIS IS GOOD!!!!!!!!!
// :) :) :)
// okay, so handstand detector. it does pose detection to detect the start and end of a handstand, so you can have an auto-replay of your last handstand, over and over again.

import * as posedetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'
import React from 'react'
import { useDropzone } from 'react-dropzone'
import { Canvas } from './Canvas'
import { CornerSnapper } from './CornerSnapper'
import { DebugBox } from './DebugBox'
import { drawFrame } from './drawFrame'
import { useAppState } from './state'
import { getCanvasDimensions } from './utils'
import { RecordingLabel } from './RecordingLabel'

navigator.mediaDevices.getUserMedia({
  video: true,
})

export const DebugMode: boolean = false

const App = () => {
  const thumbnailVideoRef = React.useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const replayVideoRef = React.useRef<HTMLVideoElement>(null)

  const scratchRef = React.useRef(useAppState.getState())
  React.useEffect(
    () => useAppState.subscribe((state) => (scratchRef.current = state)),
    [],
  )

  const tfReadyStatus = useAppState((s) => s.tfReadyStatus)

  const model = useAppState((s) => s.model)

  const recordingStatus = useAppState((s) => s.recordingStatus)

  const screenDimensions = useAppState((s) => s.screenDimensions)
  const canvasDimensions = useAppState((s) => s.canvasDimensions)
  const sourceDimensions = useAppState((s) => s.sourceDimensions)

  const handstandStart = useAppState((s) => s.handstandStart)
  const videoSrcObject = useAppState((s) => s.videoSrcObject)

  const mediaRecorder = useAppState((s) => s.mediaRecorder)

  const replayVideoURLs = useAppState((s) => s.replayVideoURLs)
  const replayVideoStarts = useAppState((s) => s.replayVideoStartOffets)
  const currentReplayIndex = useAppState((s) => s.currentReplayIndex)

  const previewCorner = useAppState((s) => s.previewCorner)

  const addChunk = useAppState((s) => s.addChunk)

  // const doesVideoNeedToBeMirrored = videoSrcObject instanceof MediaStream
  const doesVideoNeedToBeMirrored = false

  React.useEffect(() => {
    ;(async () => {
      await tf.setBackend('webgl')
      if (videoSrcObject == null) {
        await navigator.mediaDevices
          .getUserMedia({
            video: true,
          })
          .then((source) => {
            useAppState.setState({ videoSrcObject: source })
          })
          .catch(() => {
            throw new Error("Can't get webcam video.")
          })
      }
    })()
  }, [videoSrcObject])

  React.useEffect(() => {
    if (mediaRecorder == null && videoSrcObject instanceof MediaStream) {
      const newMediaRecorder = new MediaRecorder(videoSrcObject, {
        mimeType: 'video/mp4',
      })
      newMediaRecorder.start()
      useAppState.setState({
        recordingStart: Date.now(),
        mediaRecorder: newMediaRecorder,
        recordingStatus: 'passive-recording',
      })
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
      const thumbnailVideoElement = thumbnailVideoRef.current
      const canvasElement = canvasRef.current
      if (canvasElement == null || thumbnailVideoElement == null) {
        throw new Error(`Canvas or video elements missing`)
      }

      posedetection
        .createDetector(posedetection.SupportedModels.BlazePose, {
          runtime: 'tfjs',
          enableSmoothing: true,
          modelType: 'lite',
        })
        .then((newModel) => {
          useAppState.setState({
            tfReadyStatus: 'loading',
            model: newModel,
          })
          newModel.estimatePoses(thumbnailVideoElement).then(() => {
            useAppState.setState({
              tfReadyStatus: 'ready',
            })
          })
        })
        .catch(() => {
          throw new Error("Can't initialize pose detection.")
        })
    }
  }, [tfReadyStatus, videoSrcObject])

  React.useEffect(() => {
    const thumbnailVideo = thumbnailVideoRef.current
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
        const thumbnailVideo = thumbnailVideoRef.current
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

  const sourceAspectRatio = sourceDimensions.width / sourceDimensions.height
  const thumbnailHeight = 150
  const thumbnailWidth = thumbnailHeight * sourceAspectRatio

  React.useEffect(() => {
    const resize = () => {
      useAppState.setState({
        screenDimensions: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        canvasDimensions: getCanvasDimensions(sourceAspectRatio),
      })
    }
    window.addEventListener('resize', resize)
    resize() // Call resize once to set initial size
    return () => window.removeEventListener('resize', resize)
  }, [sourceAspectRatio])

  React.useEffect(() => {
    if (thumbnailVideoRef.current != null) {
      thumbnailVideoRef.current.addEventListener(
        'loaded',
        () => {
          if (thumbnailVideoRef.current != null) {
            useAppState.setState({
              sourceDimensions: {
                width: thumbnailVideoRef.current.width,
                height: thumbnailVideoRef.current.height,
              },
            })
          }
        },
        false,
      )
    }
  }, [])

  const onDrop = React.useCallback((acceptedFiles: Array<File>) => {
    useAppState.setState({
      videoSrcObject: acceptedFiles[0],
    })
  }, [])

  const startFromOffset = React.useCallback(() => {
    if (currentReplayIndex == null || replayVideoStarts.length === 0) {
      throw new Error(
        `currentReplayIndex must not be null, and replayVideoStarts must have content`,
      )
    }

    const replayVideo = replayVideoRef.current
    if (replayVideo != null) {
      const replayVideoStart = replayVideoStarts[currentReplayIndex]
      console.log(replayVideo.currentTime, replayVideoStart / 1000)
      replayVideo.currentTime = Math.max(0, replayVideoStart / 1000)
      replayVideo.play()
    }
  }, [currentReplayIndex, replayVideoStarts])

  const closeReplay = React.useCallback(() => {
    useAppState.setState({ currentReplayIndex: null })
  }, [])

  const { getRootProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 })

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
      <Canvas
        style={{ display: tfReadyStatus === 'ready' ? undefined : 'none' }}
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        doesVideoNeedToBeMirrored={doesVideoNeedToBeMirrored}
      />
      {currentReplayIndex !== null && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [
              'translate(-50%, -50%)',
              doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
            ].join(' '),
          }}
        >
          <video
            ref={replayVideoRef}
            id='replay'
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            style={{}}
            src={replayVideoURLs[currentReplayIndex]}
            onLoadedMetadata={startFromOffset}
            onEnded={startFromOffset}
            controls={false}
          />
          <div
            style={{
              color: 'white',
              fontWeight: 600,
              fontSize: 32,
              position: 'absolute',
              top: 4,
              ...(previewCorner === 'tl' || previewCorner === 'bl'
                ? { right: 4 }
                : { left: 4 }),
              width: 40,
              height: 40,
              textAlign: 'center',
              userSelect: 'none',
              cursor: 'pointer',
              textShadow: '0 0 4px #0004',
            }}
            onClick={closeReplay}
          >
            ×
          </div>
          <img
            src='./instant-replay.svg'
            alt='Instant Replay®'
            style={{
              width: '35%',
              color: '#fffa',
              fontSize: 30,
              fontStyle: 'italic',
              position: 'absolute',
              fontWeight: 800,
              bottom: 8,
              ...(previewCorner === 'tl' || previewCorner === 'bl'
                ? { right: 8 }
                : { left: 8 }),
            }}
          />
        </div>
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
      <div
        id='file-dropzone'
        {...getRootProps()}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
      {isDragActive && (
        <div
          style={{
            height: 'calc(100% - 100px - 20px)',
            width: 'calc(100% - 100px - 20px)',
            position: 'absolute',
            top: 0,
            left: 0,
            margin: 50,
            borderWidth: 10,
            borderStyle: 'dashed',
            borderColor: '#0006',
            pointerEvents: 'none',
            borderRadius: 20,
          }}
        ></div>
      )}
      <CornerSnapper
        parentWidth={screenDimensions.width}
        parentHeight={screenDimensions.height}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 10,
          boxShadow: '0 0 10px #0004',
        }}
      >
        <div
          style={{
            display: 'flex',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <video
            style={{
              transform: doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
            }}
            width={thumbnailWidth}
            height={thumbnailHeight}
            muted
            controls={false}
            autoPlay
            loop
            ref={thumbnailVideoRef}
          />
          {handstandStart != null && <RecordingLabel />}
        </div>
        {DebugMode && <DebugBox />}
      </CornerSnapper>
    </div>
  )
}

export default App
