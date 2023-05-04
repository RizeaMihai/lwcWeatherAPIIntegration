# Salesforce - Weather API LWC

## ![Weather API](https://cdn.weatherapi.com/v4/images/weatherapi_logo.png) Brief overview of the LWC that utilizes the Weather API integration (find out more at [Weather Api](https://www.weatherapi.com/)).

This is a Lightning Web Component (LWC) that allows users to search for minimum weather data based on a valid city name. It also provides an option to update the **`WeatherData`** field with additional data, based on the search that the user makes.

## **Features**

- Search for minimum weather data based on a valid city name.
- Update the **`WeatherData`** field with additional data based on the search.
- Update the **`Mailing City`** field on the Contact record.
- Handle invalid city name search and display a specific image with a text message to inform the user that they have searched for an invalid city. The record update will not take place in this case.

## **Usage**

To use this component, you can drag and drop it onto a Lightning page or a record page.

## **Implementation**

This component uses the OpenWeather API to fetch the weather data for a given city name. It also uses the Salesforce standard features to update the **`Mailing City`** field on the Contact record.

## **Credits**

This component was developed by Mihai Rizea.
