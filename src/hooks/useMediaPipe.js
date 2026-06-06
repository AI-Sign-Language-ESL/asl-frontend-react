import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

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

                const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1
                });

                const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                });

                if (isMounted) {
                    poseLandmarkerRef.current = poseLandmarker;
                    handLandmarkerRef.current = handLandmarker;
                    setIsReady(true);
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

        try {
            const poseResult = poseLandmarkerRef.current.detectForVideo(videoElement, timestamp);
            const handResult = handLandmarkerRef.current.detectForVideo(videoElement, timestamp);

            // Extract exactly 7 pose landmarks: Nose(0), L_Eye(2), R_Eye(5), L_Shoulder(11), R_Shoulder(12), L_Elbow(13), R_Elbow(14)
            let poseLandmarks = new Array(7).fill([0, 0, 0]);
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                const pose = poseResult.landmarks[0];
                poseLandmarks = [
                    [pose[0].x, pose[0].y, pose[0].z || 0],
                    [pose[2].x, pose[2].y, pose[2].z || 0],
                    [pose[5].x, pose[5].y, pose[5].z || 0],
                    [pose[11].x, pose[11].y, pose[11].z || 0],
                    [pose[12].x, pose[12].y, pose[12].z || 0],
                    [pose[13].x, pose[13].y, pose[13].z || 0],
                    [pose[14].x, pose[14].y, pose[14].z || 0]
                ];
            }

            // Extract exactly 10 hand landmarks: Wrist(0), ThumbTip(4), IndexMCP(5), IndexTip(8), MiddleMCP(9), MiddleTip(12), RingMCP(13), RingTip(16), PinkyMCP(17), PinkyTip(20)
            const getHand10 = (hand) => [
                [hand[0].x, hand[0].y, hand[0].z || 0],
                [hand[4].x, hand[4].y, hand[4].z || 0],
                [hand[5].x, hand[5].y, hand[5].z || 0],
                [hand[8].x, hand[8].y, hand[8].z || 0],
                [hand[9].x, hand[9].y, hand[9].z || 0],
                [hand[12].x, hand[12].y, hand[12].z || 0],
                [hand[13].x, hand[13].y, hand[13].z || 0],
                [hand[16].x, hand[16].y, hand[16].z || 0],
                [hand[17].x, hand[17].y, hand[17].z || 0],
                [hand[20].x, hand[20].y, hand[20].z || 0]
            ];

            let leftHandLandmarks = new Array(10).fill([0, 0, 0]);
            let rightHandLandmarks = new Array(10).fill([0, 0, 0]);

            if (handResult.landmarks && handResult.landmarks.length > 0) {
                handResult.handednesses.forEach((handedness, index) => {
                    // MediaPipe flips handedness by default (Left is Right), but we map by categoryName safely
                    const isLeft = handedness[0].categoryName === "Left";
                    const isRight = handedness[0].categoryName === "Right";
                    if (isLeft) leftHandLandmarks = getHand10(handResult.landmarks[index]);
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

            // Return the sequence if we have exactly 96 frames
            if (sequenceBuffer.current.length === 96) {
                return [...sequenceBuffer.current];
            }
            
            return null;

        } catch (err) {
            console.error("Error processing frame:", err);
            return null;
        }
    }, [isReady, videoElement]);

    const clearBuffer = useCallback(() => {
        sequenceBuffer.current = [];
    }, []);

    return { isReady, error, processFrame, clearBuffer };
};
