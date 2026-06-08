import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

// -------------------------------------------------------------------
// Diagnostic counters (module-level, not state — no re-renders)
// -------------------------------------------------------------------
let _diagFrameTotal = 0;
let _diagFrameWithPose = 0;
let _diagFrameWithHands = 0;

export const useMediaPipe = (videoElement) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const poseLandmarkerRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    
    // Sequence buffer: stores up to 96 frames for sliding window
    const sequenceBuffer = useRef([]);

    useEffect(() => {
        let isMounted = true;
        
        const initMediaPipe = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
                );

                // Try GPU first, fall back to CPU if GPU fails (avoids silent black-frame detection)
                let poseLandmarker;
                try {
                    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1
                    });
                } catch (gpuErr) {
                    console.warn('[MediaPipe] GPU delegate failed, falling back to CPU:', gpuErr);
                    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
                            delegate: "CPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1
                    });
                }

                let handLandmarker;
                try {
                    handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 2
                    });
                } catch (gpuErr) {
                    console.warn('[MediaPipe] Hand GPU delegate failed, falling back to CPU:', gpuErr);
                    handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                            delegate: "CPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 2
                    });
                }

                if (isMounted) {
                    poseLandmarkerRef.current = poseLandmarker;
                    handLandmarkerRef.current = handLandmarker;
                    setIsReady(true);
                    console.log('[MediaPipe] Initialized successfully.');
                }
            } catch (err) {
                console.error("Failed to initialize MediaPipe:", err);
                if (isMounted) {
                    setError("Failed to load AI models for sign language detection.");
                }
            }
        };

        initMediaPipe();

        return () => {
            isMounted = false;
            if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
            if (handLandmarkerRef.current) handLandmarkerRef.current.close();
        };
    }, []);

    const processFrame = useCallback((timestamp) => {
        if (!isReady || !videoElement || !poseLandmarkerRef.current || !handLandmarkerRef.current) {
            return null;
        }

        // BUG FIX: Guard against video not ready (readyState < 2 means no frame data).
        // Without this check, MediaPipe runs on a black frame and produces all-zero landmarks,
        // which fills the 96-frame buffer with zeros before any real sign appears.
        if (videoElement.readyState < 2) {
            console.debug('[MediaPipe] Video not ready yet (readyState=%d), skipping frame.', videoElement.readyState);
            return null;
        }

        try {
            const poseResult = poseLandmarkerRef.current.detectForVideo(videoElement, timestamp);
            const handResult = handLandmarkerRef.current.detectForVideo(videoElement, timestamp);

            // --- Diagnostic counters ---
            _diagFrameTotal++;
            const poseDetected = poseResult.landmarks && poseResult.landmarks.length > 0;
            const handsDetected = handResult.landmarks && handResult.landmarks.length > 0;
            if (poseDetected) _diagFrameWithPose++;
            if (handsDetected) _diagFrameWithHands++;

            // Log detection rate every 90 frames (~3 seconds at 30fps)
            if (_diagFrameTotal % 90 === 0) {
                console.info(
                    '[MediaPipe] Detection rate — Pose: %d%% | Hands: %d%% | Total frames: %d',
                    Math.round((_diagFrameWithPose / _diagFrameTotal) * 100),
                    Math.round((_diagFrameWithHands / _diagFrameTotal) * 100),
                    _diagFrameTotal
                );
                // If pose detection rate < 50%, landmarks are mostly zeros → model gets garbage input
            }

            // Extract exactly 7 pose landmarks: Nose(0), L_Eye(2), R_Eye(5), L_Shoulder(11), R_Shoulder(12), L_Elbow(13), R_Elbow(14)
            let poseLandmarks;
            if (poseDetected) {
                const pose = poseResult.landmarks[0];
                poseLandmarks = [
                    [pose[0].x, pose[0].y, pose[0].z],
                    [pose[2].x, pose[2].y, pose[2].z],
                    [pose[5].x, pose[5].y, pose[5].z],
                    [pose[11].x, pose[11].y, pose[11].z],
                    [pose[12].x, pose[12].y, pose[12].z],
                    [pose[13].x, pose[13].y, pose[13].z],
                    [pose[14].x, pose[14].y, pose[14].z]
                ];
            } else {
                // BUG FIX: `new Array(7).fill([0, 0, 0])` fills all slots with the SAME
                // array reference. Use Array.from to create independent zero arrays.
                poseLandmarks = Array.from({ length: 7 }, () => [0, 0, 0]);
            }

            // Extract exactly 10 hand landmarks: Wrist(0), ThumbTip(4), IndexMCP(5), IndexTip(8),
            // MiddleMCP(9), MiddleTip(12), RingMCP(13), RingTip(16), PinkyMCP(17), PinkyTip(20)
            const getHand10 = (hand) => [
                [hand[0].x, hand[0].y, hand[0].z],
                [hand[4].x, hand[4].y, hand[4].z],
                [hand[5].x, hand[5].y, hand[5].z],
                [hand[8].x, hand[8].y, hand[8].z],
                [hand[9].x, hand[9].y, hand[9].z],
                [hand[12].x, hand[12].y, hand[12].z],
                [hand[13].x, hand[13].y, hand[13].z],
                [hand[16].x, hand[16].y, hand[16].z],
                [hand[17].x, hand[17].y, hand[17].z],
                [hand[20].x, hand[20].y, hand[20].z]
            ];

            // BUG FIX: Same shared-reference bug for hands. Use Array.from.
            let leftHandLandmarks  = Array.from({ length: 10 }, () => [0, 0, 0]);
            let rightHandLandmarks = Array.from({ length: 10 }, () => [0, 0, 0]);

            if (handsDetected) {
                handResult.handednesses.forEach((handedness, index) => {
                    // MediaPipe HandLandmarker predicts handedness based on image side.
                    // The training pipeline (conversion.py) maps 'Left' directly to left_hand
                    // and 'Right' directly to right_hand, so we must do the exact same here
                    // to match the training data perfectly, even if physical hands are inverted.
                    const isLeft  = handedness[0].categoryName === "Left";
                    const isRight = handedness[0].categoryName === "Right";
                    if (isLeft)  leftHandLandmarks  = getHand10(handResult.landmarks[index]);
                    if (isRight) rightHandLandmarks = getHand10(handResult.landmarks[index]);
                });
            }

            // Combine exactly 27 landmarks (7 Pose + 10 Left + 10 Right)
            const combinedFrame = [...poseLandmarks, ...leftHandLandmarks, ...rightHandLandmarks];
            
            // Sliding Window: push to buffer
            sequenceBuffer.current.push(combinedFrame);
            
            // Keep strictly the last 96 frames
            if (sequenceBuffer.current.length > 96) {
                sequenceBuffer.current.shift();
            }

            // Always return an object with the current length.
            // Only populate sequence if it is exactly 96 frames.
            return {
                sequence: sequenceBuffer.current.length === 96 ? [...sequenceBuffer.current] : null,
                length: sequenceBuffer.current.length
            };

        } catch (err) {
            console.error("Error processing frame:", err);
            return { sequence: null, length: 0 };
        }
    }, [isReady, videoElement]);

    const clearBuffer = useCallback(() => {
        sequenceBuffer.current = [];
        // Reset diagnostic counters on buffer clear
        _diagFrameTotal = 0;
        _diagFrameWithPose = 0;
        _diagFrameWithHands = 0;
    }, []);

    return { isReady, error, processFrame, clearBuffer };
};
