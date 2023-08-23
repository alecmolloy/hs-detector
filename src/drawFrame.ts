import * as posedetection from '@tensorflow-models/pose-detection'

import { DebugMode } from './App'
import { sample, useAppState } from './state'
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
      : isPoseAHandstand(pose)

    useAppState
      .getState()
      .handstandCheckerPush(sample(Date.now(), poseIsHandstanding))

    const mediaRecorder = useAppState.getState().mediaRecorder
    if (mediaRecorder == null) {
      throw new Error(`MediaRecorder not found`)
    }

    const percentOfPositiveSamplesInLastSecond = useAppState
      .getState()
      .percentOfPositiveSamplesInLastSecond()

    const wasHandstanding = useAppState.getState().handstandStart != null

    if (percentOfPositiveSamplesInLastSecond == null) {
      console.log('not enough samples to make judgement')
    } else {
      if (wasHandstanding) {
        if (percentOfPositiveSamplesInLastSecond >= 0.2) {
          // NO_OP
        } else {
          console.log('stopping')
          mediaRecorder.stop()
          useAppState.setState({
            isHandstanding: false,
            triggerReplayPreparationOnNextStop: true,
          })
        }
      } else {
        if (percentOfPositiveSamplesInLastSecond >= 0.8) {
          console.log('starting')
          const handstandStart = useAppState
            .getState()
            .getEarliestHandstandSampleTime()
          if (handstandStart == null) {
            throw new Error(
              `Internal Error: 'handstandStart' should have a value, but was not found.`,
            )
          }
          useAppState.setState({
            isHandstanding: true,
            handstandStart,
          })
        } else {
          // No_OP
        }
      }
    }
  }
}
