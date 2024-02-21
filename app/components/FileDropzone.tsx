import React from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppState } from '../state'

export const FileDropzone = () => {
  const onDrop = (acceptedFiles: Array<File>) => {
    useAppState.setState({
      videoSrcObject: acceptedFiles[0],
      activeMediaRecorder: null,
    })
  }

  const { getRootProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 })

  return (
    <>
      {isDragActive && (
        <div
          style={{
            height: 'calc(100% - 100px - 20px)',
            width: 'calc(100% - 100px - 20px)',
            position: 'absolute',
            top: 0,
            left: 0,
            margin: 50,
            borderWidth: 10,
            borderStyle: 'dashed',
            borderColor: '#0006',
            pointerEvents: 'none',
            borderRadius: 20,
          }}
        />
      )}
      <div
        id='file-dropzone'
        {...getRootProps()}
        style={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
