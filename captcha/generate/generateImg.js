var path = require('path');
var gm = require('gm').subClass({imageMagick: true});

require('gm-base64'); // gm plugin for base64 output

const IMG_FILE_PATH = path.resolve(__dirname, 'timg.jpg');
const MASK_FILE_PATH = path.resolve(__dirname, 'mask.png');

const CROP_SIZE = 40;
const TEMP_IMG = '/tmp/temp.png';
const TEMP_MERGED_IMG ='/tmp/temp_merged.png';

function getRandomArea(width, height) {
  const centerX = (1 + Math.random()) * width / 2 - CROP_SIZE
  const centerY = (1 + Math.random()) * height / 2 - CROP_SIZE / 2
  const cropOffset = CROP_SIZE / 2
  const startX = Math.round(centerX - cropOffset)
  const startY = Math.round(centerY - cropOffset)
  const cropArea = [CROP_SIZE, CROP_SIZE, startX, startY]

  return cropArea
}

function generateImg () {
  const imgFile = gm(IMG_FILE_PATH);

  return new Promise((resolve, reject) => {
    imgFile.size((err, {width, height} = { width: 256, height: 93 }) => {
      if (err || !width || !height) {
        console.error('invalid image size !', err)
      }

      // 随机抠掉一块区域
      const cropArea = getRandomArea(width, height) // [CROP_SIZE, CROP_SIZE, startX, startY]
      const [size1, size2, startX, startY] = cropArea

      // 1、得到小块的待拖动图片
      imgFile.crop(...cropArea)
        .write(TEMP_IMG, function() {
        // merge mask
        gm(MASK_FILE_PATH).composite(TEMP_IMG)
        .in('-compose', 'In')
        .in('-geometry', `${size1}x${size2}+0+0`)
        .write(TEMP_IMG, function(err) {
          if (err) {
            console.error('create mask image failed !', err)
          }

          // 2、得到大的背景图
          gm(IMG_FILE_PATH)
            .noise('laplacian') // 增加噪点
            .append(TEMP_IMG, true)
            .write(TEMP_MERGED_IMG, function(err) {

              // 3、将背景图和拖动图组合成一张图片返回
              gm(TEMP_MERGED_IMG)
                .composite(TEMP_IMG)
                .in('-compose', 'Bumpmap')
                .in('-geometry', `${size1}x${size2}+${startX}+${startY}`)
                .toBase64('PNG', true, function(err, base64) {
                  if (err) {
                    console.error('create target image failed !', err)
                  }

                  resolve({
                    position: [startX, startY],
                    image: base64
                  });
                })
          })
        })
      })
    })
  })
}

module.exports = generateImg;

// generateImg();
