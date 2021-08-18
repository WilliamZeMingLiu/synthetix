import { Alert } from 'antd';

export default function NotConnected() {

  return (
    <Alert
      description="Wallet is not connected!"
      type="warning"
      showIcon
    />
  )
}