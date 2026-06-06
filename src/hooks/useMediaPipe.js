import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HolisticLandmarker } from '@mediapipe/tasks-vision';
// Wait, HolisticLandmarker is in @mediapipe/tasks-vision?
// As of recent versions, it's PoseLandmarker, HandLandmarker, FaceLandmarker. 
// Or maybe we use Holistic if available.
// If not, we can just use PoseLandmarker and HandLandmarker.
// Actually, let's look at what the API expects. If we can't know, let's extract Pose and Hand, and combine them. 
// However, the standard is often 21 hand landmarks + 6 pose landmarks (wrist, elbow, shoulder for left and right arm).
// Pose landmarks indices: 
// 11: left shoulder, 12: right shoulder
// 13: left elbow, 14: right elbow
// 15: left wrist, 16: right wrist
// That's exactly 6!
// 6 + 21 (right hand) = 27 landmarks!
// So it expects 6 pose landmarks and 21 hand landmarks.

// Let's implement this!

import { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';

export const useMediaPipe = (videoElement) => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const poseLandmarkerRef = useRef(null);
    const handLandmarkerRef = useRef(null);
    
    // Sequence buffer: stores up to 96 frames
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

            // Extract 6 pose landmarks (11 to 16)
            let poseLandmarks = new Array(6).fill([0, 0, 0]);
            if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                const pose = poseResult.landmarks[0];
                poseLandmarks = [
                    [pose[11].x, pose[11].y, pose[11].z || 0],
                    [pose[12].x, pose[12].y, pose[12].z || 0],
                    [pose[13].x, pose[13].y, pose[13].z || 0],
                    [pose[14].x, pose[14].y, pose[14].z || 0],
                    [pose[15].x, pose[15].y, pose[15].z || 0],
                    [pose[16].x, pose[16].y, pose[16].z || 0]
                ];
            }

            // Extract 21 hand landmarks (prefer right hand, fallback to left, then zeros)
            let handLandmarks = new Array(21).fill([0, 0, 0]);
            if (handResult.landmarks && handResult.landmarks.length > 0) {
                // Find right hand if possible
                let targetHand = handResult.landmarks[0];
                if (handResult.handednesses && handResult.handednesses.length > 1) {
                    const rightHandIndex = handResult.handednesses.findIndex(h => h[0].categoryName === "Right");
                    if (rightHandIndex !== -1) {
                        targetHand = handResult.landmarks[rightHandIndex];
                    }
                }
                
                handLandmarks = targetHand.map(l => [l.x, l.y, l.z || 0]);
            }

            // Combine exactly 27 landmarks
            const combinedFrame = [...poseLandmarks, ...handLandmarks];
            
            // Add to buffer
            sequenceBuffer.current.push(combinedFrame);
            
            // Keep only last 96 frames
            if (sequenceBuffer.current.length > 96) {
                sequenceBuffer.current.shift();
            }

            // If we have 96 frames exactly, we can return the sequence
            if (sequenceBuffer.current.length === 96) {
                // Return a copy of the sequence
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
