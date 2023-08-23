import { POSE_CONNECTIONS } from '@mediapipe/pose'
import * as posedetection from '@tensorflow-models/pose-detection'

export function drawSkeleton(
  pose: posedetection.Pose,
  canvasCtx: CanvasRenderingContext2D,
  scaleFactor: number,
) {
  const skeletonKeypoints = POSE_CONNECTIONS.map(([a, b]) => [
    pose.keypoints[a],
    pose.keypoints[b],
  ])

  skeletonKeypoints.forEach(([from, to]) => {
    if (canvasCtx != null) {
      canvasCtx.beginPath()
      canvasCtx.moveTo(from.x * scaleFactor, from.y * scaleFactor)
      canvasCtx.lineTo(to.x * scaleFactor, to.y * scaleFactor)
      canvasCtx.stroke()
    }
  })
  pose.keypoints.forEach((keypoint) => {
    if (canvasCtx != null) {
      const { x, y } = keypoint
      canvasCtx.beginPath()
      canvasCtx.arc(x * scaleFactor, y * scaleFactor, 5, 0, 2 * Math.PI)
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

const BLAZEPOSE_KEYPOINTS = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
] as const

type BlazePoseKeypoint = (typeof BLAZEPOSE_KEYPOINTS)[number]

export function findKeypoint(pose: posedetection.Pose) {
  return (keypointName: BlazePoseKeypoint): posedetection.Keypoint => {
    const match = pose.keypoints3D?.find((k) => {
      if (k.name == null) {
        throw new Error(`Cannot find 'name' on keypoint: ${JSON.stringify(k)}`)
      }
      return (k.name as BlazePoseKeypoint) === keypointName
    })
    if (match == null) {
      throw new Error(`Cannot find matching keypoint with name ${keypointName}`)
    }
    return match
  }
}

export function isPoseAHandstand(pose?: posedetection.Pose): boolean {
  if (pose == null) {
    return false
  }
  const find = findKeypoint(pose)
  const leftWrist = find('left_wrist')
  const rightWrist = find('right_wrist')
  const leftAnkle = find('left_ankle')
  const rightAnkle = find('right_ankle')

  if (
    leftWrist == null ||
    rightWrist == null ||
    leftAnkle == null ||
    rightAnkle == null
  ) {
    throw new Error(`Cannot find sufficient keypoints.`)
  }
  if (
    (leftAnkle.y < leftWrist.y || leftAnkle.y < rightWrist.y) &&
    (rightAnkle.y < rightWrist.y || rightAnkle.y < leftWrist.y)
  ) {
    return true
  } else {
    return false
  }
}

export function getCanvasSkeletonScaleFactorFromSource(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
): number {
  return canvasElement.width / videoElement.width
}

export function isMutableRefObject<T extends HTMLElement>(
  ref: React.ForwardedRef<T>,
): ref is React.MutableRefObject<T> {
  if (ref != null && Object.hasOwn(ref, 'current')) {
    return true
  } else {
    return false
  }
}
