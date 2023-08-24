import * as posedetection from '@tensorflow-models/pose-detection'
import { create } from 'zustand'

interface State {
  tfReadyStatus: null | 'ready' | 'loading'
  model: posedetection.PoseDetector | null
  canvasDimensions: Dimensions
  sourceDimensions: Dimensions
  recordingStart: number | null
  handstandStart: number | null
  videoSrcObject: MediaProvider | null

  activeMediaRecorder: MediaRecorder | null
  activeMediaRecorderChunks: Array<BlobPart>

  passiveMediaRecorder1: MediaRecorder | null
  passiveMediaRecorder1StartTime: number | null
  passiveMediaRecorder1Chunks: Array<BlobPart>

  passiveMediaRecorder2: MediaRecorder | null
  passiveMediaRecorder2StartTime: number | null
  passiveMediaRecorder2Chunks: Array<BlobPart>

  replayVideoURLs: Array<string>
  currentReplayIndex: number | null
  debugWireframes: boolean
  debugOverrideHandstandState: boolean
  previewCorner: CornerLabel
  mimeType: 'video/webm' | 'video/mp4' | null
  handstandCheckSamples: Array<Sample>
  handstandCheckCounter: number
  isHandstanding: boolean
  triggerReplayPreparationOnNextStop: boolean
}

interface Actions {
  prepareReplay: () => void
  addChunk: (chunk: BlobPart) => void
  doesVideoNeedToBeMirrored: () => boolean
  closeReplay: () => void
  handstandCheckerPush: (sample: Sample) => void
  percentOfPositiveSamplesInLastSecond: () => number | null
  getEarliestHandstandSampleTime: () => number | null
  setNewActiveMediaRecorder: () => void
}

export const useAppState = create<State & Actions>()((set, get) => ({
  tfReadyStatus: null,
  model: null,
  canvasDimensions: {
    width: 0,
    height: 0,
  },
  sourceDimensions: {
    width: 640,
    height: 480,
  },
  recordingStart: null,
  handstandStart: null,
  videoSrcObject: null,

  activeMediaRecorder: null,
  activeMediaRecorderChunks: [],

  passiveMediaRecorder1: null,
  passiveMediaRecorder1StartTime: null,
  passiveMediaRecorder1Chunks: [],

  passiveMediaRecorder2: null,
  passiveMediaRecorder2StartTime: null,
  passiveMediaRecorder2Chunks: [],

  replayVideoURLs: [],
  currentReplayIndex: null,
  chunks: [],
  debugWireframes: false,
  debugOverrideHandstandState: false,
  previewCorner: 'tl',
  mimeType: null,
  handstandCheckSamples: [],
  handstandCheckCounter: 0,
  isHandstanding: false,
  triggerReplayPreparationOnNextStop: false,

  prepareReplay: () =>
    set((state) => {
      const chunks = state.activeMediaRecorderChunks
      if (state.mimeType == null) {
        throw new Error(`mimeType should not be null`)
      }
      const blob = new Blob([...chunks], {
        type: state.mimeType,
      })
      const newReplayVideoURL = URL.createObjectURL(blob)
      const oldReplayVideoURLs = state.replayVideoURLs

      // Reset media recorders
      if (state.passiveMediaRecorder1?.state === 'recording') {
      }

      return {
        replayVideoURLs: [...oldReplayVideoURLs, newReplayVideoURL],
        currentReplayIndex: oldReplayVideoURLs.length,
        recordingStart: Date.now(),
        handstandStart: null,
        activeMediaRecorder: null,
        activeMediaRecorderChunks: [],
      }
    }),
  addChunk: (chunk: BlobPart) =>
    set((state) => {
      return {
        activeMediaRecorderChunks: [...state.activeMediaRecorderChunks, chunk],
      }
    }),
  doesVideoNeedToBeMirrored: () => get().videoSrcObject instanceof MediaStream,
  closeReplay: () => set(() => ({ currentReplayIndex: null })),
  handstandCheckerPush: (sample) =>
    set((state) => {
      const workingHandstandCheckSamples = [...state.handstandCheckSamples]
      workingHandstandCheckSamples.push(sample)
      let workingCounter = state.handstandCheckCounter
      if (sample.isHandstand) {
        workingCounter++
      }

      // Remove outdated samples from the front
      while (
        workingHandstandCheckSamples.length > 0 &&
        sample.timestamp - workingHandstandCheckSamples[0].timestamp > 1000
      ) {
        if (workingHandstandCheckSamples[0].isHandstand) {
          workingCounter--
        }
        workingHandstandCheckSamples.shift()
      }
      return {
        handstandCheckSamples: workingHandstandCheckSamples,
        handstandCheckCounter: workingCounter,
      }
    }),
  percentOfPositiveSamplesInLastSecond: () => {
    const handstandCheckSamples = get().handstandCheckSamples
    const handstandCheckCounter = get().handstandCheckCounter

    // Don't provide an answer if the number of samples is too low
    if (4 > handstandCheckSamples.length) {
      return null
    }
    return handstandCheckCounter / handstandCheckSamples.length
  },
  getEarliestHandstandSampleTime: () => {
    const earliestSample = get().handstandCheckSamples.find(
      (v) => v.isHandstand === true,
    )
    if (earliestSample == null) {
      return null
    } else {
      return earliestSample.timestamp
    }
  },
  setNewActiveMediaRecorder: () =>
    set(() => {
      const passiveMediaRecorder1 = get().passiveMediaRecorder1
      const passiveMediaRecorder1StartTime =
        get().passiveMediaRecorder1StartTime
      const passiveMediaRecorder1Chunks = get().passiveMediaRecorder1Chunks

      const passiveMediaRecorder2 = get().passiveMediaRecorder2
      const passiveMediaRecorder2StartTime =
        get().passiveMediaRecorder2StartTime
      const passiveMediaRecorder2Chunks = get().passiveMediaRecorder2Chunks

      if (passiveMediaRecorder1StartTime == null) {
        throw new Error(`passiveMediaRecorder1StartTime should not be null`)
      }

      if (passiveMediaRecorder2StartTime == null) {
        if (passiveMediaRecorder2?.state === 'recording') {
          throw new Error(
            'passiveMediaRecorder2StartTime should not be null while passiveMediaRecorder2 is recording',
          )
        }
        passiveMediaRecorder2?.stop()
        return {
          activeMediaRecorder: passiveMediaRecorder1,
          activeMediaRecorderChunks: passiveMediaRecorder1Chunks,
        }
      } else {
        if (passiveMediaRecorder1StartTime < passiveMediaRecorder2StartTime) {
          if (passiveMediaRecorder2?.state === 'recording') {
            passiveMediaRecorder2.stop()
          } else {
            throw new Error('passiveMediaRecorder2 should have been recording')
          }
          return {
            activeMediaRecorder: passiveMediaRecorder1,
            activeMediaRecorderChunks: passiveMediaRecorder1Chunks,
          }
        } else {
          console.log(passiveMediaRecorder1?.state)
          if (passiveMediaRecorder1?.state === 'recording') {
            passiveMediaRecorder1.stop()
          } else {
            throw new Error('passiveMediaRecorder1 should have been recording')
          }
          return {
            activeMediaRecorder: passiveMediaRecorder2,
            activeMediaRecorderChunks: passiveMediaRecorder2Chunks,
          }
        }
      }
    }),
}))

export interface Dimensions {
  width: number
  height: number
}

export type CornerLabel = 'tl' | 'tr' | 'br' | 'bl'

type Sample = {
  timestamp: number
  isHandstand: boolean
}

export function sample(timestamp: number, isHandstand: boolean): Sample {
  return { timestamp, isHandstand }
}
