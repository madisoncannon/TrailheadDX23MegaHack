import { LightningElement, api } from 'lwc';
import chartjs from '@salesforce/resourceUrl/ChartJS';
import { NavigationMixin } from 'lightning/navigation';
import { loadScript } from 'lightning/platformResourceLoader';
import saveChartImage from '@salesforce/apex/ExpenseDataChartController.saveChartImage';

const generateRandomColor = () => {
    const o = Math.round,
      r = Math.random,
      s = 255;
    return 'rgb(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ')';
  }

const groupBy = (objectArray, property) => {
    return objectArray.reduce((acc, obj) => {
      const key = obj[property];
      const curGroup = acc[key] ?? [];
  
      return { ...acc, [key]: [...curGroup, obj] };
    }, {});
}

const sumAmount = (objects) => {
    return objects.reduce(
    (accumulator, currentValue) => accumulator + currentValue.Amount__c,
    0,
  );
}
  
export default class ExpenseDataChart extends NavigationMixin(
    LightningElement
) {
    error;
    chart;
    chartjsInitialized = false;
    @api 
    expenseData
    @api
    startDate
    @api
    endDate
    @api
    doSendToSlack = false;
    @api
    chartImageFileId;
    _disableButton = false;

    handleOnclickSendToSlack(event) {
        this.doSendToSlack = event.target.checked;
    }

    handleSaveAsImage() {
        const base64Image = this.chart.toBase64Image();
        this.createFile(base64Image);
    }

    get disableButton() {
        return this._disableButton;
    }

    createFile(base64Image) {
        const startDate = this.startDate;
        const endDate = this.endDate;
        saveChartImage({base64Image, startDate, endDate}).then( result => {
            this.chartImageFileId = result;
            this._disableButton = true;

        })
        .catch(error => {
            this.error = error;
            console.error(error);
        });
        
    }

    renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        if (this.expenseData){ 
        this.chartjsInitialized = true;
        const expenseDataGrouped = groupBy(this.expenseData, "Expense_Type__c");
        const chartData = Object.entries(expenseDataGrouped).map( (entry) => {
            const label = entry[0];
            const values = entry[1];
            const totalAmount = sumAmount(values);
            const color = generateRandomColor();
            return {label, totalAmount, color};
        })
        const config = {
            type: 'doughnut',
            data: {
                datasets: [
                    {
                        data: chartData.map( d => d.totalAmount),
                        backgroundColor: chartData.map( d => d.color),
                        label: 'Total Amount by Expense Type'
                    }
                ],
                labels: chartData.map(d => d.label)
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        };
        


        loadScript(this, chartjs)
            .then(() => {
                const canvas = document.createElement('canvas');
                this.template.querySelector('div.chart').appendChild(canvas);
                const ctx = canvas.getContext('2d');
                this.chart = new window.Chart(ctx, config);
            })
            .catch((error) => {
                this.error = error;
            });
        }
    }
}