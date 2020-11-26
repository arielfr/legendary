const fs = require('fs');
const parser = require('subtitles-parser');
const moment = require('moment');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const utils = require('./utils');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobePath);

const subtitlePath = './subtitles';
const srtFiles = new RegExp('\.srt$');

// Get all the subtitles files
const subtitles = fs.readdirSync(subtitlePath).filter(files => srtFiles.exec(files));

async function main() {
  const episodeToProcess = [];
  const batchPromises = [];

  subtitles.forEach(subtitle => {
    const subFile = fs.readFileSync(`${subtitlePath}/${subtitle}`, 'latin1');
    const parsed = parser.fromSrt(subFile, false);

    const subsFound = findLegendaries(parsed);

    if (subsFound.length > 0) {
      episodeToProcess.push({
        name: subtitle,
        subtitles: subsFound,
      });
    }
  });

  console.log(JSON.stringify(episodeToProcess, '', 2));

  episodeToProcess.forEach(episode => {
    const episodeRegex = new RegExp('S[0-9]*E[0-9]*')
    const videoFile = episode.name.replace('.srt', '.mkv');

    episode.subtitles.forEach((sub, subIndex) => {
      const startTime = sub.startTime.replace(',', '.');
      const endTime = sub.endTime.replace(',', '.');

      const t1 = moment(startTime, "hh:mm:ss.SSS");
      const t2 = moment(endTime, "hh:mm:ss.SSS");
      const duration = moment.duration(t2.diff(t1));

      batchPromises.push({
        func: cutVideo,
        params: [videoFile, startTime, duration.seconds(), `${episodeRegex.exec(episode.name)[0]}-${subIndex}.mkv`],
      });
    });
  });

  // Check if the folder exists, if not, create it
  if (!fs.existsSync('output')) {
    fs.mkdirSync('output');
  }

  await utils.batch(batchPromises, 1, 'Cutting Videos');
}

main();

function findLegendaries(subtitle) {
  const subtitlesFound = [];
  let currentSubtitle = {};

  subtitle.forEach(sub => {
    const starWaitForItTime = new RegExp('(legen$|legen[\s|\"|\.|\!|\-].*)');
    const endWaitForItTime = new RegExp('[\\s|\"|\.|¡|\-]dari[o|a]|^dari[o|a]');
    const completeLegendary = new RegExp('legendario|legendaria');
    const text = normalizeSub(sub.text);

    if (starWaitForItTime.exec(text) !== null) {
      if (Object.keys(currentSubtitle).length !== 0) {
        console.log('A Legendary was started but never ended');

        subtitlesFound.push(currentSubtitle);
        currentSubtitle = {};
      }

      currentSubtitle = {
        startTime: sub.startTime,
        endTime: sub.endTime,
        subs: [sub],
      };
    } else if (endWaitForItTime.exec(text) !== null) {
      if (Object.keys(currentSubtitle).length === 0) {
        console.log('A Legendary is closing but never started');
      } else {
        const startTime = currentSubtitle.startTime.replace(',', '.');
        const endTime = sub.endTime.replace(',', '.');

        const t1 = moment(startTime, "hh:mm:ss.SSS");
        const t2 = moment(endTime, "hh:mm:ss.SSS");
        const duration = moment.duration(t2.diff(t1));

        // If the duration is more than 10 seconds, split the video
        if (duration.seconds() > 10) {
          subtitlesFound.push(currentSubtitle);
          subtitlesFound.push(sub);
        } else {
          currentSubtitle.endTime = sub.endTime;
          currentSubtitle.subs.push(sub);
          subtitlesFound.push(currentSubtitle);
        }
        currentSubtitle = {};
      }
    } else if (completeLegendary.exec(text) !== null) {
      if (Object.keys(currentSubtitle).length !== 0) {
        console.log('A Legendary was started but never ended');

        subtitlesFound.push(currentSubtitle);
        currentSubtitle = {};
      }

      subtitlesFound.push({
        startTime: sub.startTime,
        endTime: sub.endTime,
        subs: [sub],
      });
    }
  });

  if (Object.keys(currentSubtitle).length !== 0) {
    console.log('A Legendary was started but never ended');
    subtitlesFound.push(currentSubtitle);
    currentSubtitle = {};
  }

  return subtitlesFound;
}

function normalizeSub(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function cutVideo(src, start, duration, output) {
  return new Promise((resolve, reject) => {
    console.log(`${__dirname}/episodes/${src}`)
    console.log(`${__dirname}/output/${output}`)

    ffmpeg(`${__dirname}/episodes/${src}`)
      .seekInput(start)
      .duration(duration + 1)
      .output(`${__dirname}/output/${output}`)
      .on('end', function(err) {
        if(!err)
        {
          resolve();
        }
      })
      .on('error', function(err){
        reject(err);
      }).run();
  });
}
