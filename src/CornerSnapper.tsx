import { animated, useSpring } from '@react-spring/web'
import { useDrag, rubberbandIfOutOfBounds } from '@use-gesture/react'
import React from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import { CornerLabel, useAppState } from './state'

interface CornerSnapperProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

const cornerPadding = 20

export const CornerSnapper: React.FC<
  React.PropsWithChildren<CornerSnapperProps>
> = ({ style, children }) => {
  const ref = React.useRef<HTMLDivElement>(null)

  const [videoDimensions, setVideoDimensions] = React.useState<DOMRect | null>(
    null,
  )

  const screenDimensions = useAppState((s) => s.screenDimensions)

  // Set the initial position
  const [spring, api] = useSpring(() => ({
    x: cornerPadding,
    y: cornerPadding,
    onRest: (e) => {
      const closestCorner = getClosestCornerCoordinates(0, 0)
      let closestCornerLabel: CornerLabel | null = null
      Object.keys(corners).forEach((key) => {
        const label = key as CornerLabel
        if (
          corners[label].x === closestCorner.x &&
          corners[label].y === closestCorner.y
        ) {
          closestCornerLabel = label
        }
      })
      if (closestCornerLabel == null) {
        throw new Error('closestCornerLabel should not be null')
      }
      useAppState.setState({ previewCorner: closestCornerLabel })
    },
  }))

  // Store the drag offset
  const offset = React.useRef({ x: cornerPadding, y: cornerPadding })

  React.useLayoutEffect(() => {
    if (ref.current == null) {
      throw new Error('ref.current should not be null')
    }
    setVideoDimensions(ref.current.getBoundingClientRect())
  }, [])

  useResizeObserver(ref, (entry) => setVideoDimensions(entry.contentRect))

  // Define the corner positions
  const corners = React.useMemo(
    () => ({
      tl: { x: cornerPadding, y: cornerPadding },
      tr: {
        x:
          screenDimensions.width -
          (videoDimensions?.width ?? 0) -
          cornerPadding,
        y: cornerPadding,
      },
      bl: {
        x: cornerPadding,
        y:
          screenDimensions.height -
          (videoDimensions?.height ?? 0) -
          cornerPadding,
      },
      br: {
        x:
          screenDimensions.width -
          (videoDimensions?.width ?? 0) -
          cornerPadding,
        y:
          screenDimensions.height -
          (videoDimensions?.height ?? 0) -
          cornerPadding,
      },
    }),
    [screenDimensions, videoDimensions],
  )

  const getClosestCornerCoordinates = React.useCallback(
    (dx: number, dy: number) => {
      return [corners.tl, corners.tr, corners.bl, corners.br].reduce(
        (prev, curr) =>
          Math.hypot(
            spring.x.get() + dx - curr.x,
            spring.y.get() + dy - curr.y,
          ) <
          Math.hypot(spring.x.get() + dx - prev.x, spring.y.get() + dy - prev.y)
            ? curr
            : prev,
      )
    },
    [corners, spring],
  )

  const goToClosestCorner = React.useCallback(
    (dx: number, dy: number, immediate: boolean) => {
      const closestCorner = getClosestCornerCoordinates(dx, dy)

      // Snap to the closest corner
      api.start({ x: closestCorner.x, y: closestCorner.y, immediate })

      // Update the drag offset
      offset.current = closestCorner
    },
    [api, getClosestCornerCoordinates],
  )

  const bind = useDrag(({ down, movement: [dx, dy], last }) => {
    if (down) {
      const targetX = dx + offset.current.x
      const targetY = dy + offset.current.y

      // Apply the drag offset to the current position
      api.set({
        x: rubberbandIfOutOfBounds(targetX, corners.tl.x, corners.tr.x),
        y: rubberbandIfOutOfBounds(targetY, corners.tl.y, corners.bl.y),
      })
    } else if (last) {
      goToClosestCorner(dx, dy, false)
    }
  })

  // for some reason, this doesn't work. It seems the cleanup function is running before
  // the updatePosition callback has a chance to run. Never seen this before. Not sure
  // what to do.

  React.useEffect(() => {
    const updatePosition = () => {
      goToClosestCorner(0, 0, true)
    }
    window.addEventListener('resize', updatePosition)
    updatePosition()
    return () => {
      window.removeEventListener('resize', updatePosition)
    }
  }, [goToClosestCorner])

  return (
    <animated.div
      ref={ref}
      {...bind()}
      style={{
        ...spring,
        position: 'absolute',
        touchAction: 'none',
        ...style,
      }}
    >
      {children}
    </animated.div>
  )
}
