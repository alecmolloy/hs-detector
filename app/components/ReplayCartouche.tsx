import React from 'react'
import { SpringRef, SpringValue, animated, useSpring } from 'react-spring'
import {
  getCurrentlyPlayingCartoucheWidth,
  getXOffsetForReplayCartouche,
} from './ReplaysTimeline'
import { ReplayVideo, useAppState } from '../state'
import { clamp, formatDuration } from '../utils'

const BaseBoxShadow = '0px 0px 10px rgba(0, 0, 0, 0.2)'
const SelectedBoxShadow = '0 0 0 5px rgb(94, 151, 247)'
const DefaultStateBoxShadow = BaseBoxShadow
const SelectedStateBoxShadow = [BaseBoxShadow, SelectedBoxShadow].join(', ')

export const CartoucheHeight = 54
export const CartoucheGap = 16

const NowPlayingCartoucheID = 'now-playing-cartouche'

interface ReplayCartoucheProps {
  replayVideo: ReplayVideo
  index: number
  selected: boolean
  relativeWidths: number[]
  cartouchesContainerAPI: SpringRef<{
    x: number
  }>
  cartoucheWidthsSpring: {
    width: SpringValue<number>
  }
  cartoucheWidthsAPI: SpringRef<{
    width: number
  }>
  replayVideoRef: React.MutableRefObject<HTMLVideoElement | null>
}

export const ReplayCartouche: React.FunctionComponent<ReplayCartoucheProps> = ({
  replayVideo: { handstandLength: length, screenshots },
  selected,
  index,
  relativeWidths,
  cartouchesContainerAPI,
  cartoucheWidthsSpring,
  cartoucheWidthsAPI,
  replayVideoRef,
}) => {
  const [playheadSpring, playheadAPI] = useSpring(() => ({
    x: getPlayheadOffset(replayVideoRef),
  }))

  React.useLayoutEffect(() => {
    let rafId: number

    const frame = () => {
      playheadAPI.set({
        x: getPlayheadOffset(replayVideoRef),
      })
      rafId = window.requestAnimationFrame(frame)
    }

    rafId = window.requestAnimationFrame(frame)
    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [playheadAPI, replayVideoRef])

  const onMouseMove = (e: MouseEvent) => {
    if (replayVideoRef.current != null) {
      scrubToMousePosition(e, replayVideoRef.current)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <animated.div
        id={selected ? NowPlayingCartoucheID : undefined}
        onClick={
          !selected
            ? () => {
                const newX =
                  getCurrentlyPlayingCartoucheWidth() / 2 -
                  getXOffsetForReplayCartouche(relativeWidths, index)
                useAppState.setState({ currentReplayIndex: index })
                cartouchesContainerAPI.start({
                  x: newX,
                })
                cartoucheWidthsAPI.start((i) => ({
                  width:
                    index === i
                      ? getCurrentlyPlayingCartoucheWidth()
                      : relativeWidths[i],
                }))
              }
            : undefined
        }
        onMouseDown={
          selected
            ? (e) => {
                if (replayVideoRef.current != null) {
                  const playOnEndScrub = !replayVideoRef.current.paused
                  scrubToMousePosition(e.nativeEvent, replayVideoRef.current)
                  const onMouseUp = () => {
                    if (
                      playOnEndScrub === true &&
                      replayVideoRef.current != null
                    ) {
                      replayVideoRef.current.play()
                    }
                    window.removeEventListener('mousemove', onMouseMove)
                    window.removeEventListener('mouseup', onMouseUp)
                  }

                  window.addEventListener('mousemove', onMouseMove)
                  window.addEventListener('mouseup', onMouseUp)
                }
              }
            : undefined
        }
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          height: CartoucheHeight,
          borderRadius: 8,
          position: 'relative',
          backgroundColor: '#0004',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: selected ? SelectedStateBoxShadow : DefaultStateBoxShadow,
          overflow: 'hidden',
          minWidth: CartoucheHeight,
          ...cartoucheWidthsSpring,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            padding: 2,
            borderRadius: 4,
            backgroundColor: '#fff8',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {formatDuration(length)}
        </div>
        {screenshots.map((screenshot, i) => (
          <div
            key={i}
            style={{
              maxWidth: '100%',
              flexGrow: 1,
              height: '100%',
              backgroundImage: `url(${screenshot})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              pointerEvents: 'none',
            }}
          />
        ))}
      </animated.div>
      {selected && (
        <animated.div
          style={{
            position: 'absolute',
            top: -8,
            left: -2,
            width: 4,
            borderRadius: 2,
            height: 'calc(100% + 16px)',
            backgroundColor: '#fff',
            boxShadow: '0 0 8px #0008',
            pointerEvents: 'none',
            ...playheadSpring,
          }}
        />
      )}
    </div>
  )
}

function getPlayheadOffset(
  replayVideoRef: React.MutableRefObject<HTMLVideoElement | null>,
) {
  if (replayVideoRef.current != null) {
    const { currentTime, duration } = replayVideoRef.current
    return getCurrentlyPlayingCartoucheWidth() * (currentTime / duration)
  } else {
    return 0
  }
}

function scrubToMousePosition(e: MouseEvent, videoElement: HTMLVideoElement) {
  if (e.target instanceof HTMLElement) {
    videoElement.pause()
    const videoDuration = videoElement.duration
    const { clientX } = e
    const nowPlayingCartouche = document.getElementById(NowPlayingCartoucheID)
    if (nowPlayingCartouche == null) {
      throw new Error(`Couldn't find the Now Playing element`)
    }
    const { left } = nowPlayingCartouche.getBoundingClientRect()
    const currentlyPlayingCartoucheWidth = getCurrentlyPlayingCartoucheWidth()
    const progressInPixels = clamp(
      clientX - left,
      0,
      currentlyPlayingCartoucheWidth,
    )
    const progressNormalised = progressInPixels / currentlyPlayingCartoucheWidth
    const unsafeCurrentTime = progressNormalised * videoDuration * 0.9999

    // videoDuration could be NaN or Infinity
    if (!isNaN(unsafeCurrentTime) && isFinite(unsafeCurrentTime)) {
      videoElement.currentTime =
        // hack to avoid the video ending and wrapping to the beginning
        progressNormalised * videoDuration * 0.9999
    }
  }
}
