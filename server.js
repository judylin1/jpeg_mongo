var express = require('express');
var app = express();
var mongoose = require('mongoose');
var multer = require('multer');
var Imagemin = require('imagemin');
var fs = require('fs');
var Schema = mongoose.Schema;
var async = require('async');

// app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.static(__dirname + '/static'));

var imgs = ['jpeg'];
var dbConnect = process.env.MONGOLAB_URI || 'mongodb://localhost/Images';

mongoose.connect(dbConnect, function (err, res) {
  if (err) {
    console.log('ERROR connecting to: ' + dbConnect + '. ' + err);
  } else {
    console.log('Succeeded connected to: ' + dbConnect);
  }
});

// Image Data Schema
var ImageDataSchema = new Schema({
  url: {type: String, trim: true},
  thumb: {type: String, trim: true},
  bin: {type: String, trim: true},
  contentType: {type: String, trim: true}
});

// Exclude bin(ar), version and _id from result set being returned to the UI
ImageDataSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.imgId = ret._id;
    delete ret.__v;
    delete ret._id;
    delete ret.bin;
  }
});

var ImageSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  kind: {
    type: String,
    enum: ['thumbnail', 'detail']
  },
  url: {type: String, trim: true},
  createdAt: {type: Date, required: true, default: Date.now()},
  imgs: [ImageDataSchema]
});

// Create schema index
ImageSchema.index({createdAt: 1});

// Create ImageSchema model
var ImgModel = mongoose.model("Image", ImageSchema);

// Exclude bin(ar), version and _id from result set being returned to the UI
ImageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.photoId = ret._id;
    delete ret.data;
    delete ret.__v;
    delete ret._id;
  }
});

app.configure(function () {
  app.use(function (req, res, next) {
    var handler = multer({
      inMemory: false,
      dest: './static/tmp/',
      limits: {
        fileSize: 5 * 1024 * 1024,
        fieldNameSize: 100,
        files: 5,
        fields: 8
      },
      onFileUploadComplete: function (file) {
        console.log(file.originalname + ' finished...');
      },
      onError: function (error, next) {
        console.log(error);
        next(error);
      },
      onFileSizeLimit: function (file) {
        console.log('Failed: ', file.originalname)
        fs.unlink('./' + file.path) // delete the partially written file
      },
      onFileUploadStart: function (file) {
        if (imgs.indexOf(file.extension) == -1) {
          console.log(file.extension + ' not supported: ')
          return false;
        }
      }
    });
    handler(req, res, next);
  });
});

// Handle uploading of new images
app.post('/api/upload', function (req, res) {
  if (Object.keys(req.files).length === 0) {
    res.statusCode = 500;
    return res.send({error: 'Server error'});
  } else {
    // Step 2. Iterate files and update img when optimisation is completed
    var fileList = [].concat(req.files.userFile);
    var minifiedBaseImages = [];
    async.each(fileList, function (fileItem, done) {
      // Create imagemin and optimize uploaded files
      var imagemin = new Imagemin()
        .src(fileItem.path)
        .use(Imagemin.jpegtran({progressive: true}))
      // When files have finished processing, update new img
      imagemin.run(function (err, files) {
        if (err) {
          console.log('Error on optmization!' + err);
        }
        files.forEach(function (tmpFile) {
          minifiedBaseImages.push(new Buffer(tmpFile.contents).toString('base64'));
        });
        done();
      });
      }, function (err) {
          if (err) {
            console.log('error during minfication', err)
            return next(err);
          }
          // Create new img
          var img = new ImgModel({
            name: {last: 'SomeUsername'},
            createdAt: Date.now()
          })
          // Append optmized images
          for (var x = 0; x < minifiedBaseImages.length; x++) {
            img.imgs.push({bin: minifiedBaseImages[x]});
          }
          // Save img with everything in it
          img.save(function (err) {
            if (!err) {
              console.log("Image compressed.");
            } else {
              console.log(err);
              return next(err);
            }
          });
      });
      res.statusCode = 200;
      res.json({ success: true });
  }
});

// Show ALL imgs restricted to 10 and sorted descending
app.get('/api/tasks', function (req, res) {
  return ImgModel.find(function (err, images) {
    if (err || !images) {
      res.statusCode = 500;
      return res.json({error: 'Server Error'});
    } else {
      return res.json(images);
    }
  }).sort([['createdAt', 'descending']]).limit(10);
});

// Show a specific img
app.get('/api/tasks/:photoId', function (req, res) {
  return ImgModel.findById(req.param('photoId'), function (err, image) {
    if (err || !image) {
      res.statusCode = 500;
      return res.json({error: 'Image not found'});
    } else {
      return res.json(image);
    }
  });
});

// Show image details belonging to a img
app.get('/api/task/:photoId/image/:imgId', function (req, res) {
  return ImgModel.findById(req.param('photoId'), function (err, image) {
    if (err || !image) {
      res.statusCode = 500;
      return res.json({error: 'Image not found'});
    } else {
      var img = image.imgs.id(req.params.imgId);
      if (err || !img) {
        res.statusCode = 500;
        return res.json({error: 'Image not found'});
      } else {
        var base64Image = new Buffer(img.bin, 'base64');
        res.writeHead(200, {'Content-Length': base64Image.length, 'Content-Type': 'image/jpeg'});
        res.end(base64Image);
      }
    }
  });
});

var server = app.listen(3000, function () {
  console.log('Listening on port %d', server.address().port);
});
