interface HandstandDetectedAlertProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {}

export const HandstandDetectedAlert: React.FC<
  React.PropsWithChildren<HandstandDetectedAlertProps>
> = ({ style }) => {
  const text = 'HANDSTAND DETECTED !!! '
  const repeatedText = text.repeat(20) // Increase repetition to fill enough space

  return (
    <div
      style={{
        backgroundColor: '#ED1C24',
        height: 40,
        width: '100%',
        position: 'absolute',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        className='scrolling-text'
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          color: 'white',
          fontWeight: 800,
          fontSize: 20,
          lineHeight: '40px',
          animation: 'scrollText 2s linear infinite', // you can adjust the duration here
        }}
      >
        {repeatedText}
      </div>
    </div>
  )
}
