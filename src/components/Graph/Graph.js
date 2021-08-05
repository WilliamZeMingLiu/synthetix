// import './Graph.css';

import { Empty } from 'antd';

import Chart from "react-apexcharts";

export default function Graph(props) {

  const options = props.options;
  const series = props.series;
  const height = props.height;
  const type = props.type;

  if(!options || !series) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <Chart
      options={options}
      series={series}
      height={height}
      type={type}
    />
  );
}