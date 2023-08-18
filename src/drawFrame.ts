import * as posedetection from '@tensorflow-models/pose-detection'

import { DebugMode } from './App'
import { useAppState } from './state'
import {
  drawSkeleton,
  getCanvasSkeletonScaleFactorFromSource,
  isPoseAHandstand,
} from './utils'

export const drawFrame = async (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  model: posedetection.PoseDetector | null,
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
    const poses = await (model as posedetection.PoseDetector).estimatePoses(
      videoElement,
    )
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height,
    )

    const pose: posedetection.Pose | undefined = poses[0]
    const debugWireframes = useAppState.getState().debugWireframes
    if (debugWireframes && pose != null) {
      drawSkeleton(
        pose,
        canvasCtx,
        getCanvasSkeletonScaleFactorFromSource(videoElement, canvasElement),
      )
    }

    const debugOverrideHandstandState =
      useAppState.getState().debugOverrideHandstandState
    const poseIsHandstanding = DebugMode
      ? debugOverrideHandstandState
      : pose != null
      ? isPoseAHandstand(pose)
      : false

    const recordingStatus = useAppState.getState().recordingStatus

    switch (recordingStatus) {
      case 'passive-recording': {
        if (poseIsHandstanding || debugOverrideHandstandState) {
          useAppState.setState({
            handstandStart: Date.now(),
            recordingStatus: 'possible-start',
          })
        }
        break
      }
      case 'possible-start': {
        const handstandStart = useAppState.getState().handstandStart
        if (handstandStart == null) {
          throw new Error(
            `Internal Error: 'handstandStart' should have a value, but was not found.`,
          )
        }
        if (
          pose == null ||
          poseIsHandstanding === false ||
          (DebugMode && debugOverrideHandstandState === false)
        ) {
          useAppState.setState({
            handstandEnd: Date.now(),
            recordingStatus: 'possible-end',
          })
        } else if (Date.now() > handstandStart + 1000) {
          useAppState.setState({
            recordingStatus: 'middle',
          })
        }
        break
      }
      case 'middle': {
        if (
          pose == null ||
          poseIsHandstanding === false ||
          (DebugMode && debugOverrideHandstandState === false)
        ) {
          useAppState.setState({
            handstandEnd: Date.now(),
            recordingStatus: 'possible-end',
          })
        }
        break
      }
      case 'possible-end': {
        const handstandEnd = useAppState.getState().handstandEnd
        if (handstandEnd == null) {
          throw new Error(
            `Internal Error: 'handstandEnd' should have a value, but was not found.`,
          )
        }
        if (Date.now() > handstandEnd + 1000) {
          useAppState.setState({
            recordingStatus: 'preparing-replay',
          })
        }
        break
      }
      case 'preparing-replay': {
        const mediaRecorder = useAppState.getState().mediaRecorder
        if (mediaRecorder == null) {
          throw new Error(`MediaRecorder not found`)
        }
        mediaRecorder.stop()
        break
      }
    }
  }
}
