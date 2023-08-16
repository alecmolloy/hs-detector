import { animated, useSpring } from '@react-spring/web'
import { useDrag, rubberbandIfOutOfBounds } from '@use-gesture/react'
import React from 'react'

interface CornerSnapperProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  sourcePreviewWidth: number
  sourcePreviewHeight: number
  parentWidth: number
  parentHeight: number
}

const cornerPadding = 20

export const CornerSnapper: React.FC<
  React.PropsWithChildren<CornerSnapperProps>
> = ({
  sourcePreviewWidth,
  sourcePreviewHeight,
  parentWidth,
  parentHeight,
  style,
  children,
}) => {
  // Define the corner positions
  const corners = React.useMemo(
    () => ({
      tl: { x: cornerPadding, y: cornerPadding },
      tr: {
        x: parentWidth - sourcePreviewWidth - cornerPadding,
        y: cornerPadding,
      },
      bl: {
        x: cornerPadding,
        y: parentHeight - sourcePreviewHeight - cornerPadding,
      },
      br: {
        x: parentWidth - sourcePreviewWidth - cornerPadding,
        y: parentHeight - sourcePreviewHeight - cornerPadding,
      },
    }),
    [parentHeight, parentWidth, sourcePreviewHeight, sourcePreviewWidth],
  )

  // Set the initial position
  const [spring, api] = useSpring(() => ({
    x: cornerPadding,
    y: cornerPadding,
  }))

  // Store the drag offset
  const offset = React.useRef({ x: cornerPadding, y: cornerPadding })

  const goToClosestCorner = React.useCallback(
    (mx: number, my: number, immediate: boolean) => {
      const closestCorner = [
        corners.tl,
        corners.tr,
        corners.bl,
        corners.br,
      ].reduce((prev, curr) =>
        Math.hypot(spring.x.get() + mx - curr.x, spring.y.get() + my - curr.y) <
        Math.hypot(spring.x.get() + mx - prev.x, spring.y.get() + my - prev.y)
          ? curr
          : prev,
      )

      // Snap to the closest corner
      api.start({ x: closestCorner.x, y: closestCorner.y, immediate })

      // Update the drag offset
      offset.current = closestCorner
    },
    [api, corners, spring],
  )

  const bind = useDrag(({ down, movement: [mx, my], last }) => {
    if (down) {
      const targetX = mx + offset.current.x
      const targetY = my + offset.current.y

      // Apply the drag offset to the current position
      api.set({
        x: rubberbandIfOutOfBounds(targetX, corners.tl.x, corners.tr.x),
        y: rubberbandIfOutOfBounds(targetY, corners.tl.y, corners.bl.y),
      })
    } else if (last) {
      goToClosestCorner(mx, my, false)
    }
  })

  React.useEffect(() => {
    const updatePosition = () => {
      goToClosestCorner(0, 0, true)
    }
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
    }
  }, [goToClosestCorner])

  return (
    <animated.div
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
