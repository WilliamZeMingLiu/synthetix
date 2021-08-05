const numeral = require('numeral');

export const sparklineLineGraph = (data, labels, name) => {
  return {
  	series:[{
  		name: name,
			data: data
		}],

    options:{
      chart: {
        type: 'area',
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        sparkline: {
          enabled: true,
        }
      },
      grid: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 1,
          opacityTo: 1,
        }
      },
      labels: labels,
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        show: false,
        labels: {
          formatter: val => {
            return numeral(val).format('0,0.00') + " UST";
          }
        }
      },
    },
  }
}

export const basicLineGraph = (data, labels, name) => {
	return {
		series: [{
      name: name,
      data: data
    }],
    options: {
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      grid: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 1,
          opacityTo: 1,
        }
      },
      labels: labels,
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        show: false,
        labels: {
          formatter: function (val) {
            return numeral(val).format('0,0.00') + " UST";
          }
        }
      },
    }, 
	}
}

export const basicBarGraph = (data, labels, name) => {
	return {
    series: [{
      name: name,
      data: data

    }],
    options: {
      chart: {
        type: 'bar',
        toolbar: {
          show: false
        }
      },
      grid: {
        show: false
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          horizontal: false,
          dataLabels: {
            position: 'top'
          },
        }
      },
      dataLabels: {
        enabled: false,
      },
      
      yaxis: {
        show: false,
        labels: {
          formatter: function (val) {
            return numeral(val).format('0,0.00') + " UST";
          }
        }
      },
      xaxis: {
        categories: labels.slice(0,10)
      },
    },
  }
}