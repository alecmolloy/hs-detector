import * as posedetection from '@tensorflow-models/pose-detection'

export function drawSkeleton(
  pose: posedetection.Pose,
  canvasCtx: CanvasRenderingContext2D,
) {
  function findKeypoint(name: string) {
    return pose.keypoints.find((k) => k.name === name)
  }

  const skeletonKeypoints = [
    [findKeypoint('left_index'), findKeypoint('left_wrist')],
    [findKeypoint('left_wrist'), findKeypoint('left_elbow')],
    [findKeypoint('left_elbow'), findKeypoint('left_shoulder')],
    [findKeypoint('left_shoulder'), findKeypoint('left_hip')],
    [findKeypoint('left_hip'), findKeypoint('left_knee')],
    [findKeypoint('left_knee'), findKeypoint('left_ankle')],
    [findKeypoint('left_ankle'), findKeypoint('left_heel')],
    [findKeypoint('left_heel'), findKeypoint('left_foot_index')],
  ] as [posedetection.Keypoint, posedetection.Keypoint][]
  skeletonKeypoints.forEach(([from, to]) => {
    if (canvasCtx != null) {
      canvasCtx.beginPath()
      canvasCtx.moveTo(from.x, from.y)
      canvasCtx.lineTo(to.x, to.y)
      canvasCtx.stroke()
    }
  })
  pose.keypoints.forEach((keypoint) => {
    if (canvasCtx != null) {
      const { x, y } = keypoint
      canvasCtx.beginPath()
      canvasCtx.arc(x, y, 5, 0, 2 * Math.PI)
      canvasCtx.fillStyle = 'red'
      canvasCtx.fill()
    }
  })
}

export function getCanvasDimensions(sourceAspectRatio: number) {
  const newWidth = window.innerWidth
  const newHeight = window.innerHeight
  const windowAspectRatio = newWidth / newHeight
  if (windowAspectRatio > sourceAspectRatio) {
    return {
      width: newHeight * sourceAspectRatio,
      height: newHeight,
    }
  } else {
    return {
      width: newWidth,
      height: newWidth / sourceAspectRatio,
    }
  }
}
