var path = require('path');
var gm = require('gm').subClass({imageMagick: true});

const IMG_FILE_PATH = path.resolve(__dirname, 'timg.jpg');
const CROP_SIZE = 40;
const TEMP_IMG = '/tmp/temp.jpg';

function getRandomArea(width, height) {
  const centerX = (1 + Math.random()) * width / 2 - CROP_SIZE
  const centerY = (1 + Math.random()) * height / 2 - CROP_SIZE / 2
  const cropOffset = CROP_SIZE / 2
  const startX = centerX - cropOffset
  const startY = centerY - cropOffset
  const cropArea = [CROP_SIZE, CROP_SIZE, startX, startY]

  return cropArea
}

function generateImg () {
  const imgFile = gm(IMG_FILE_PATH);

  return new Promise((resolve, reject) => {
    imgFile.size((err, {width, height} = { width: 256, height: 93 }) => {
      if (err || !width || !height) {
        console.error('invalid image size !', err)
        return reject('can not get image size');
      }

      const cropArea = getRandomArea(width, height) // [CROP_SIZE, CROP_SIZE, startX, startY]
      const [_, startX, startY] = cropArea

      // cropedImage
      imgFile.crop(...cropArea).write(TEMP_IMG, function(err) {
        if (err) {
          console.error(err)
        }

        imgFile.noise('laplacian')
          .append(TEMP_IMG, true)
          .region(...cropArea)
          .colorize(50, 50, 50) // 阴影区域
          .region(...getRandomArea(width, height))
          .colorize(10, 10, 10) // 混淆区域
          .region(...getRandomArea(width, height))
          .colorize(20, 20, 20) // 混淆区域
          .toBuffer('JPEG', function(err, buffer) {
          if (err) {
            console.error(err);
          }
          resolve({
            position: [startX, startY],
            image: buffer
          });
        })
      })
    })
  })
}

module.exports = generateImg;

// generateImg();
