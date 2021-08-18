import './Box.css';
import React from 'react';


export default function Box(props) {
  return (
    <div className="box">
      {props.content}
    </div>
  );
}