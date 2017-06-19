# How-to-upload-images-to-Amazon-S3
I will walk you through the excruciatingly painful process of uploading an image to your Amazon S3 account and hopefully try to make it a little less painful and time consuming for you.

1. What you will need to do on Amazon AWS:

  a. Get your credentials, you will need your: Cognito Identity Credential known as the Identity Pool Id.
    You will use this string as the value that will be needed in the below server side code:
      credentials: new AWS.CognitoIdentityCredentials({
          IdentityPoolId: IDENTITY_POOL_ID
      })
    
  b. Make sure you set the CORS configurations on your bucket, I have mine set to 
    <?xml version="1.0" encoding="UTF-8"?>
    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
    </CORSConfiguration>

2. You will need the following dependencies (I belive these to be the bare minimum to make this work but I will upload my main node.js start file so you can see all of the ones I'm using in case I miss one here):
  var multer = require("multer");
  var fs = require('fs');
  var AWS = require('aws-sdk');
  
3. I will post both the server side node.js file and the client side upload-page.html as well and clearly label each as such so that you can see exatcly what code goes where. Now please go look at the code, this is a real working example that I am currently using on my site Lynsight.  
