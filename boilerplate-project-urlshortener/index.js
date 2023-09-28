require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const mySecret = process.env['DB_URL'];
require('body-parser')
const dns = require('dns');

mongoose.connect(mySecret, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const URLSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true, unique: true }

})

let urlModel = mongoose.model('Url', URLSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;

  const urlRecord = await urlModel.findOne({ short_url: shortUrl });

  if (urlRecord) {
    res.redirect(urlRecord.original_url);
  } else {
    res.json({ error: 'Short URL not found' });
  }
});


// Your first API endpoint
app.post('/api/shorturl', async (req, res) => {
  try {
    const oriUrl = req.body.url;
    let urlObj = new URL(oriUrl);
    
  dns.lookup(urlObj.hostname, async (err, address) => {
    if (!address) {
      res.json({ error: 'Invalid Url' });
    } else {
      const shortUrl = Math.floor(Math.random() * 1000).toString();
      const data = new urlModel({
        original_url: urlObj.href,
        short_url: shortUrl
      });

      await data.save();

      res.json({
        original_url: urlObj.href,
        short_url: shortUrl
      })

    }
  })
  } catch (err) {
    res.json({ error: 'Invalid Url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
