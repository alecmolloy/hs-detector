import * as posedetection from '@tensorflow-models/pose-detection'

import { DebugMode } from './App'
import { handstandFrameSample, useAppState } from './state'
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
  const passiveMediaRecorder1 = useAppState.getState().passiveMediaRecorder1
  const passiveMediaRecorder2 = useAppState.getState().passiveMediaRecorder2

  if (
    videoElement != null &&
    canvasElement != null &&
    videoElement.videoWidth !== 0 &&
    videoElement.videoHeight !== 0 &&
    passiveMediaRecorder1 != null &&
    passiveMediaRecorder2 != null
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
      .handstandCheckerPush(
        handstandFrameSample(Date.now(), poseIsHandstanding),
      )

    const percentOfPositiveSamplesInLastSecond = useAppState
      .getState()
      .percentOfPositiveSamplesInLastSecond()

    const recordingLastScreenshotTime =
      useAppState.getState().recordingLastScreenshotTime

    if (percentOfPositiveSamplesInLastSecond == null) {
      console.log('not enough samples to make judgement')
    } else {
      const wasHandstanding = useAppState.getState().isHandstanding
      if (wasHandstanding) {
        if (percentOfPositiveSamplesInLastSecond >= 0.2) {
          if (recordingLastScreenshotTime == null) {
            useAppState.setState({
              recordingScreenshotURLs: [canvasElement.toDataURL()],
              recordingLastScreenshotTime: Date.now(),
            })
          } else if (recordingLastScreenshotTime + 1000 < Date.now()) {
            useAppState.setState({
              recordingScreenshotURLs: [
                ...useAppState.getState().recordingScreenshotURLs,
                canvasElement.toDataURL(),
              ],
              recordingLastScreenshotTime: Date.now(),
            })
          }
        } else {
          const activeMediaRecorder = useAppState.getState().activeMediaRecorder
          if (activeMediaRecorder == null) {
            throw new Error(`MediaRecorder not found`)
          }
          useAppState.setState({
            isHandstanding: false,
            triggerReplayPreparationOnNextStop: true,
            handstandEnd: Date.now(),
          })
          activeMediaRecorder.stop()
        }
      } else {
        if (percentOfPositiveSamplesInLastSecond >= 0.8) {
          const newHandstandStart = useAppState
            .getState()
            .getEarliestHandstandSampleTime()
          if (newHandstandStart == null) {
            throw new Error(
              `Internal Error: 'handstandStart' should have a value, but was not found.`,
            )
          }
          // this should only be running once
          console.log('its running, only once for sure!')
          useAppState.getState().setNewActiveMediaRecorder()
          useAppState.setState({
            isHandstanding: true,
            handstandStart: newHandstandStart,
          })
        } else {
          // if a PassiveMediaRecorder is older than two seconds, stop it, discard
          // the buffer, and restart it.
          const passiveMediaRecorder1StartTime =
            useAppState.getState().passiveMediaRecorder1StartTime
          const passiveMediaRecorder2StartTime =
            useAppState.getState().passiveMediaRecorder2StartTime
          if (
            passiveMediaRecorder1StartTime != null &&
            Date.now() - passiveMediaRecorder1StartTime > 2000
          ) {
            passiveMediaRecorder1.stop()
            useAppState.setState({
              passiveMediaRecorder1Chunks: [],
              passiveMediaRecorder1StartTime: Date.now(),
            })
            passiveMediaRecorder1.start()
          } else if (
            (passiveMediaRecorder2StartTime != null &&
              Date.now() - passiveMediaRecorder2StartTime > 2000) ||
            // This helps to keep both of these recorders in sync, and also will
            // start the second recorder for the first time.
            (passiveMediaRecorder1StartTime != null &&
              Date.now() - passiveMediaRecorder1StartTime > 1000)
          ) {
            if (passiveMediaRecorder2.state !== 'inactive') {
              passiveMediaRecorder2.stop()
            }
            useAppState.setState({
              passiveMediaRecorder2Chunks: [],
              passiveMediaRecorder2StartTime: Date.now(),
            })
            passiveMediaRecorder2.start()
          }
        }
      }
    }
  }
}
