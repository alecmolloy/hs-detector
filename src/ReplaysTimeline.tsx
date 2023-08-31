import React from 'react'
import { animated, useSpring, useSprings } from 'react-spring'
import {
  CartoucheGap,
  CartoucheHeight,
  ReplayCartouche,
} from './ReplayCartouche'
import { useAppState } from './state'

const ReplaysTimelineID = 'replays-timeline'

interface Props {
  replayVideoRef: React.MutableRefObject<HTMLVideoElement | null>
}

export const ReplaysTimeline: React.FunctionComponent<Props> = ({
  replayVideoRef,
}) => {
  const replayVideos = useAppState((state) => state.replayVideos)
  const currentReplayIndex = useAppState((state) => state.currentReplayIndex)

  const relativeWidths = replayVideos.map(({ handstandLength }) =>
    mapValue(handstandLength, 0, 60_000, CartoucheHeight, CartoucheHeight * 6),
  )

  const calculateCartouchesContainerXOffset = React.useCallback(
    () =>
      currentReplayIndex == null
        ? 0
        : getCurrentlyPlayingCartoucheWidth() / 2 -
          getXOffsetForReplayCartouche(relativeWidths, currentReplayIndex ?? 0),
    [currentReplayIndex, relativeWidths],
  )
  const [cartouchesContainerSpring, cartouchesContainerAPI] = useSpring(() => ({
    x: calculateCartouchesContainerXOffset(),
  }))

  const calculateCartoucheWidths = React.useCallback(
    (i: number) => ({
      width:
        i === currentReplayIndex
          ? getCurrentlyPlayingCartoucheWidth()
          : relativeWidths[i],
    }),
    [currentReplayIndex, relativeWidths],
  )
  const [cartoucheWidthsSprings, cartoucheWidthsAPI] = useSprings(
    replayVideos.length,
    calculateCartoucheWidths,
  )

  React.useEffect(() => {
    cartouchesContainerAPI.start({
      x: calculateCartouchesContainerXOffset(),
    })
    cartoucheWidthsAPI.start(calculateCartoucheWidths)
  }, [
    calculateCartoucheWidths,
    calculateCartouchesContainerXOffset,
    cartoucheWidthsAPI,
    cartouchesContainerAPI,
  ])

  return (
    <div
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        WebkitMaskImage: `-webkit-linear-gradient(left, #0000 0%, #000f 50px, #000f calc(100% - 50px), #0000 100%)`,
        flexGrow: 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <animated.div
        id={ReplaysTimelineID}
        style={{
          alignItems: 'center',
          display: 'flex',
          height: '100%',
          gap: CartoucheGap,
          ...cartouchesContainerSpring,
        }}
      >
        {replayVideos.map((replayVideo, i) => (
          <ReplayCartouche
            key={i}
            replayVideo={replayVideo}
            index={i}
            selected={currentReplayIndex === i}
            relativeWidths={relativeWidths}
            cartouchesContainerAPI={cartouchesContainerAPI}
            cartoucheWidthsSpring={cartoucheWidthsSprings[i]}
            cartoucheWidthsAPI={cartoucheWidthsAPI}
            replayVideoRef={replayVideoRef}
          />
        ))}
      </animated.div>
    </div>
  )
}

function mapValue(
  value: number,
  sourceMin: number,
  sourceMax: number,
  targetMin: number,
  targetMax: number,
): number {
  // Normalize value to [0, 1]
  const normalized = (value - sourceMin) / (sourceMax - sourceMin)

  const steepness = 2

  // Apply shaping function f(x) = 1 - e^(-kx)
  const shaped = 1 - Math.exp(-steepness * normalized)

  // Map the shaped value to the target range
  return targetMin + shaped * (targetMax - targetMin)
}

export function getXOffsetForReplayCartouche(
  relativeWidths: Array<number>,
  index: number,
) {
  let totalWidth = 0
  for (let i = 0; i < index; i++) {
    const length = relativeWidths[i]
    totalWidth += length + CartoucheGap
  }
  return totalWidth
}

export function getCurrentlyPlayingCartoucheWidth() {
  const replaysTimelineElement = document.getElementById(ReplaysTimelineID)
  if (replaysTimelineElement == null) {
    return window.innerWidth / 3
  }
  return replaysTimelineElement.getBoundingClientRect().width / 2
}
