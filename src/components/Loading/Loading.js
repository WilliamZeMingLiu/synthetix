import './Loading.css';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

export default function Loading(props) {  
  return (
    <div className={props.css}>
      <Spin 
        tip="Loading..." 
        indicator={
          <LoadingOutlined className="spin-icon" style={{ fontSize: '50px' }} />
        }
        style={{ fontSize: '18px' }}
      />
    </div>
  );
}