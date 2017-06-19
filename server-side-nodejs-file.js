//What your seeing here in a stripped down version of my actualy node.js file. I'm removing everything that is not required 
//the to make the AWS.S3 properly work for the sake a clarity.

//this allows you to store your credentials in a seperate .env file
var dotenv;
if (process.env.NODE_ENV !== 'production') {
    dotenv = require('dotenv').config();
}
//constants
const S3_BUCKET = process.env.S3_BUCKET;
var bucketRegion = 'us-east-1';

//the IDENTITY_POOL_ID variable store in the .env file has a colon in it, so I had to save the string before & after the 
//colon as two seperate strings and then join them again in the js file.
const IDENTITY_POOL_ID_1 = process.env.IDENTITY_POOL_ID_1;
const IDENTITY_POOL_ID_2 = process.env.IDENTITY_POOL_ID_2;
const IDENTITY_POOL_ID = IDENTITY_POOL_ID_1 + ':' + IDENTITY_POOL_ID_2;
console.log(IDENTITY_POOL_ID);
//constants

//requires
var express = require('express');

//Here is where you will need your IDENTITY_POOL_ID. My file wouldn't upload unless I specified the signatureVersion: 'v4'.
var AWS = require('aws-sdk');
AWS.config.update({
    region: bucketRegion,
    signatureVersion: 'v4',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IDENTITY_POOL_ID
    })
});
var multer = require("multer");
var fs = require('fs');
var bodyParser = require('body-parser');

var app = express();
//requires

//configuration / variables
var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: {
        Bucket: S3_BUCKET,
    }
});

if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

//This is how we're going to store the image on to the server once the client uploads it. We store it on the server first, 
//then upload it to S3, so you will most likely have to delete these files from your server.
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public'); // set the destination on your server
    },
    filename: function (req, file, callback) {
        console.log('From var storage = multer.diskStorage({\n');
        console.log(file);
        
        //if everything goes well and multer grabbed your file (image) you should see a console.log of the file that 
        //looks like the below
        //        fieldname: 'picture',
        //        originalname: 'elhartista_01_50.jpg',
        //        encoding: '7bit',
        //        mimetype: 'image/jpeg'
        
        //the below code formats the name that will be given to the file when it is saved to local (server) storage
        //to something like this: 2017-06-19-4-11_elhartista_01_50_50.jpg
        var timeStamp = Date.now();
        var timeStamp = new Date();
        var dd = timeStamp.getDate();
        var mm = timeStamp.getMonth() + 1; //January is 0!
        var yyyy = timeStamp.getFullYear();
        var hours = timeStamp.getHours();
        var mins = timeStamp.getMinutes();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        timeStamp = yyyy + '-' + mm + '-' + dd + '-' + hours + '-' + mins;
        callback(null, timeStamp + '_' + file.originalname); // set the file name and extension
    }
});

//you will use this variable here in your app.post() route.
var upload = multer({
    storage: storage
});
//configuration / variables

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//Routes 
app.get('/', function (request, response) {
    response.render('pages/index');
});

//this is the route where I stored my client side HTML with embedded JS. You can't see it here (since I removed it) but I'm using the Handlebars templating engine. You may or may not need to know handlebars to understand this example.
app.get('/upload', function (req, res) {
    res.render('pages/upload');
});

//notice how we are passing the multer storage configuration variable 'upload' as the second argument. 
//the 'picture' in single('picture') needs to be the 'name' of the input field from the HTML form. 
//i.e. <input type="file" name="picture" ...
app.post('/s3', upload.single('picture'), function (req, res, next) {
    console.log("From app.post('/s3', upload.single('picture'), function (req, res, next) {\n");
    console.log(req.file);
    
    //if you log your req.file now, you should get the below log
    //{
    //    fieldname: 'picture',
    //    originalname: 'elhartista_01_50.jpg',
    //    encoding: '7bit',
    //    mimetype: 'image/jpeg',
    //    destination: './public',
    //    filename: '1497684199323.jpg',
    //    path: 'public/1497684199323.jpg',
    //    size: 54902
    //}

    var file = req.file;

    //----------------------------------------------------------------
    // Read in the file, convert it to base64, store to S3
    fs.readFile(file.path, function (err, data) {
        var key = file.filename;
        var fileType = file.mimetype;
        if (err) {
            throw err;
        }
        
        //this is absolutely key here, if you don't convert the image file to binary base 64, Amazon will not accept it
        var base64data = new Buffer(data, 'binary');
        
        
        s3.upload({
            Bucket: S3_BUCKET,
            Key: key,               //the file name
            Body: base64data,       //the actual picture itself 
            ContentType: fileType,  //'image/jpeg' or png
            ACL: 'public-read'      //makes the file public so others can see it
        }, function (resp) {
            console.log(arguments);
            console.log('Successfully uploaded package.');
        });
        
        //if everything went well and you actually uploaded the file to your S3 bucket, you get confirmation by logging out 
        //the resp from amazon, it will look like the below.
        //{
        //            '0': null,
        //            '1': {
        //                ETag: '"dbbdfaaca237e0ce413c9dddc1343c58"',
        //                Location: 'https://s3.us-east-2.amazonaws.com/prescriptions-lynsight/2017-06-19-4-11_elhartista_01_50_50.jpg',
        //                key: '2017-06-19-4-11_elhartista_01_50_50.jpg',
        //                Key: '2017-06-19-4-11_elhartista_01_50_50.jpg',
        //                Bucket: 'lynsight'
        //            }
        //}
    });
    res.status(200).end();
    //-----------------------------------------------------------------------
});

//Listen for requests
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
