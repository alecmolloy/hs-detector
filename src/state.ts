import * as posedetection from '@tensorflow-models/pose-detection'
import { create } from 'zustand'

interface State {
  tfReadyStatus: null | 'ready' | 'loading'
  model: posedetection.PoseDetector | null
  recordingStatus:
    | null
    | 'passive-recording'
    | 'possible-start'
    | 'middle'
    | 'possible-end'
    | 'preparing-replay'
  screenDimensions: Dimensions
  canvasDimensions: Dimensions
  sourceDimensions: Dimensions
  recordingStart: number | null
  handstandStart: number | null
  handstandEnd: number | null
  videoSrcObject: MediaProvider | null
  mediaRecorder: MediaRecorder | null
  replayVideoURLs: Array<string>
  replayVideoStartOffets: Array<number>
  currentReplayIndex: number | null
  chunks: Array<BlobPart>
  debugWireframes: boolean
  debugOverrideHandstandState: boolean
  previewCorner: CornerLabel
}

interface Actions {
  prepareReplay: () => void
  addChunk: (chunk: BlobPart) => void
}

export const useAppState = create<State & Actions>()((set) => ({
  tfReadyStatus: null,
  model: null,
  recordingStatus: null,
  screenDimensions: {
    width: window.innerWidth,
    height: window.innerHeight,
  },
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
  handstandEnd: null,
  videoSrcObject: null,
  mediaRecorder: null,
  replayVideoURLs: [],
  replayVideoStartOffets: [],
  currentReplayIndex: null,
  chunks: [],
  debugWireframes: true,
  debugOverrideHandstandState: false,

  prepareReplay: () =>
    set((state) => {
      const chunks = state.chunks
      const blob = new Blob([...chunks], {
        type: 'video/mp4',
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
        handstandEnd: null,
        recordingStatus: 'passive-recording',
        chunks: [],
      }
    }),
  previewCorner: 'tl',
  addChunk: (chunk: BlobPart) =>
    set((state) => {
      return { chunks: [...state.chunks, chunk] }
    }),
}))

export interface Dimensions {
  width: number
  height: number
}

export type CornerLabel = 'tl' | 'tr' | 'br' | 'bl'
