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
import { HandstandDetectedAlerts } from './HandstandDetectedAlerts'
import {
  drawSkeleton,
  getCanvasDimensions,
  getCanvasSkeletonScaleFactorFromSource,
  isPoseAHandstand,
} from './utils'

navigator.mediaDevices.getUserMedia({
  video: true,
})

const DebugMode = true

interface Dimensions {
  width: number
  height: number
}

const App = () => {
  const thumbnailVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const backgroundVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const [tfReadyStatus, setTFReadyStatus] = React.useState<
    null | 'ready' | 'loading'
  >(null)
  const [model, setModel] = React.useState<posedetection.PoseDetector | null>(
    null,
  )

  const [recordingStatus, setRecordingStatus] = React.useState<
    | null
    | 'passive-recording'
    | 'possible-start'
    | 'middle'
    | 'possible-end'
    | 'preparing-replay'
  >(null)
  const [recorderStart, setRecorderStart] = React.useState<number | null>(null)

  const [screenDimensions, setScreenDimensions] = React.useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [canvasDimensions, setCanvasDimensions] = React.useState<Dimensions>({
    width: 0,
    height: 0,
  })
  const [sourceDimensions, setSourceDimensions] = React.useState<Dimensions>({
    width: 640,
    height: 480,
  })

  const [handstandStart, setHandstandStart] = React.useState<number | null>(
    null,
  )
  const [handstandEnd, setHandstandEnd] = React.useState<number | null>(null)
  const [videoSrcObject, setVideoSrcObject] =
    React.useState<MediaProvider | null>(null)

  const [mediaRecorder, setMediaRecorder] =
    React.useState<MediaRecorder | null>(null)

  const [replayVideoURLs, setReplayVideoURLs] = React.useState<Array<string>>(
    [],
  )
  const [currentReplayURLIndex, setCurrentReplayURLIndex] = React.useState<
    number | null
  >(null)

  const chunks = React.useRef<Array<BlobPart>>([])
  const chunkTimestamps = React.useRef<Array<number>>([])

  const [debugWireframes, setDebugWireframes] = React.useState<boolean>(false)
  const [debugOverrideHandstandState, setDebugOverrideHandstandState] =
    React.useState<boolean>(false)

  // const doesVideoNeedToBeMirrored = videoSrcObject instanceof MediaStream
  const doesVideoNeedToBeMirrored = false

  const drawFrame = React.useCallback(
    async (
      videoElement: HTMLVideoElement,
      canvasElement: HTMLCanvasElement,
      model: posedetection.PoseDetector,
    ) => {
      if (
        videoElement != null &&
        canvasElement != null &&
        videoElement.videoWidth !== 0 &&
        videoElement.videoHeight !== 0
      ) {
        const canvasCtx = canvasElement.getContext('2d')
        if (canvasCtx == null) {
          throw new Error('Canvas Context not available')
        }
        const poses = await model.estimatePoses(videoElement)
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
        canvasCtx.drawImage(
          videoElement,
          0,
          0,
          canvasElement.width,
          canvasElement.height,
        )

        const pose: posedetection.Pose | undefined = poses[0]
        if (debugWireframes && pose != null) {
          drawSkeleton(
            pose,
            canvasCtx,
            getCanvasSkeletonScaleFactorFromSource(videoElement, canvasElement),
          )
        }

        const poseIsHandstanding =
          pose != null
            ? DebugMode
              ? debugOverrideHandstandState
              : isPoseAHandstand(pose)
            : false
        switch (recordingStatus) {
          case 'passive-recording': {
            if (poseIsHandstanding || debugOverrideHandstandState) {
              setHandstandStart(Date.now())
              setRecordingStatus('possible-start')
            }
            break
          }
          case 'possible-start': {
            if (handstandStart == null) {
              throw new Error(
                `Internal Error: 'handstandStart' should have a value, but was not found.`,
              )
            }
            if (Date.now() > handstandStart + 1000) {
              setRecordingStatus('middle')
            }
            break
          }
          case 'middle': {
            if (
              pose == null ||
              poseIsHandstanding === false ||
              (DebugMode && debugOverrideHandstandState === false)
            ) {
              setHandstandEnd(Date.now())
              setRecordingStatus('possible-end')
            }
            break
          }
          case 'possible-end': {
            if (handstandEnd == null) {
              throw new Error(
                `Internal Error: 'handstandEnd' should have a value, but was not found.`,
              )
            }
            if (Date.now() > handstandEnd + 1000) {
              setReplayVideoURLs((v) => {
                if (mediaRecorder == null) {
                  throw new Error(`MediaRecorder not found`)
                }
                const blob = new Blob([...chunks.current], {
                  type: 'video/mp4',
                })
                const newReplayVideoURLs = [...v, URL.createObjectURL(blob)]

                setHandstandStart(null)
                setHandstandEnd(null)
                setRecordingStatus('passive-recording')
                setCurrentReplayURLIndex(v.length)

                mediaRecorder.stop()
                chunks.current = []
                chunkTimestamps.current = []
                mediaRecorder.start()
                return newReplayVideoURLs
              })
            }
            break
          }
        }
      }
    },
    [
      debugOverrideHandstandState,
      debugWireframes,
      handstandEnd,
      handstandStart,
      recordingStatus,
    ],
  )

  React.useEffect(() => {
    ;(async () => {
      await tf.setBackend('webgl')
      if (videoSrcObject == null) {
        await navigator.mediaDevices
          .getUserMedia({
            video: true,
          })
          .then((source) => {
            setVideoSrcObject(source)
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
      newMediaRecorder.start(200)
      setRecorderStart(Date.now())
      setMediaRecorder(newMediaRecorder)
      setRecordingStatus('passive-recording')
    }
  }, [mediaRecorder, recordingStatus, videoSrcObject])

  React.useEffect(() => {
    if (mediaRecorder !== null) {
      const onDataAvailable = (e: BlobEvent) => {
        chunks.current.push(e.data)
        chunkTimestamps.current.push(e.timeStamp)
      }
      mediaRecorder.ondataavailable = onDataAvailable
      return () => {
        mediaRecorder.removeEventListener('dataavailable', onDataAvailable)
      }
    }
  }, [mediaRecorder, recorderStart, recordingStatus])

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
          setTFReadyStatus('loading')
          setModel(newModel)
          newModel.estimatePoses(thumbnailVideoElement).then(() => {
            setTFReadyStatus('ready')
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
  }, [drawFrame, model])

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
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
      setCanvasDimensions(getCanvasDimensions(sourceAspectRatio))
    }
    window.addEventListener('resize', resize)
    resize() // Call resize once to set initial size
    return () => window.removeEventListener('resize', resize)
  }, [sourceAspectRatio])

  React.useEffect(() => {
    if (thumbnailVideoRef.current != null) {
      thumbnailVideoRef.current.addEventListener(
        'loadedmetadata',
        function () {
          setSourceDimensions({
            width: this.videoWidth,
            height: this.videoHeight,
          })
        },
        false,
      )
    }
  }, [])

  const onDrop = React.useCallback((acceptedFiles: Array<File>) => {
    setVideoSrcObject(acceptedFiles[0])
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
      {currentReplayURLIndex && (
        <video
          id='replay'
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [
              'translate(-50%, -50%)',
              doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
            ].join(' '),
          }}
          src={replayVideoURLs[currentReplayURLIndex]}
          autoPlay
          loop
          controls
        />
      )}
      <HandstandDetectedAlerts isHandstanding={handstandStart != null} />
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
        sourcePreviewWidth={thumbnailWidth}
        sourcePreviewHeight={thumbnailHeight}
        parentWidth={screenDimensions.width}
        parentHeight={screenDimensions.height}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <video
          style={{
            pointerEvents: 'none',
            transform: doesVideoNeedToBeMirrored ? 'scaleX(-1)' : undefined,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 10,
            boxShadow: '0 0 10px #0004',
            overflow: 'hidden',
          }}
          width={thumbnailWidth}
          height={thumbnailHeight}
          muted
          controls={false}
          autoPlay
          loop
          ref={thumbnailVideoRef}
        />
        {DebugMode && (
          <DebugBox
            debugOverrideHandstandState={debugOverrideHandstandState}
            setDebugOverrideHandstandState={setDebugOverrideHandstandState}
            debugWireframes={debugWireframes}
            setDebugWireframes={setDebugWireframes}
          />
        )}
      </CornerSnapper>
    </div>
  )
}

export default App
