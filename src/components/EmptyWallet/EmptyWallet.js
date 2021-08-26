import { Alert } from 'antd';

export default function EmptyWallet() {

  return (
    <Alert
      description="Your balance is empty"
      type="error"
      showIcon
    />
  )
}