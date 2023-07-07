// Populate variables from template variables 
const resultsUrl = "{{Urls.RESULT}}";
const errorUrl = "{{Urls.ERROR}}";
const timeoutMessage = "{{timeoutMessage}}";


// Call function from CDN https://github.com/companieshouse/cdn.ch.gov.uk/tree/04cfb43f714cf31bb0b7b85480d58f0e9b8c8e69/app/assets/javascripts/app/account-validation-web/file-upload.js
//@ts-ignore
setupForm(resultsUrl, errorUrl, timeoutMessage);

