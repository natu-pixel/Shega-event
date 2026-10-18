import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

// If using @ffmpeg-installer/ffmpeg, uncomment the next two lines:
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Converts a video file to an animated WebP.
 * @param {string} inputPath - Path to source video (mp4, mkv, mov, etc.)
 * @param {string} outputPath - Destination WebP file path
 * @param {object} options - Customization parameters
 */
function convertVideoToWebp(inputPath, outputPath, options = {}) {
  const {
    fps = 15,
    width = 720,
    quality = 75,
    compressionLevel = 6,
    loop = 0, // 0 = infinite, -1 = play once
  } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vcodec libwebp',
        `-filter:v fps=${fps},scale=${width}:-1:flags=lanczos`,
        '-lossless 0',
        `-compression_level ${compressionLevel}`,
        `-q:v ${quality}`,
        `-loop ${loop}`,
      ])
      .noAudio()
      .on('start', (cmd) => {
        console.log(`[FFmpeg] Started: ${cmd}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`[Progress] ${Math.round(progress.percent)}%\r`);
        }
      })
      .on('end', () => {
        console.log(`\n[Complete] Saved to: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('\n[Error] Conversion failed:', err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

// Example usage:
const input = path.resolve('./input.mp4');
const output = path.resolve('./output.webp');

convertVideoToWebp(input, output, {
  fps: 24,
  width: 1280,
  quality: 80,
});