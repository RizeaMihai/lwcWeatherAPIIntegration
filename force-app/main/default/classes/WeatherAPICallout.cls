/**
 * Apex class to retrieve weather information from the Weather API.
 */
public class WeatherAPICallout {
    
    /**
         * Retrieves weather information from the Weather API for the specified location.
         * @param recordId the ID of the record to retrieve weather data for
         * @param recordCity the city to retrieve weather data for
         * @return A map of weather data, including temperature, weather code, precipitation probability, wind speed etc.
         * This method is exposed to the Lightning component framework for client-side access.
     */
    @AuraEnabled(Cacheable=true)
    public static Map<String, Object> getRecordWeatherInformation(Id recordId, String recordCity) {
        
        // Get the API key from a custom metadata type object
        WeatherAPI__mdt settings = WeatherAPI__mdt.getInstance('WeatherAPIKeyForMihai');
        if (settings == null || String.isBlank(settings.Key__c)) {
            throw new AuraHandledException('Invalid API key configuration.');
        }
        String apiKey = settings.key__c;
        
        // Format the location string to use in the API endpoint URL
        String formattedLocation = recordCity.replaceAll('\\s+', '+');
        
        // Create a new HTTP request object and set the endpoint URL
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:NC_WeatherAPI' + '/v1/forecast.json?q=' + formattedLocation + '&days=3&aqi=no&alerts=no&key=' + apiKey);
        request.setMethod('GET');
        
        // Send the HTTP request and store the response in a new HTTP response object
        HttpResponse response = http.send(request);
        
        // Check for errors in the response
        if (response.getStatusCode() != 200) {
            throw new AuraHandledException('Error calling Weather API: ' + response.getStatusCode() + ' ' + response.getStatus());
        }
        
        // Parse the response body into a map of weather data
        Map<String, Object> weatherData = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
        
        return weatherData;
    }

    /**
        Retrieves weather data for a given record in a specific city and returns it as a formatted string.
        This method is exposed to the Lightning component framework for client-side access.
        @param recordId the ID of the record to retrieve weather data for
        @param recordCity the city to retrieve weather data for
        @return a string containing formatted weather data for the specified record and city to be stored in the WheaterData__c
    */
    @AuraEnabled(Cacheable=true)
    public static String getWeatherDataToStoreInField(Id recordId, String recordCity) {
        // Call the existing method to retrieve the weather data
        Map<String, Object> weatherData = getRecordWeatherInformation(recordId, recordCity);
        
        // Extract the required data from the API response
        Map<String, Object> forecast = (Map<String, Object>)weatherData.get('forecast');
        Map<String, Object> location = (Map<String, Object>)weatherData.get('location');
        List<Object> forecastDays = (List<Object>)forecast.get('forecastday');
        Map<String, Object> tomorrowData = (Map<String, Object>)forecastDays.get(1);
        Map<String, Object> dayData = (Map<String, Object>)tomorrowData.get('day');
        Map<String, Object> astroData = (Map<String, Object>)tomorrowData.get('astro');
        
        // Format the necessary data into a string
        String formattedData = String.format('Additional weather data for ' + location.get('name') + ' on ' + tomorrowData.get('date') + ' \nCountry: {0} \nRegion: {1} \nSunrise at: {2} \nSunset at: {3} \nHighest Temperature: {4}\u00B0 C  \nLowest Temperature: {5}\u00B0 C \nHumidity: {6}% \nMax wind speed: {7} km/h \nDaily chance of rain: {8}%' , 
                                new Object[]{
                                    location.get('country'), 
                                    location.get('region'), 
                                    astroData.get('sunrise'), 
                                    astroData.get('sunset'), 
                                    dayData.get('maxtemp_c'), 
                                    dayData.get('mintemp_c'), 
                                    dayData.get('avghumidity'), 
                                    dayData.get('maxwind_kph'),
                                    dayData.get('daily_chance_of_rain')
                                });
        
        return formattedData;
    }
}
