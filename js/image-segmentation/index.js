import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision";
const { ImageSegmenter, FilesetResolver } = vision;

import Camera from "./camera.js";

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');

const camera = new Camera(video, 640, 480);

function callbackForVideo(segmentationResult){
    /**
     * this function is called for each frame of the video
     * segmentationResult is an array of segmentation masks
     * each mask is a 1D array of size width video * height video
     */
     
    // adjust the canvas size to the video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // draw the video on the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // get the canvas data
    const canvasVideoData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // get the segmentation mask for the current frame
    const segmentationMask = segmentationResult[0];

    // remove the background from the canvas data using the segmentation mask
    const pixelCount = segmentationMask.length;
    for (let i = 0; i < pixelCount; i++) {
        const maskValue = segmentationMask[i];
        const isBackground = maskValue === 0;
        if(isBackground){
            canvasVideoData.data[i * 4 + 0] = 0;
            canvasVideoData.data[i * 4 + 1] = 0;
            canvasVideoData.data[i * 4 + 2] = 0;
            canvasVideoData.data[i * 4 + 3] = 255;
        }
    }
    ctx.putImageData(canvasVideoData, 0, 0); // display the segmentation results back on the canvas
}

btnStart.addEventListener('click', async () => {
    /**
     * 1. load wasm file
     * 2. load model
     * 3. start camera
     * 4. for each frame of the video, call segmentForVideo
     * 5. in the callback, draw the segmentation mask on the canvas
     */

    const visionWasmFile = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
    const modelAssetPath = "https://storage.googleapis.com/mediapipe-tasks/image_segmenter/selfie_segmentation.tflite" 

    const segmenterOptions = {
        runningMode: "VIDEO",
        baseOptions: {
            modelAssetPath: modelAssetPath,
        },
    }
    const vision = await FilesetResolver.forVisionTasks(visionWasmFile);
    const segmenter = await  ImageSegmenter.createFromOptions(vision, segmenterOptions)

    await camera.start();
    camera.onFrame(()=> {
        let nowMs = performance.now();
        segmenter.segmentForVideo(video, nowMs, callbackForVideo);
    });

});

btnStop.addEventListener('click', () =>  camera.stop()); 

