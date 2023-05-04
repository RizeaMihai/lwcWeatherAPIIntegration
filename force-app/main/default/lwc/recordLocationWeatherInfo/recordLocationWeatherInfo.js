// Lightning Web Components module and UI-related modules
import { LightningElement, api, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Static resources
import LOCATION_ERROR_IMAGE from "@salesforce/resourceUrl/locationerror";

// Apex
import getRecordWeatherInformation from '@salesforce/apex/WeatherAPICallout.getRecordWeatherInformation';
import getWeatherDataToStoreInField from '@salesforce/apex/WeatherAPICallout.getWeatherDataToStoreInField';

// Custom labels
import AVG_TEMP from '@salesforce/label/c.AverageTemperatureText';
import BAD_REQUEST_TEXT from '@salesforce/label/c.BadRequestText';
import CARD_TITLE from '@salesforce/label/c.CardTitleText';
import INPUT_TEXT from '@salesforce/label/c.InputLabelText';
import LOCATION_TEXT from '@salesforce/label/c.LocationText';
import MAX_TEMP from '@salesforce/label/c.MaxTemperatureText';
import MIN_TEMP from '@salesforce/label/c.MinTemperatureText';
import PLACEHOLDER from '@salesforce/label/c.PlaceholderText';
import SEARCH_BTN from '@salesforce/label/c.SearchButtonLabel';
import UPDATE_BTN from '@salesforce/label/c.UpdateButtonLabel';

// Fields and objects
import MAILING_CITY_FIELD from '@salesforce/schema/Contact.MailingCity';
import DETAILED_INFO_FIELD from '@salesforce/schema/Contact.WeatherData__c';
import ID_FIELD from '@salesforce/schema/Contact.Id';

// Setting the fields to retrieve for the Contact record
const fields = [MAILING_CITY_FIELD, DETAILED_INFO_FIELD, ID_FIELD];

export default class RecordLocationWeatherInfo extends LightningElement {

    // Public API Property to set the record Id to retrieve weather data
    @api recordId;

    // Boolean flag to handle bad requests
    badRequest = false;

    // Custom Labels
    labels ={
        AVG_TEMP,
        BAD_REQUEST_TEXT,
        CARD_TITLE,
        INPUT_TEXT,
        LOCATION_TEXT,
        MAX_TEMP,
        MIN_TEMP,
        PLACEHOLDER,
        SEARCH_BTN,
        UPDATE_BTN
    }

    // Data variables
    recordData;
    recordLocation;
    mailingCityValue;
    tomorrowTemperature;
    temperatureUnit = 'C';
    weatherDataIcon;
    recordDetailedWeatherData;
    searchValue = '';
    hasRendered = false;

    // Image URLs
    invalidLocationImage = LOCATION_ERROR_IMAGE + '/locationerror/404location.png';

    // Wire adapter for the Contact record, to load it together with the mentioned fields
    @wire(getRecord, { recordId: '$recordId', fields: fields })
    wiredRecord({ error, data }) {
        if (data) {
            this.mailingCityValue =  data['fields']['MailingCity']['value'];
            this.getWeatherInformation();
        } else if (error) {
            console.error(error);
        }
    }
    
    // Function to retrieve weather data and display it in the LWC
    getWeatherInformation() {
        // Calling the Apex method to get weather data from the external API
        if(!this.hasRendered) {
            getRecordWeatherInformation({ recordId: this.recordId, recordCity: this.mailingCityValue })
            .then(result => {
                this.hasRendered = true;
                // Resetting the flag on success
                this.badRequest = false;
                this.recordData = result;
                // Extracting required information from the API data
                this.recordLocation = this.recordData['location']['name'];
                this.tomorrowAvverageTemperature = this.recordData['forecast']['forecastday'][1]['day']['avgtemp_c'];
                this.tomorrowMaxTemperature = this.recordData['forecast']['forecastday'][1]['day']['maxtemp_c'];
                this.tomorrowMinTemperature = this.recordData['forecast']['forecastday'][1]['day']['mintemp_c'];
                this.conditionDetails = this.recordData['current']['condition']['text'];
                this.weatherDataIcon = this.recordData['current']['condition']['icon'];
            })
            .catch(error => {
                // Handling Bad Request error response
                const errorMessage = error['body']['message'];
                const errorStatus = error['status'];
                if (errorMessage.includes('Bad Request') || this.mailingCityValue === null || this.mailingCityValue === undefined) {
                    this.badRequest = true;
                }
                console.error(error);
            });   
        }
    }
    
    // Function to retrieve additional weather data and store itin Contact record WeatherData__c field
    getAdditionalWeatherData() {

        // Calling the Apex method to to get additional weather data as a String from the external API
        getWeatherDataToStoreInField({ recordId: this.recordId, recordCity: this.mailingCityValue })
        .then(result => {
            this.hasRendered = true;
            // Updating the record fields with the new weather data
            const fields = {};
            fields[ID_FIELD.fieldApiName] = this.recordId;
            fields[MAILING_CITY_FIELD.fieldApiName] = this.mailingCityValue;
            fields[DETAILED_INFO_FIELD.fieldApiName] = result;
            const recordInput = { fields };
            updateRecord(recordInput)
            .then(() => {
                this.hasRendered = true;
            })
            .catch(error => {
                // Displaying an error toast message if the record update failed
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error on updating record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
        // Setting the component properties with the updated weather data and resetting badRequest
        this.recordDetailedWeatherData = result;
        this.badRequest = false;
    })
    .catch(error => {
        const errorMessage = error.body.message;
        if (errorMessage.includes('Bad Request') || this.mailingCityValue === null || this.mailingCityValue === undefined) {
            this.badRequest = true;
        }
        console.error(error);
    });
    }

    renderedCallback() {
        if (this.recordId !== null && this.recordId !== undefined && !this.hasRendered) {
            if(this.mailingCityValue == null) {
                return;
            }
            this.getWeatherInformation();
            this.getAdditionalWeatherData();
            this.hasRendered =  true;
        }
    }

    // Function to handle the input change event
    handleInputChange(event) {
        this.searchValue = event.target.value;
    }

    // Function to handle the Search button click event
    handleSearchForInput() {
        if (this.searchValue !== null && this.searchValue !== undefined && this.searchValue !== '') {
            this.mailingCityValue = this.searchValue;
            this.hasRendered = false;
            this.getWeatherInformation();
            this.searchValue = '';
            this.hasRendered = true;
        }
    }

    // Function to handle the Update button click event
    handleRecordUpdate() {
        if (this.searchValue !== null && this.searchValue !== undefined && this.searchValue !== '') {
            this.mailingCityValue = this.searchValue;
            this.hasRendered = false;
            this.getWeatherInformation();
            this.getAdditionalWeatherData();
            this.searchValue = '';
            this.hasRendered = true;
        }
    }
}
