// okay, so all we need to do here is make a detector for when
// AHHHHH THIS IS GOOD!!!!!!!!!
// :) :) :)
// okay, so handstand detector. it does pose detection to detect the start and end of a handstand, so you can have an auto-replay of your last handstand, over and over again.

import * as posedetection from '@tensorflow-models/pose-detection'
import React from 'react'
import { Canvas } from './Canvas'
import { CornerSnapper } from './CornerSnapper'
import * as tf from '@tensorflow/tfjs'
import { drawSkeleton, getCanvasDimensions } from './utils'

const DebugMode = false

interface Dimensions {
  width: number
  height: number
}

const drawFrame = async (
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
    const pose = poses[0]
    if (DebugMode) {
      drawSkeleton(pose, canvasCtx)
    }
  }
  window.requestAnimationFrame(() =>
    drawFrame(videoElement, canvasElement, model),
  )
}

const App = () => {
  const thumbnailVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const backgroundVideoRef = React.useRef<HTMLVideoElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const rafId = React.useRef<number | null>(null)

  const [tfReadyStatus, setTFReadyStatus] = React.useState<
    null | 'loading' | 'ready'
  >(null)

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

  React.useEffect(() => {
    const thumbnailVideoElement = thumbnailVideoRef.current
    const backgroundVideoElement = backgroundVideoRef.current
    const canvasElement = canvasRef.current
    ;(async () => {
      await tf.setBackend('webgl')
      if (
        canvasElement != null &&
        thumbnailVideoElement != null &&
        backgroundVideoElement != null
      ) {
        if (
          backgroundVideoElement.srcObject == null ||
          thumbnailVideoElement.srcObject == null
        ) {
          const srcObject = await navigator.mediaDevices
            .getUserMedia({
              video: true,
            })
            .catch(() => {
              throw new Error("Can't get webcam video.")
            })
          backgroundVideoElement.srcObject = srcObject
          thumbnailVideoElement.srcObject = srcObject
        }
        if (tfReadyStatus == null) {
          posedetection
            .createDetector(posedetection.SupportedModels.BlazePose, {
              runtime: 'tfjs',
              enableSmoothing: true,
              modelType: 'full',
            })
            .then((newModel) => {
              setTFReadyStatus('loading')
              rafId.current = window.requestAnimationFrame(() => {
                drawFrame(thumbnailVideoElement, canvasElement, newModel)
                setTFReadyStatus('ready')
              })
            })
            .catch(() => {
              throw new Error("Can't initialize pose detection.")
            })
          // Cleanup
          return () => {
            if (rafId.current != null) {
              window.cancelAnimationFrame(rafId.current)
            }
          }
        }
      }
    })()
  }, [tfReadyStatus])

  const sourceAspectRatio = sourceDimensions.width / sourceDimensions.height
  const thumbnailHeight = 100
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

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        position: 'relative',
      }}
    >
      <Canvas
        id='hallå'
        style={{ display: tfReadyStatus === 'ready' ? undefined : 'none' }}
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
      />
      {tfReadyStatus !== 'ready' && (
        <progress
          style={{
            zIndex: 1,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          id='progress-bar'
        />
      )}
      <CornerSnapper
        sourcePreviewWidth={thumbnailWidth}
        sourcePreviewHeight={thumbnailHeight}
        parentWidth={screenDimensions.width}
        parentHeight={screenDimensions.height}
      >
        <video
          style={{ pointerEvents: 'none' }}
          width={thumbnailWidth}
          height={thumbnailHeight}
          muted
          controls={false}
          autoPlay
          ref={thumbnailVideoRef}
        />
      </CornerSnapper>
      <video
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          objectFit: 'cover',
          filter: 'blur(20px)',
        }}
        muted
        controls={false}
        autoPlay
        ref={backgroundVideoRef}
      />
    </div>
  )
}

export default App
