import Box from '../../components/Box/Box.js';

import { Button, Result } from 'antd';

export default function TxConfirm(props) {
  const status = props.status;
  const title = props.title;
  const txMsg = props.txMsg;
  const txResult = props.txResult;
  const returnFunc = props.returnFunc;

  return (
    <Box content={
      <Result
        status={status}
        title={title}
        subTitle={
          <div>
            <p>
              {status === 'success' ? <>{txMsg}<br /><br /></> : null}
              {txResult}
            </p>
          </div>
        }
        extra={[
          <Button 
            type="primary" 
            key="console"
            onClick={() => returnFunc(null)}
          >
            Back
          </Button>
        ]}
      />
    }/>
  )
}