import React from 'react'

export const RecordingLabel: React.FunctionComponent = () => (
  <div
    style={{
      height: 10,
      animation: 'pulse 3s infinite ease-in-out',
      backgroundColor: 'rgb(231, 7, 7)',
      color: 'white',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      top: 8,
      left: 8,
      padding: 6,
      borderRadius: 5,
      fontSize: 10,
      fontWeight: 700,
    }}
  >
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 6,
        backgroundColor: 'white',
        marginRight: 4,
      }}
    />
    <div style={{ position: 'relative', bottom: 0.5 }}>Recording</div>
  </div>
)
