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
  mimeType: 'video/webm' | 'video/mp4' | null
}

interface Actions {
  prepareReplay: () => void
  addChunk: (chunk: BlobPart) => void
  doesVideoNeedToBeMirrored: () => boolean
  closeReplay: () => void
}

export const useAppState = create<State & Actions>()((set, get) => ({
  tfReadyStatus: null,
  model: null,
  recordingStatus: null,
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
  debugWireframes: false,
  debugOverrideHandstandState: false,
  previewCorner: 'tl',
  mimeType: null,

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
        handstandEnd: null,
        recordingStatus: 'passive-recording',
        chunks: [],
      }
    }),
  addChunk: (chunk: BlobPart) =>
    set((state) => {
      return { chunks: [...state.chunks, chunk] }
    }),
  doesVideoNeedToBeMirrored: () => get().videoSrcObject instanceof MediaStream,
  closeReplay: () => set(() => ({ currentReplayIndex: null })),
}))

export interface Dimensions {
  width: number
  height: number
}

export type CornerLabel = 'tl' | 'tr' | 'br' | 'bl'
