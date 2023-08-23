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
  mediaRecorder: MediaRecorder | null
  replayVideoURLs: Array<string>
  replayVideoStartOffets: Array<number>
  currentReplayIndex: number | null
  chunks: Array<BlobPart>
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
  mediaRecorder: null,
  replayVideoURLs: [],
  replayVideoStartOffets: [],
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
      const chunks = state.chunks
      if (state.mimeType == null) {
        throw new Error(`mimeType should not be null`)
      }
      const blob = new Blob([...chunks], {
        type: state.mimeType,
      })
      const newReplayVideoURL = URL.createObjectURL(blob)
      const oldReplayVideoURLs = state.replayVideoURLs

      if (state.handstandStart == null || state.recordingStart == null) {
        throw new Error(`handstandStart and recordingStart should not be null`)
      }
      const newReplayVideoStartOffset =
        state.handstandStart - state.recordingStart - 2000
      const oldReplayVideoStartOffsets = state.replayVideoStartOffets

      if (state.mediaRecorder == null) {
        throw new Error(`mediaRecorder should not be null`)
      }
      state.mediaRecorder.start()
      return {
        replayVideoURLs: [...oldReplayVideoURLs, newReplayVideoURL],
        replayVideoStartOffets: [
          ...oldReplayVideoStartOffsets,
          newReplayVideoStartOffset,
        ],
        currentReplayIndex: oldReplayVideoURLs.length,
        recordingStart: Date.now(),
        handstandStart: null,
        chunks: [],
      }
    }),
  addChunk: (chunk: BlobPart) =>
    set((state) => {
      return { chunks: [...state.chunks, chunk] }
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
