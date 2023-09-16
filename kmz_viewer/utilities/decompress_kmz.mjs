/**
 * Utility for opening kmz files and decompressing contents
 */

import {
  createReadStream,
  readdirSync,
  existsSync,
  renameSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { Extract } from "unzipper";

const args = process.argv.slice(2);
if (!args.length)
  throw `Usage: node decompress_kmz.mjs <inputPath> [<outputPath>]`;

const inputPath = args[0];
const outputPath = args[1] || inputPath;

console.log(`Decompressing kmz files in ${inputPath} to ${outputPath}`);

async function decompressKmz(kmzFile, outputPath) {
  return new Promise((resolve, reject) => {
    const kmzStream = createReadStream(kmzFile);
    const unzipStream = Extract({ path: outputPath });

    kmzStream.pipe(unzipStream);

    kmzStream.on("error", (err) => {
      reject(err);
    });

    // once the files are fully written, resolve the promise
    unzipStream.on("finish", () => {
      resolve(outputPath);
    });
  });
}

async function decompressKmzFolder(inputPath, outputPath) {
  // Get all files in the input folder
  const files = readdirSync(inputPath);
  // Filter out non-kmz files
  const kmzFiles = files.filter((file) => file.endsWith(".kmz"));
  // Decompress each kmz file
  for (let kmzFile of kmzFiles) {
    await decompressKmz(join(inputPath, kmzFile), outputPath);
    // rename the doc.kml to match the original kmz file name
    const kmlFile = join(outputPath, "doc.kml");
    // file exists?
    if (existsSync(kmlFile)) {
      const newKmlFile = join(outputPath, kmzFile.replace(".kmz", ".kml"));
      renameSync(kmlFile, newKmlFile);
      // delete the original kmz file
      unlinkSync(join(outputPath, kmzFile));
    }
  }
}

// to enable top-level await in node:
// https://stackoverflow.com/questions/43686172/how-to-enable-top-level-await-in-node-js

await decompressKmzFolder(inputPath, outputPath);
