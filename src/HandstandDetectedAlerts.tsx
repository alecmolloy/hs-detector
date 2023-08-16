import { HandstandDetectedAlert } from './HandstandDetectedAlert'

interface HandstandDetectedAlertsProps {
  isHandstanding: boolean
}

export const HandstandDetectedAlerts: React.FC<
  React.PropsWithChildren<HandstandDetectedAlertsProps>
> = ({ isHandstanding }) =>
  isHandstanding ? (
    <div
      style={{
        animation: 'pulse 1s infinite ease-in-out',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <HandstandDetectedAlert style={{ bottom: 20 }} />
      <HandstandDetectedAlert
        style={{
          transform: 'translateX(50%) translate(-300px, 50px) rotate(10deg) ',
        }}
      />
      <HandstandDetectedAlert
        style={{
          transform: 'translateX(50%) translate(-120px, 120px) rotate(45deg) ',
        }}
      />
      <HandstandDetectedAlert
        style={{
          bottom: 0,
          transform: 'translateX(-50%) translate(200px, -100px) rotate(25deg) ',
        }}
      />
      <HandstandDetectedAlert
        style={{
          transform: 'translateX(-50%) translate(400px, 100px) rotate(-15deg) ',
        }}
      />
    </div>
  ) : null
